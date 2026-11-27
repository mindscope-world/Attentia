import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Play, 
  Star, 
  X, 
  ArrowRight, 
  Filter, 
  Check, 
  AlertCircle,
  HelpCircle,
  Award
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { DashboardTask } from '../../types';
import { PlaybackEventType, YouTubeAdPlayer } from '../YouTubeAdPlayer';

// Playback events are sent to the server in batches. The server credits watched time from real
// forward playback only, so batches must be frequent enough to stay within its clock tolerance.
const EVENT_FLUSH_MS = 2500;
const PROGRESS_EVENT_MIN_GAP_MS = 1000;

export const TasksTab: React.FC = () => {
  const { 
    tasks, 
    completedToday, 
    dailyTotalQuota, 
    rewardPerTask, 
    startTask,
    sendPlaybackEvents,
    submitTask,
    userProfile,
    hasActivePackage,
    isLoading,
    loadError,
    setActiveTab,
  } = useDashboard();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeModalTask, setActiveModalTask] = useState<DashboardTask | null>(null);
  // Server-side interaction for the open task: its id and the viewing time the server requires.
  const [session, setSession] = useState<{ id: string; required: number } | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [earnedReward, setEarnedReward] = useState<number | null>(null);
  const eventBuffer = useRef<{ type: PlaybackEventType; position: number }[]>([]);
  const lastProgressAt = useRef(0);

  // Modal interactive state
  const [countdown, setCountdown] = useState<number>(10);
  const [timerFinished, setTimerFinished] = useState<boolean>(false);
  // 0 = not rated yet; a 1–5 star rating is required before submitting.
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Set when the server rejected the attempt: it is final for today.
  const [rejectedFinal, setRejectedFinal] = useState(false);

  const categories = ['All', ...Array.from(new Set(tasks.map((t) => t.category))).sort()];

  const filteredTasks = tasks.filter(t => 
    selectedCategory === 'All' || t.category === selectedCategory
  );

  const remainingQuota = Math.max(0, dailyTotalQuota - completedToday);
  const progressPercent = dailyTotalQuota ? Math.min(100, Math.round((completedToday / dailyTotalQuota) * 100)) : 0;

  const requiredViewing = session?.required ?? 0;

  const flushEvents = async () => {
    if (!session || !eventBuffer.current.length) return;
    const batch = eventBuffer.current.splice(0);
    await sendPlaybackEvents(session.id, batch);
  };

  // Reset modal state and, for non-video creatives, run the viewing countdown.
  useEffect(() => {
    if (!activeModalTask || !session) return;
    setCountdown(Math.ceil(session.required));
    setTimerFinished(false);
    setSelectedOption('');
    setSelectedRating(0);
    setFeedbackText('');
    setEarnedReward(null);
    setErrorMsg(null);
    setSubmitSuccess(false);
    setRejectedFinal(false);
    eventBuffer.current = [];

    // Video ads unlock on watched time reported by the player, not on a wall-clock countdown.
    if (activeModalTask.youtubeId) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimerFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeModalTask, session]);

  // Send buffered playback events to the server while the ad plays.
  useEffect(() => {
    if (!session) return;
    const timer = setInterval(() => void flushEvents(), EVENT_FLUSH_MS);
    return () => clearInterval(timer);
  }, [session]);

  const handleOpenTask = async (task: DashboardTask) => {
    if (task.status !== 'available' || startingId) return;
    setStartError(null);
    setStartingId(task.id);
    try {
      const started = await startTask(task.id);
      setSession({ id: started.interactionId, required: started.requiredSeconds });
      setActiveModalTask(task);
    } catch (e) {
      setStartError(e instanceof Error ? e.message : 'Could not start this task.');
    } finally {
      setStartingId(null);
    }
  };

  const closeModal = () => {
    void flushEvents();
    setActiveModalTask(null);
    setSession(null);
  };

  const handlePlaybackEvent = (type: PlaybackEventType, position: number) => {
    if (type === 'progress') {
      const now = performance.now();
      if (now - lastProgressAt.current < PROGRESS_EVENT_MIN_GAP_MS) return;
      lastProgressAt.current = now;
    }
    eventBuffer.current.push({ type, position });
  };

  const handleWatchedChange = (watched: number) => {
    if (!activeModalTask || !session) return;
    setCountdown(Math.max(0, Math.ceil(session.required - watched)));
    if (watched >= session.required) {
      setTimerFinished(true);
      setErrorMsg(null);
    }
  };

  const handleSubmitTask = async () => {
    if (!activeModalTask || !session) return;
    if (!timerFinished) {
      setErrorMsg('Please finish the required viewing time before submitting.');
      return;
    }
    if (selectedRating < 1 || selectedRating > 5) {
      setErrorMsg('Please rate the ad from 1 to 5 stars before submitting.');
      return;
    }
    if (!selectedOption) {
      setErrorMsg('Please select an option to submit your verification.');
      return;
    }
    if (activeModalTask.requiresFeedback && feedbackText.trim().length < 10) {
      setErrorMsg('Please write at least 10 characters of feedback.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    await flushEvents(); // make sure the server has the latest playback position
    const result = await submitTask(session.id, selectedRating, selectedOption, feedbackText.trim());
    setIsSubmitting(false);

    if (result.ok) {
      setEarnedReward(result.reward ?? 0);
      setSubmitSuccess(true);
      setTimeout(() => {
        setActiveModalTask(null);
        setSession(null);
        setSubmitSuccess(false);
      }, 1500);
    } else {
      // The server verdict is final for today: show why, then let the participant close.
      setErrorMsg(`Not verified: ${result.message}`);
      setRejectedFinal(true);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header & Daily Quota Tracker */}
      <div className="rounded-3xl bg-[#121326] border border-[#232646] p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-[#a488ff] bg-[#221c4b] px-3 py-1 rounded-full border border-[#3e317d]">
                DAILY SPONSOR ENGAGEMENT
              </span>
              <span className="text-xs text-emerald-400 font-mono">
                +${rewardPerTask.toFixed(2)} USDT / Task
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
              Tasks & Attention Campaigns
            </h1>
            <p className="text-xs sm:text-sm text-[#8a91b4] mt-1">
              Engage with sponsored creatives, provide constructive feedback, and claim your tier allocation instantly.
            </p>
          </div>

          <div className="bg-[#0c0d1b] border border-[#1f223f] rounded-2xl p-4 flex items-center gap-5 shrink-0">
            <div>
              <span className="text-[11px] text-[#71789c] block">Today's Completed Quota</span>
              <span className="text-xl font-extrabold text-white font-mono">
                {completedToday} / {dailyTotalQuota}
              </span>
            </div>
            <div className="h-8 w-[1px] bg-[#1d203a]" />
            <div>
              <span className="text-[11px] text-[#71789c] block">Remaining Quota</span>
              <span className="text-xl font-extrabold text-emerald-400 font-mono">
                {remainingQuota} tasks
              </span>
            </div>
          </div>
        </div>

        {/* Quota Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#848ba8]">
              {userProfile.tier.toUpperCase()} Package Quota ({dailyTotalQuota} Tasks Daily Maximum)
            </span>
            <span className="font-mono text-[#a589ff] font-bold">{progressPercent}% Claimed</span>
          </div>
          <div className="w-full h-3 rounded-full bg-[#171933] overflow-hidden p-0.5 border border-[#23264c]">
            <div
              className="h-full bg-gradient-to-r from-[#6b45f6] to-[#9977ff] rounded-full transition-all duration-500 shadow-sm shadow-[#734eff]/50"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {!hasActivePackage && !isLoading && (
        <div className="rounded-2xl bg-amber-950/30 border border-amber-800/50 p-4 text-xs text-amber-200 flex flex-wrap items-center justify-between gap-3">
          <span>You need an active participation package to earn rewards from tasks.</span>
          <button
            onClick={() => setActiveTab('deposits-withdrawals')}
            className="px-3 py-1.5 rounded-lg bg-amber-900/50 hover:bg-amber-800/60 border border-amber-700/50 font-bold cursor-pointer"
          >
            Choose a package
          </button>
        </div>
      )}
      {(startError || loadError) && (
        <div role="alert" className="rounded-2xl bg-rose-950/40 border border-rose-800/50 p-4 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{startError ?? loadError}</span>
        </div>
      )}

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-[#25284e] text-white border border-[#484f88] shadow-md'
                : 'bg-[#121326] text-[#7e85a6] border border-[#1d203b] hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Task Cards Grid */}
      {!isLoading && filteredTasks.length === 0 && (
        <p className="py-12 text-center text-sm text-[#71789c]">No sponsored tasks are available right now. Check back soon.</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.map((task) => {
          const isDone = task.status !== 'available';
          return (
            <div
              key={task.id}
              className={`rounded-3xl border p-6 flex flex-col justify-between transition-all duration-200 ${
                isDone
                  ? 'bg-[#0f1020]/70 border-[#1c1e36] opacity-75'
                  : 'bg-[#121326] border-[#25294a] hover:border-[#3d4277] shadow-xl hover:-translate-y-1'
              }`}
            >
              <div>
                {/* Card Header */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#a488ff] bg-[#1f1b40] px-2.5 py-0.5 rounded border border-[#3c3175]">
                      {task.category}
                    </span>
                    {task.isDemo && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/50">
                        Demo
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-mono font-bold text-emerald-400">
                    <span>+${task.reward.toFixed(2)}</span>
                    <span className="text-[10px] text-[#71789c]">USDT</span>
                  </div>
                </div>

                <div className="text-[11px] text-[#6d7496] mb-1 font-medium">
                  Sponsor: <span className="text-white">{task.sponsor}</span>
                </div>

                <h3 className="text-base font-bold text-white mb-2 leading-snug">
                  {task.title}
                </h3>

                <p className="text-xs text-[#878eaecb] leading-relaxed mb-4">
                  {task.description}
                </p>
              </div>

              <div className="pt-4 border-t border-[#1e213e] space-y-4">
                <div className="flex items-center justify-between text-xs text-[#71789c]">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#9a7ffd]" />
                    <span>{task.durationSeconds}s viewing</span>
                  </span>
                  <span className="flex items-center gap-1 text-[#8b92b6]">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>Proof of Attention</span>
                  </span>
                </div>

                {isDone ? (
                  task.status === 'rejected' ? (
                    <div className="w-full py-2.5 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      <span>Not verified today</span>
                    </div>
                  ) : (
                    <div className="w-full py-2.5 rounded-xl bg-[#112022] border border-emerald-800/40 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Completed & Credited</span>
                    </div>
                  )
                ) : (
                  <button
                    onClick={() => handleOpenTask(task)}
                    disabled={!!startingId}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#6b45f6] to-[#8f6dff] hover:from-[#7651fc] hover:to-[#9f80ff] text-white text-xs font-bold transition-all shadow-md shadow-[#734eff]/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{startingId === task.id ? 'Starting…' : 'Engage & Earn'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Task Verification Modal */}
      {activeModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[#131427] border-2 border-[#2f335b] shadow-2xl p-6 sm:p-8 text-left">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#212443] mb-5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#a488ff] bg-[#221c4b] px-2.5 py-0.5 rounded border border-[#3e317d]">
                  {activeModalTask.category}
                </span>
                <span className="text-xs text-[#71789c]">
                  Sponsor: <strong className="text-white">{activeModalTask.sponsor}</strong>
                </span>
                {activeModalTask.isDemo && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/50">
                    Demonstration content
                  </span>
                )}
              </div>

              <button
                onClick={closeModal}
                className="p-1.5 rounded-xl text-[#7c83a4] hover:text-white hover:bg-[#1f213d] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Task Content / Simulation Creative Area */}
            <div className="rounded-2xl bg-[#0b0c16] border border-[#212440] p-5 mb-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm sm:text-base font-bold text-white">
                  {activeModalTask.title}
                </h4>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                  +${activeModalTask.reward.toFixed(2)} USDT
                </span>
              </div>

              <p className="text-xs text-[#959cb9] leading-relaxed">
                {activeModalTask.description}
              </p>

              {activeModalTask.youtubeId && (
                <YouTubeAdPlayer
                  key={activeModalTask.id}
                  videoId={activeModalTask.youtubeId}
                  onWatchedChange={handleWatchedChange}
                  onPlaybackEvent={handlePlaybackEvent}
                />
              )}

              {/* Countdown / viewing status */}
              <div className="p-4 rounded-xl bg-[#141527] border border-[#26294a] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#201c44] border border-[#3f317e] flex items-center justify-center text-xs font-mono font-bold text-[#c7b4fd]">
                    {countdown}s
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      {timerFinished ? 'Required viewing verified' : 'Active Engagement Countdown'}
                    </span>
                    <span className="text-[10px] text-[#71789c]">
                      {timerFinished
                        ? 'You may now submit your review'
                        : activeModalTask.youtubeId
                          ? 'Watch the ad to unlock your review'
                          : 'Please review the creative parameters'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Feedback & Comprehension Poll */}
            <div className="space-y-4">
              {/* Rating Component */}
              <div>
                <label className="text-xs font-semibold text-white block mb-1.5">
                  {activeModalTask.ratingPrompt} <span className="text-rose-400" aria-hidden="true">*</span>
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => {
                        setSelectedRating(star);
                        setErrorMsg(null);
                      }}
                      aria-label={`Rate ${star} out of 5 stars`}
                      aria-pressed={selectedRating === star}
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        selectedRating >= star
                          ? 'bg-[#231b4b] border-[#7d5dfc] text-amber-400'
                          : 'bg-[#0e0f1e] border-[#1f223d] text-[#4d5371] hover:text-white'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${selectedRating >= star ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                  <span className="text-xs font-mono text-[#a488ff] ml-2">
                    {selectedRating ? `${selectedRating} / 5 Stars` : 'Rating required'}
                  </span>
                </div>
              </div>

              {/* Poll question: the server requires a valid answer for every task */}
              {(
                <div>
                  <label className="text-xs font-semibold text-white block mb-2">
                    {activeModalTask.question}
                  </label>
                  <div className="space-y-2">
                    {activeModalTask.options.map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedOption(opt)}
                        className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between cursor-pointer ${
                          selectedOption === opt
                            ? 'bg-[#231e4e] border-[#7858fc] text-white shadow-md'
                            : 'bg-[#0f1020] border-[#1e213d] text-[#878eaecb] hover:text-white'
                        }`}
                      >
                        <span>{opt}</span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          selectedOption === opt ? 'border-[#7858fc] bg-[#7858fc]' : 'border-gray-600'
                        }`}>
                          {selectedOption === opt && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeModalTask.requiresFeedback && (
                <div>
                  <label className="text-xs font-semibold text-white block mb-1.5" htmlFor="task-feedback">
                    Written feedback <span className="text-rose-400" aria-hidden="true">*</span>
                  </label>
                  <textarea
                    id="task-feedback"
                    rows={3}
                    maxLength={2000}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Tell the sponsor what you thought (at least 10 characters)"
                    className="w-full bg-[#0f1020] border border-[#1e213d] rounded-xl p-3 text-xs text-white focus:border-[#7858fc] outline-none"
                  />
                </div>
              )}

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Submit CTA */}
              {rejectedFinal ? (
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full py-3.5 rounded-full bg-[#1d203b] hover:bg-[#282c52] text-white text-xs font-bold tracking-wide border border-[#2e335b] cursor-pointer"
                >
                  Close
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitTask}
                  disabled={isSubmitting || submitSuccess}
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#6b45f6] to-[#8f6dff] hover:from-[#7651fc] hover:to-[#9f80ff] text-white text-xs font-bold tracking-wide transition-all shadow-lg shadow-[#734eff]/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Verifying with the server…</span>
                  ) : submitSuccess ? (
                    <span className="flex items-center gap-1.5 text-white">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Reward credited (+${(earnedReward ?? 0).toFixed(2)} USDT)!
                    </span>
                  ) : (
                    <>
                      <span>Submit Evaluation & Claim +${activeModalTask.reward.toFixed(2)} USDT</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
