import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

// Minimal typings for the YouTube IFrame Player API (https://developers.google.com/youtube/iframe_api_reference).
interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  mute(): void;
  unMute(): void;
  getPlayerState(): number;
  getCurrentTime(): number;
  getDuration(): number;
  destroy(): void;
}
interface YTStateEvent {
  data: number;
  target: YTPlayer;
}
interface YTNamespace {
  Player: new (
    el: HTMLElement,
    opts: {
      host?: string;
      videoId: string;
      width?: string | number;
      height?: string | number;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (e: { target: YTPlayer }) => void;
        onStateChange?: (e: YTStateEvent) => void;
        onError?: (e: { data: number }) => void;
      };
    },
  ) => YTPlayer;
  PlayerState: { ENDED: 0; PLAYING: 1; PAUSED: 2; BUFFERING: 3; CUED: 5 };
}
declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace> | null = null;

function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT!);
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => {
      apiPromise = null;
      reject(new Error('Could not load the YouTube player'));
    };
    document.head.appendChild(script);
  });
  return apiPromise;
}

export type PlaybackEventType = 'play' | 'pause' | 'progress' | 'seek' | 'ended' | 'hidden' | 'visible';

/** Ads play for at most this long; anything past it is cut. */
export const AD_MAX_SECONDS = 30;
/** Minimum viewing before the host should unlock the review (the player itself just reports time). */
export const AD_MIN_SECONDS = 29;

interface YouTubeAdPlayerProps {
  videoId: string;
  onWatchedChange?: (watchedSeconds: number) => void;
  /** Same event vocabulary as POST /interactions/{id}/events, for server-side verification. */
  onPlaybackEvent?: (type: PlaybackEventType, position: number) => void;
}

const POLL_MS = 250;
const AUTOPLAY_CHECK_MS = 1500;
const TOLERANCE_S = 1.5; // mirrors CLOCK_TOLERANCE_S in the verification service

const YT_ERRORS: Record<number, string> = {
  2: 'Invalid YouTube video ID.',
  5: 'This video cannot be played in the embedded player.',
  100: 'This video was removed or is private.',
  101: 'The owner of this video does not allow embedding.',
  150: 'The owner of this video does not allow embedding.',
};

/**
 * Embedded YouTube ad player. It starts on its own, cannot be paused or scrubbed by the viewer, and
 * is cut at AD_MAX_SECONDS. Watched time only accrues for real forward playback. Playback pauses
 * while the tab is hidden (so time can't be farmed in the background) and resumes when it returns.
 */
