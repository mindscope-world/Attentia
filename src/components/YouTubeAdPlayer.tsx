import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';

// Minimal typings for the YouTube IFrame Player API (https://developers.google.com/youtube/iframe_api_reference).
interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
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

interface YouTubeAdPlayerProps {
  videoId: string;
  /** Seconds of genuine viewing needed before the task can be submitted. */
  requiredSeconds: number;
  onWatchedChange?: (watchedSeconds: number) => void;
  /** Same event vocabulary as POST /interactions/{id}/events, for server-side verification. */
  onPlaybackEvent?: (type: PlaybackEventType, position: number) => void;
}

const POLL_MS = 500;
const TOLERANCE_S = 1.5; // mirrors CLOCK_TOLERANCE_S in the verification service

const YT_ERRORS: Record<number, string> = {
  2: 'Invalid YouTube video ID.',
  5: 'This video cannot be played in the embedded player.',
  100: 'This video was removed or is private.',
  101: 'The owner of this video does not allow embedding.',
  150: 'The owner of this video does not allow embedding.',
};

/**
 * Embedded YouTube ad player. Native controls are hidden so participants cannot scrub ahead;
 * watched time only accrues for real forward playback, and playback pauses when the tab is hidden.
 */
export const YouTubeAdPlayer: React.FC<YouTubeAdPlayerProps> = ({
  videoId,
  requiredSeconds,
  onWatchedChange,
  onPlaybackEvent,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [watched, setWatched] = useState(0);

  // Keep the latest callbacks without re-creating the player.
  const cbRef = useRef({ onWatchedChange, onPlaybackEvent });
  cbRef.current = { onWatchedChange, onPlaybackEvent };

  useEffect(() => {
    let cancelled = false;
    let poll: ReturnType<typeof setInterval> | undefined;
    let lastPos = 0;
    let lastTick = 0;
    let total = 0;
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
        total += advance;
        setWatched(total);
        cbRef.current.onWatchedChange?.(total);
      }
      lastPos = pos;
      lastTick = now;
      emit('progress', pos);
    };

    const onVisibility = () => {
      const p = playerRef.current;
      if (!p) return;
      if (document.hidden) {
        emit('hidden', p.getCurrentTime() || 0);
        p.pauseVideo();
      } else {
        emit('visible', p.getCurrentTime() || 0);
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
            onReady: () => !cancelled && setReady(true),
            onError: (e) => setError(YT_ERRORS[e.data] ?? 'The video could not be played.'),
            onStateChange: (e) => {
              const pos = e.target.getCurrentTime() || 0;
              if (e.data === YT.PlayerState.PLAYING) {
                setPlaying(true);
                lastPos = pos;
                lastTick = performance.now();
                emit('play', pos);
                if (!poll) poll = setInterval(tick, POLL_MS);
              } else if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.ENDED) {
                tick();
                stopPolling();
                setPlaying(false);
                emit(e.data === YT.PlayerState.ENDED ? 'ended' : 'pause', pos);
              }
            },
          },
        });
      })
      .catch((e: Error) => !cancelled && setError(e.message));

    return () => {
      cancelled = true;
      stopPolling();
      document.removeEventListener('visibilitychange', onVisibility);
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [videoId]);

  const togglePlay = () => {
    const p = playerRef.current;
    if (!p) return;
    if (playing) p.pauseVideo();
    else p.playVideo();
  };

  const pct = Math.min(100, (watched / Math.max(1, requiredSeconds)) * 100);

  return (
    <div className="space-y-2">
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-[#26294a]">
        {/* The IFrame API replaces this div with the player iframe. */}
        <div className="absolute inset-0">
          <div ref={mountRef} className="w-full h-full" />
        </div>
        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/90 text-xs text-rose-300 text-center">
            {error}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          disabled={!ready || !!error}
          className="shrink-0 w-8 h-8 rounded-full bg-[#201c44] border border-[#3f317e] flex items-center justify-center text-[#c7b4fd] hover:text-white disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          aria-label={playing ? 'Pause ad' : 'Play ad'}
        >
          {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
        </button>
        <div className="flex-1">
          <div className="h-1.5 rounded-full bg-[#1d203a] overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#7d5dfc] to-emerald-400 transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <span className="shrink-0 text-[11px] font-mono text-[#a488ff]">
          {Math.min(Math.floor(watched), requiredSeconds)}s / {requiredSeconds}s
        </span>
      </div>
    </div>
  );
};