export const YouTubeAdPlayer: React.FC<YouTubeAdPlayerProps> = ({
  videoId,
  onWatchedChange,
  onPlaybackEvent,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [watched, setWatched] = useState(0);

  // Keep the latest callbacks without re-creating the player.
  const cbRef = useRef({ onWatchedChange, onPlaybackEvent });
  cbRef.current = { onWatchedChange, onPlaybackEvent };

  useEffect(() => {
    let cancelled = false;
    let poll: ReturnType<typeof setInterval> | undefined;
    let autoplayCheck: ReturnType<typeof setTimeout> | undefined;
    let lastPos = 0;
    let lastTick = 0;
    let total = 0;
    let done = false;
    const emit = (type: PlaybackEventType, pos: number) => cbRef.current.onPlaybackEvent?.(type, pos);

    const stopPolling = () => {
      if (poll) clearInterval(poll);
      poll = undefined;
    };
    const tick = () => {
      const p = playerRef.current;
      if (!p) return;
      const now = performance.now();
      const pos = p.getCurrentTime() || 0;
      const advance = pos - lastPos;
      const elapsed = (now - lastTick) / 1000;
      if (advance > 0 && advance <= elapsed + TOLERANCE_S) {
        total = Math.min(AD_MAX_SECONDS, total + advance);
        setWatched(total);
        cbRef.current.onWatchedChange?.(total);
      }
      lastPos = pos;
      lastTick = now;
      emit('progress', pos);
      if (pos >= AD_MAX_SECONDS || total >= AD_MAX_SECONDS) finish(pos);
    };

    // Cut the ad: stop playback for good once the cap is reached or the video ends.
    const finish = (pos: number) => {
      if (done) return;
      done = true;
      stopPolling();
      playerRef.current?.pauseVideo();
      // The poll misses the first fraction of a second after playback starts. If viewing was
      // continuous up to the cut, credit it in full so the ad counts as completely watched.
      const reached = Math.min(pos, AD_MAX_SECONDS);
      if (total < reached && total >= reached - TOLERANCE_S) {
        total = reached;
        setWatched(total);
        cbRef.current.onWatchedChange?.(total);
      }
      setFinished(true);
      emit('ended', pos);
    };

    const onVisibility = () => {
      const p = playerRef.current;
      if (!p) return;
      if (document.hidden) {
        emit('hidden', p.getCurrentTime() || 0);
        p.pauseVideo();
      } else {
        emit('visible', p.getCurrentTime() || 0);
        if (!done) p.playVideo();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled || !mountRef.current) return;
        playerRef.current = new YT.Player(mountRef.current, {
          host: 'https://www.youtube-nocookie.com',
          videoId,
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 1,
            start: 0,
            end: AD_MAX_SECONDS,
            controls: 0,
            disablekb: 1,
            fs: 0,
            rel: 0,
            playsinline: 1,
            iv_load_policy: 3,
            modestbranding: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (e) => {
              if (cancelled) return;
              setReady(true);
              e.target.playVideo();
              // Browsers block autoplay with sound unless the page has enough user engagement.
              // If the unmuted start was refused, start muted; the viewer can unmute.
              autoplayCheck = setTimeout(() => {
                const p = playerRef.current;
                if (!p || done || p.getPlayerState() === YT.PlayerState.PLAYING) return;
                p.mute();
                setMuted(true);
                p.playVideo();
              }, AUTOPLAY_CHECK_MS);
            },
            onError: (e) => setError(YT_ERRORS[e.data] ?? 'The video could not be played.'),
            onStateChange: (e) => {
              const pos = e.target.getCurrentTime() || 0;
              if (done) {
                if (e.data === YT.PlayerState.PLAYING) e.target.pauseVideo();
                return;
              }
              if (e.data === YT.PlayerState.PLAYING) {
                lastPos = pos;
                lastTick = performance.now();
                emit('play', pos);
                if (!poll) poll = setInterval(tick, POLL_MS);
              } else if (e.data === YT.PlayerState.ENDED) {
                tick();
                finish(pos);
              } else if (e.data === YT.PlayerState.PAUSED) {
                tick();
                stopPolling();
                emit('pause', pos);
                // Viewers can't pause ads: resume right away unless the tab is in the background.
                if (!done && !document.hidden) e.target.playVideo();
              }
            },
          },
        });
      })
      .catch((e: Error) => !cancelled && setError(e.message));

    return () => {
      cancelled = true;
      stopPolling();
      if (autoplayCheck) clearTimeout(autoplayCheck);
      document.removeEventListener('visibilitychange', onVisibility);
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [videoId]);

  const toggleMute = () => {
    const p = playerRef.current;
    if (!p) return;
    if (muted) p.unMute();
    else p.mute();
    setMuted(!muted);
  };

  const pct = Math.min(100, (watched / AD_MAX_SECONDS) * 100);

  return (
    <div className="space-y-2">
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-[#26294a]">
        {/* The IFrame API replaces this div with the player iframe. */}
        <div className="absolute inset-0">
          <div ref={mountRef} className="w-full h-full" />
        </div>
        {/* Swallows clicks so the viewer can't pause the video or open YouTube links. */}
        <div className="absolute inset-0" aria-hidden="true" />
        {finished && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-xs font-semibold text-emerald-300">
            Ad complete
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/90 text-xs text-rose-300 text-center">
            {error}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleMute}
          disabled={!ready || !!error || finished}
          className="shrink-0 w-8 h-8 rounded-full bg-[#201c44] border border-[#3f317e] flex items-center justify-center text-[#c7b4fd] hover:text-white disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          aria-label={muted ? 'Unmute ad' : 'Mute ad'}
        >
          {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
        <div className="flex-1">
          <div className="h-1.5 rounded-full bg-[#1d203a] overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#7d5dfc] to-emerald-400 transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <span className="shrink-0 text-[11px] font-mono text-[#a488ff]">
          {Math.min(Math.floor(watched), AD_MAX_SECONDS)}s / {AD_MAX_SECONDS}s
        </span>
      </div>
    </div>
  );
};
