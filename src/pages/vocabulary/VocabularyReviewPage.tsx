import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { vocabularyReviewService } from "../../services/vocabulary-review.service";
import type {
  ReviewDashboard,
  ReviewFeedback,
  ReviewScope,
  ReviewSession,
  ReviewSettings,
  ReviewSkill,
  ReviewSummary,
} from "../../types/vocabulary-review.types";
import { useAuth } from "../../hooks/useAuth";
import "./VocabularyReviewPage.css";

const defaultSettings: ReviewSettings = {
  mode: "SMART_REVIEW",
  scope: "SMART_QUEUE",
  selectionMode: "WORD_COUNT",
  wordCount: 10,
  topicIds: [],
  skillFocus: "ADAPTIVE",
  intensity: "STANDARD",
  autoPlayAudio: false,
  showPhonetic: true,
  includeMastered: true,
};
const scopeLabels: Record<ReviewScope, string> = {
  SMART_QUEUE: "Hàng đợi thông minh",
  DUE_ONLY: "Từ đến hạn",
  WEAK_WORDS: "Từ đang yếu",
  RECENTLY_LEARNED: "Vừa học",
  MISTAKES: "Từng trả lời sai",
  BOOKMARKED: "Đã đánh dấu",
  MASTERED_CHECK: "Kiểm tra từ đã vững",
  FREE_REVIEW: "Ôn tự do",
};
const skillLabels: Record<ReviewSkill, string> = {
  ADAPTIVE: "Tự điều chỉnh",
  MEANING: "Ghi nhớ nghĩa",
  LISTENING: "Nghe",
  SPELLING: "Chính tả",
  CONTEXT: "Ngữ cảnh",
};
const reasonLabels: Record<string, string> = {
  NEVER_REVIEWED: "Chưa từng ôn",
  OVERDUE: "Đã quá hạn",
  FREQUENTLY_WRONG: "Thường trả lời sai",
  LOW_MASTERY: "Độ thành thạo thấp",
  SLOW_RECALL: "Phản xạ còn chậm",
  LAPSED: "Dễ quên lại",
  DUE_TODAY: "Đến hạn hôm nay",
  BOOKMARKED: "Đã đánh dấu",
  STABLE: "Đang ổn định",
};

function Icon({
  name,
}: {
  name:
    | "spark"
    | "clock"
    | "target"
    | "trend"
    | "bookmark"
    | "sound"
    | "close"
    | "check";
}) {
  const paths = {
    spark: "M12 2l2.2 6.1L20 10l-5.8 2L12 18l-2.2-6L4 10l5.8-1.9L12 2Z",
    clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4v5l3.5 2",
    target: "M12 3a9 9 0 1 0 9 9M12 7a5 5 0 1 0 5 5M12 10a2 2 0 1 0 2 2",
    trend: "m4 16 5-5 4 4 7-8M15 7h5v5",
    bookmark: "M6 3h12v18l-6-4-6 4V3Z",
    sound:
      "M5 10v4h3l4 4V6L8 10H5Zm10-2c1.3 1 2 2.3 2 4s-.7 3-2 4m2.5-10.5A9 9 0 0 1 21 12a9 9 0 0 1-3.5 6.5",
    close: "M5 5l14 14M19 5 5 19",
    check: "m5 12 4 4L19 6",
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}

export default function VocabularyReviewPage() {
  const navigate = useNavigate();
  const { updateCachedUser } = useAuth();
  const [dashboard, setDashboard] = useState<ReviewDashboard | null>(null);
  const [screen, setScreen] = useState<
    "HOME" | "SETUP" | "PRACTICE" | "SUMMARY"
  >("HOME");
  const [settings, setSettings] = useState<ReviewSettings>(defaultSettings);
  const [session, setSession] = useState<ReviewSession | null>(null);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDashboard(await vocabularyReviewService.getDashboard());
    } catch {
      setError("Không thể tải dữ liệu ôn tập. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const start = async (override?: Partial<ReviewSettings>) => {
    setLoading(true);
    setError(null);
    try {
      const created = await vocabularyReviewService.createSession({
        ...settings,
        ...override,
      });
      setSession(created);
      setScreen("PRACTICE");
    } catch {
      setError(
        "Không có từ phù hợp với lựa chọn này hoặc phiên không thể bắt đầu.",
      );
    } finally {
      setLoading(false);
    }
  };
  const resume = async (id: string) => {
    setLoading(true);
    try {
      setSession(await vocabularyReviewService.getSession(id));
      setScreen("PRACTICE");
    } catch {
      setError("Phiên cũ không còn khả dụng.");
      void loadDashboard();
    } finally {
      setLoading(false);
    }
  };
  const finish = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const result = await vocabularyReviewService.complete(session.id);
      setSummary(result.summary);
      if (result.rewards.totalXp !== undefined)
        updateCachedUser({
          stats: {
            totalXp: result.rewards.totalXp,
            level: result.rewards.level,
            currentStreak: result.rewards.currentStreak,
          },
        });
      setScreen("SUMMARY");
    } catch {
      setError("Chưa thể hoàn thành phiên ôn tập.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !dashboard && screen === "HOME")
    return (
      <main className="review-page">
        <div className="review-skeleton" />
        <div className="review-grid">
          {[1, 2, 3].map((i) => (
            <div className="review-skeleton review-skeleton--card" key={i} />
          ))}
        </div>
      </main>
    );
  if (screen === "PRACTICE" && session)
    return (
      <Practice
        session={session}
        onSession={setSession}
        onComplete={finish}
        onExit={async (discard) => {
          await vocabularyReviewService.exit(session.id, discard);
          setScreen("HOME");
          setSession(null);
          void loadDashboard();
        }}
      />
    );
  if (screen === "SUMMARY" && summary)
    return (
      <Summary
        summary={summary}
        onHome={() => {
          setScreen("HOME");
          setSummary(null);
          void loadDashboard();
        }}
        onRetry={() => void start({ scope: "MISTAKES", mode: "SMART_REVIEW" })}
      />
    );
  return (
    <main className="review-page">
      {error && (
        <div className="review-error" role="alert">
          <span>{error}</span>
          <button
            onClick={() => {
              setError(null);
              void loadDashboard();
            }}
          >
            Thử lại
          </button>
        </div>
      )}
      {screen === "SETUP" ? (
        <Setup
          dashboard={dashboard}
          settings={settings}
          onChange={setSettings}
          onBack={() => setScreen("HOME")}
          onStart={() => void start()}
          loading={loading}
        />
      ) : (
        dashboard && (
          <>
            <section className="review-hero">
              <div className="review-hero__copy">
                <span className="review-kicker">
                  <Icon name="spark" /> ÔN TẬP HÔM NAY
                </span>
                <h1>
                  {dashboard.dueToday
                    ? `Bạn có ${dashboard.dueToday} từ cần ôn`
                    : "Bạn đã hoàn thành lịch hôm nay"}
                </h1>
                <p>
                  {dashboard.dueToday
                    ? `Khoảng ${dashboard.estimatedMinutes} phút · ${dashboard.weakCount} từ đang cần chú ý`
                    : "Bạn có thể luyện từ yếu hoặc kiểm tra nhanh những từ đã vững."}
                </p>
                <div className="review-actions">
                  <button
                    className="review-primary"
                    onClick={() => void start()}
                    disabled={loading}
                  >
                    Bắt đầu ôn thông minh
                  </button>
                  <button
                    className="review-secondary"
                    onClick={() => setScreen("SETUP")}
                  >
                    Tùy chỉnh phiên
                  </button>
                </div>
              </div>
              <div className="review-goal">
                <div
                  className="review-goal__ring"
                  style={
                    {
                      "--goal": `${dashboard.goal.completed ? 100 : Math.min(100, (dashboard.goal.progress / dashboard.goal.target) * 100)}%`,
                    } as React.CSSProperties
                  }
                >
                  <strong>{dashboard.goal.progress}</strong>
                  <span>/{dashboard.goal.target}</span>
                </div>
                <p>
                  {dashboard.goal.completed ? "Đã hoàn thành mục tiêu hôm nay" : `Mục tiêu ${dashboard.goal.type === "WORDS" ? "từ" : "phút"} hôm nay`}
                </p>
                <div className="review-goal__options">
                  <button
                    onClick={async () => {
                      await vocabularyReviewService.setGoal("WORDS", 10);
                      void loadDashboard();
                    }}
                  >
                    10 từ
                  </button>
                  <button
                    onClick={async () => {
                      await vocabularyReviewService.setGoal("MINUTES", 5);
                      void loadDashboard();
                    }}
                  >
                    5 phút
                  </button>
                </div>
              </div>
            </section>
            {dashboard.activeSession && (
              <section className="resume-banner">
                <div>
                  <strong>Phiên trước vẫn đang được lưu</strong>
                  <span>
                    {dashboard.activeSession.answered}/
                    {dashboard.activeSession.total} câu đã hoàn thành
                  </span>
                </div>
                <button
                  onClick={() => void resume(dashboard.activeSession!.id)}
                >
                  Tiếp tục phiên
                </button>
              </section>
            )}
            <section className="review-stats" aria-label="Thống kê ôn tập">
              {[
                ["Cần ôn", dashboard.dueToday, "clock"],
                ["Đang yếu", dashboard.weakCount, "target"],
                ["Đã vững", dashboard.masteredCount, "check"],
                ["Chính xác 7 ngày", `${dashboard.accuracy7Days}%`, "trend"],
              ].map(([label, value, icon]) => (
                <article key={String(label)}>
                  <span className="review-stat-icon">
                    <Icon name={icon as "clock"} />
                  </span>
                  <div>
                    <strong>{value}</strong>
                    <span>{label}</span>
                  </div>
                </article>
              ))}
            </section>
            {!!dashboard.suggestions.length && (
              <section className="review-section">
                <div className="review-section__heading">
                  <div>
                    <span>ĐỀ XUẤT CHO BẠN</span>
                    <h2>Phiên học phù hợp lúc này</h2>
                  </div>
                </div>
                <div className="suggestion-grid">
                  {dashboard.suggestions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() =>
                        void start({
                          mode: s.mode,
                          scope: s.scope,
                          topicIds: s.topicIds,
                          skillFocus: s.skillFocus,
                          wordCount: s.id === "weak" ? 8 : 10,
                        })
                      }
                    >
                      <Icon name="spark" />
                      <strong>{s.title}</strong>
                      <span>{s.reason}</span>
                      <small>{s.estimatedMinutes} phút</small>
                    </button>
                  ))}
                </div>
              </section>
            )}
            <section className="review-columns">
              <div className="review-section">
                <div className="review-section__heading">
                  <div>
                    <span>CẦN CHÚ Ý</span>
                    <h2>Những từ nên củng cố</h2>
                  </div>
                  <button onClick={() => setScreen("SETUP")}>
                    Xem tùy chỉnh
                  </button>
                </div>
                <div className="attention-list">
                  {dashboard.attentionWords.map((word) => (
                    <article key={word.vocabularyId}>
                      <div className="attention-word">
                        <strong>{word.word}</strong>
                        <span>{word.phonetic}</span>
                        <p>{word.meaning}</p>
                      </div>
                      <div className="attention-meta">
                        <span className="reason-pill">
                          {reasonLabels[word.reason] ?? word.reason}
                        </span>
                        <div
                          className="mastery"
                          aria-label={`Mastery ${word.mastery}/5`}
                        >
                          {[1, 2, 3, 4, 5].map((n) => (
                            <i
                              key={n}
                              className={n <= word.mastery ? "active" : ""}
                            />
                          ))}
                        </div>
                      </div>
                      <button
                        className={`bookmark ${word.isBookmarked ? "active" : ""}`}
                        aria-label={
                          word.isBookmarked ? "Bỏ đánh dấu" : "Đánh dấu từ khó"
                        }
                        onClick={async () => {
                          await vocabularyReviewService.bookmark(
                            word.vocabularyId,
                            !word.isBookmarked,
                          );
                          void loadDashboard();
                        }}
                      >
                        <Icon name="bookmark" />
                      </button>
                    </article>
                  ))}
                </div>
              </div>
              <aside className="review-side">
                <section>
                  <h3>Lịch ôn sắp tới</h3>
                  {[
                    ["Hôm nay", dashboard.schedule.today],
                    ["Ngày mai", dashboard.schedule.tomorrow],
                    ["3 ngày tới", dashboard.schedule.next3Days],
                    ["7 ngày tới", dashboard.schedule.next7Days],
                  ].map(([label, value]) => (
                    <div className="schedule-row" key={String(label)}>
                      <span>{label}</span>
                      <strong>{value} từ</strong>
                    </div>
                  ))}
                </section>
                <section>
                  <h3>Kỹ năng</h3>
                  {dashboard.skills.map((skill) => (
                    <div className="skill-row" key={skill.skill}>
                      <div>
                        <span>{skillLabels[skill.skill as ReviewSkill]}</span>
                        <strong>
                          {skill.attempts
                            ? `${skill.accuracy}%`
                            : "Chưa có dữ liệu"}
                        </strong>
                      </div>
                      <i>
                        <b style={{ width: `${skill.accuracy}%` }} />
                      </i>
                    </div>
                  ))}
                </section>
              </aside>
            </section>
            <button
              className="review-back-link"
              onClick={() => navigate("/vocabularies/learned")}
            >
              Quay về kho từ vựng
            </button>
          </>
        )
      )}
    </main>
  );
}

function Setup({
  dashboard,
  settings,
  onChange,
  onBack,
  onStart,
  loading,
}: {
  dashboard: ReviewDashboard | null;
  settings: ReviewSettings;
  onChange: (value: ReviewSettings) => void;
  onBack: () => void;
  onStart: () => void;
  loading: boolean;
}) {
  const patch = (value: Partial<ReviewSettings>) =>
    onChange({ ...settings, ...value });
  return (
    <section className="review-setup">
      <header>
        <button onClick={onBack} aria-label="Quay lại">
          ←
        </button>
        <div>
          <span>TÙY CHỈNH PHIÊN</span>
          <h1>Bạn muốn luyện như thế nào?</h1>
          <p>
            Mặc định đã được tối ưu; bạn chỉ cần thay đổi những phần thực sự
            cần.
          </p>
        </div>
      </header>
      <div className="setup-block">
        <h2>Chế độ</h2>
        <div className="option-grid option-grid--three">
          {(
            [
              [
                "SMART_REVIEW",
                "Ôn thông minh",
                "Tự chọn dạng bài theo năng lực",
              ],
              [
                "QUICK_PRACTICE",
                "Luyện nhanh",
                "Câu hỏi nhận biết, khoảng 3 phút",
              ],
              ["TEST_MODE", "Kiểm tra", "Không phản hồi cho đến cuối phiên"],
            ] as const
          ).map(([value, title, desc]) => (
            <button
              className={settings.mode === value ? "selected" : ""}
              onClick={() => patch({ mode: value })}
              key={value}
            >
              <strong>{title}</strong>
              <span>{desc}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="setup-block">
        <h2>Nhóm từ</h2>
        <div className="chip-list">
          {(Object.keys(scopeLabels) as ReviewScope[]).map((scope) => (
            <button
              className={settings.scope === scope ? "selected" : ""}
              onClick={() => patch({ scope })}
              key={scope}
            >
              {scopeLabels[scope]}
            </button>
          ))}
        </div>
      </div>
      <div className="setup-split">
        <div className="setup-block">
          <h2>Quy mô phiên</h2>
          <div className="toggle">
            <button
              className={
                settings.selectionMode === "WORD_COUNT" ? "selected" : ""
              }
              onClick={() => patch({ selectionMode: "WORD_COUNT" })}
            >
              Theo số từ
            </button>
            <button
              className={settings.selectionMode === "TIME" ? "selected" : ""}
              onClick={() => patch({ selectionMode: "TIME" })}
            >
              Theo thời gian
            </button>
          </div>
          {settings.selectionMode === "WORD_COUNT" ? (
            <>
              <div className="number-options">
                {[5, 10, 15, 20].map((n) => (
                  <button
                    className={settings.wordCount === n ? "selected" : ""}
                    onClick={() => patch({ wordCount: n })}
                    key={n}
                  >
                    {n}
                    <small>từ</small>
                  </button>
                ))}
              </div>
              <label className="custom-count">
                Tùy chỉnh từ 5–50 từ
                <input
                  type="number"
                  min="5"
                  max="50"
                  value={settings.wordCount ?? 10}
                  onChange={(event) =>
                    patch({
                      wordCount: Math.min(
                        50,
                        Math.max(5, Number(event.target.value) || 5),
                      ),
                    })
                  }
                />
              </label>
              {settings.scope === "RECENTLY_LEARNED" && (
                <div className="chip-list recent-days">
                  <span>Đã học trong</span>
                  {([1, 3, 7] as const).map((days) => (
                    <button
                      key={days}
                      className={settings.recentDays === days ? "selected" : ""}
                      onClick={() => patch({ recentDays: days })}
                    >
                      {days} ngày
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="number-options">
              {[3, 5, 10, 15].map((n) => (
                <button
                  className={settings.targetMinutes === n ? "selected" : ""}
                  onClick={() => patch({ targetMinutes: n })}
                  key={n}
                >
                  {n}
                  <small>phút</small>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="setup-block">
          <h2>Kỹ năng</h2>
          <div className="chip-list">
            {(Object.keys(skillLabels) as ReviewSkill[]).map((skill) => (
              <button
                className={settings.skillFocus === skill ? "selected" : ""}
                onClick={() => patch({ skillFocus: skill })}
                key={skill}
              >
                {skillLabels[skill]}
              </button>
            ))}
          </div>
          <label className="switch-row">
            <span>
              <strong>Tự động phát âm</strong>
              <small>Khi câu nghe xuất hiện</small>
            </span>
            <input
              type="checkbox"
              checked={settings.autoPlayAudio}
              onChange={(e) => patch({ autoPlayAudio: e.target.checked })}
            />
          </label>
        </div>
      </div>
      <div className="setup-block">
        <h2>Chủ đề</h2>
        <div className="topic-options">
          <button
            className={!settings.topicIds.length ? "selected" : ""}
            onClick={() => patch({ topicIds: [] })}
          >
            <strong>Tất cả chủ đề</strong>
            <span>Để hệ thống phối hợp từ đa dạng</span>
          </button>
          {dashboard?.topics.map((topic) => {
            const selected = settings.topicIds.includes(topic.topicId);
            return (
              <button
                className={selected ? "selected" : ""}
                onClick={() =>
                  patch({
                    topicIds: selected
                      ? settings.topicIds.filter((id) => id !== topic.topicId)
                      : [...settings.topicIds, topic.topicId],
                  })
                }
                key={topic.topicId}
              >
                <strong>{topic.name}</strong>
                <span>
                  {topic.totalWords} từ · {topic.dueCount} cần ôn · chính xác{" "}
                  {topic.accuracy}%
                </span>
                <i>
                  <b style={{ width: `${topic.masteryProgress}%` }} />
                </i>
              </button>
            );
          })}
        </div>
      </div>
      <footer className="setup-footer">
        <div>
          <span>Phiên này dự kiến</span>
          <strong>
            {settings.selectionMode === "TIME"
              ? `${settings.targetMinutes ?? 5} phút`
              : `${settings.wordCount ?? 10} từ · khoảng ${Math.ceil((settings.wordCount ?? 10) / 2)} phút`}
          </strong>
        </div>
        <button className="review-primary" onClick={onStart} disabled={loading}>
          {loading ? "Đang chuẩn bị…" : "Bắt đầu phiên"}
        </button>
      </footer>
    </section>
  );
}

function Practice({
  session,
  onSession,
  onComplete,
  onExit,
}: {
  session: ReviewSession;
  onSession: (s: ReviewSession) => void;
  onComplete: () => void;
  onExit: (discard: boolean) => void;
}) {
  const q = session.currentQuestion;
  const [selected, setSelected] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [feedback, setFeedback] = useState<ReviewFeedback | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showExit, setShowExit] = useState(false);
  const started = useRef(Date.now());
  const reset = useCallback(
    (
      nextQuestion: ReviewSession["currentQuestion"],
      progress: ReviewSession["progress"],
    ) => {
      setSelected(null);
      setTyped("");
      setFeedback(null);
      started.current = Date.now();
      onSession({ ...session, currentQuestion: nextQuestion, progress });
    },
    [onSession, session],
  );
  const submit = useCallback(async () => {
    if (!q || submitting || (!selected && !typed.trim())) return;
    setSubmitting(true);
    try {
      const result = await vocabularyReviewService.answer(session.id, {
        questionId: q.id,
        selectedOptionId: selected,
        typedAnswer: typed || null,
        responseTimeMs: Date.now() - started.current,
        usedHint: false,
      });
      if (session.settings.mode === "TEST_MODE") {
        if (result.nextQuestion) reset(result.nextQuestion, result.progress);
        else void onComplete();
      } else setFeedback(result);
    } finally {
      setSubmitting(false);
    }
  }, [q, selected, typed, submitting, session, onComplete, reset]);
  const next = useCallback(() => {
    if (!feedback) return;
    if (feedback.nextQuestion) reset(feedback.nextQuestion, feedback.progress);
    else void onComplete();
  }, [feedback, onComplete, reset]);
  useEffect(() => {
    if (q?.audioUrl && session.settings.autoPlayAudio)
      void new Audio(q.audioUrl).play();
  }, [q?.id, q?.audioUrl, session.settings.autoPlayAudio]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowExit(true);
      if (event.key.toLowerCase() === "r" && q?.audioUrl)
        void new Audio(q.audioUrl).play();
      if (feedback && event.key === "Enter") next();
      else if (!feedback && event.key === "Enter") void submit();
      else if (
        !feedback &&
        /^[1-4]$/.test(event.key) &&
        q?.options[Number(event.key) - 1]
      )
        setSelected(q.options[Number(event.key) - 1]!.id);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [feedback, next, q, submit]);
  if (!q)
    return (
      <div className="practice-shell">
        <button className="review-primary" onClick={onComplete}>
          Xem kết quả
        </button>
      </div>
    );
  const progress = Math.min(
    100,
    (session.progress.answered / Math.max(1, session.progress.total)) * 100,
  );
  const isTyping = !q.options.length;
  return (
    <main className="practice-shell">
      <header className="practice-top">
        <button onClick={() => setShowExit(true)} aria-label="Thoát phiên">
          <Icon name="close" />
        </button>
        <div className="practice-progress">
          <i>
            <b style={{ width: `${progress}%` }} />
          </i>
          <span>
            {session.progress.answered + 1}/{session.progress.total}
          </span>
        </div>
        <span className="practice-mode">
          {session.settings.mode === "TEST_MODE"
            ? "Kiểm tra"
            : q.isRetry
              ? "Củng cố"
              : skillLabels[session.settings.skillFocus]}
        </span>
      </header>
      <section className="question-card">
        <span className="question-label">
          {q.type === "WORD_TO_MEANING"
            ? "Chọn nghĩa đúng"
            : q.type === "MEANING_TO_WORD"
              ? "Chọn từ phù hợp"
              : q.type === "LISTENING_TO_WORD"
                ? "Nghe và chọn từ"
                : q.type === "FILL_IN_BLANK"
                  ? "Điền vào ngữ cảnh"
                  : "Nhập từ tiếng Anh"}
        </span>
        {q.audioUrl ? (
          <button
            className="audio-button"
            onClick={() => void new Audio(q.audioUrl).play()}
            aria-label="Phát lại âm thanh"
          >
            <Icon name="sound" />
          </button>
        ) : (
          <h1>{q.prompt}</h1>
        )}
        {q.phonetic && session.settings.showPhonetic && (
          <p className="question-phonetic">{q.phonetic}</p>
        )}
        {isTyping ? (
          <div className="typing-answer">
            <label htmlFor="review-answer">Câu trả lời của bạn</label>
            <input
              id="review-answer"
              autoFocus
              autoComplete="off"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              disabled={Boolean(feedback)}
              placeholder="Nhập từ tiếng Anh…"
            />
          </div>
        ) : (
          <div className="answer-options">
            {q.options.map((option, index) => (
              <button
                key={option.id}
                className={selected === option.id ? "selected" : ""}
                onClick={() => !feedback && setSelected(option.id)}
                disabled={Boolean(feedback)}
              >
                <kbd>{index + 1}</kbd>
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        )}
      </section>
      {!feedback && (
        <footer className="practice-action">
          <span>
            {isTyping
              ? "Nhấn Enter để kiểm tra"
              : "Dùng phím 1–4 để chọn nhanh"}
          </span>
          <button
            className="review-primary"
            onClick={() => void submit()}
            disabled={submitting || (!selected && !typed.trim())}
          >
            {submitting
              ? "Đang chấm…"
              : session.settings.mode === "TEST_MODE"
                ? "Gửi câu trả lời"
                : "Kiểm tra"}
          </button>
        </footer>
      )}
      {feedback && (
        <section
          className={`feedback-panel ${feedback.isCorrect ? "correct" : "incorrect"}`}
          role="status"
        >
          <div className="feedback-inner">
            <span className="feedback-icon">
              <Icon name={feedback.isCorrect ? "check" : "close"} />
            </span>
            <div className="feedback-copy">
              <h2>{feedback.isCorrect ? "Chính xác" : "Chưa chính xác"}</h2>
              <p>{feedback.explanation}</p>
              {feedback.correctAnswer && (
                <div className="answer-detail">
                  <strong>{feedback.correctAnswer.word}</strong>
                  <span>{feedback.correctAnswer.meaning}</span>
                  {feedback.correctAnswer.example && (
                    <small>{feedback.correctAnswer.example}</small>
                  )}
                </div>
              )}
              {feedback.mastery && (
                <span className="mastery-change">
                  Độ thành thạo {feedback.mastery.before} → {feedback.mastery.after}
                </span>
              )}
            </div>
            <button onClick={next}>
              {feedback.isCorrect ? "Tiếp tục" : "Đã hiểu, tiếp tục"}
            </button>
          </div>
        </section>
      )}
      {showExit && (
        <div className="review-dialog-backdrop">
          <div className="review-dialog" role="dialog" aria-modal="true">
            <h2>Lưu phiên và thoát?</h2>
            <p>
              Bạn đã hoàn thành {session.progress.answered}/
              {session.progress.total} câu. Có thể tiếp tục phiên này sau.
            </p>
            <button className="review-primary" onClick={() => onExit(false)}>
              Lưu và thoát
            </button>
            <button className="danger" onClick={() => onExit(true)}>
              Kết thúc phiên
            </button>
            <button onClick={() => setShowExit(false)}>Tiếp tục học</button>
          </div>
        </div>
      )}
    </main>
  );
}

function Summary({
  summary,
  onHome,
  onRetry,
}: {
  summary: ReviewSummary;
  onHome: () => void;
  onRetry: () => void;
}) {
  const title =
    summary.accuracy >= 85
      ? "Một phiên ôn rất chắc chắn"
      : summary.accuracy >= 60
        ? "Bạn đang tiến bộ đúng hướng"
        : "Mình cùng củng cố thêm nhé";
  return (
    <main className="summary-page">
      <section className="summary-hero">
        <span className="summary-check">
          <Icon name="check" />
        </span>
        <span>HOÀN THÀNH PHIÊN</span>
        <h1>{title}</h1>
        <p>
          {summary.accuracy >= 85
            ? "Khả năng nhớ chủ động của bạn đang rất tốt."
            : "Các từ trả lời sai đã được đưa vào kế hoạch ôn tiếp theo."}
        </p>
        <strong>{summary.accuracy}%</strong>
        <small>Độ chính xác lần đầu</small>
      </section>
      <section className="summary-grid">
        {[
          ["Từ đã ôn", summary.reviewedWords],
          ["Trả lời đúng", summary.correct],
          ["Cần luyện lại", summary.incorrect],
          ["Chuỗi đúng dài nhất", summary.longestStreak],
          ["Thành thạo tăng", summary.masteryUp],
          ["XP nhận được", `+${summary.xpEarned}`],
        ].map(([label, value]) => (
          <article key={String(label)}>
            <strong>{value}</strong>
            <span>{label}</span>
          </article>
        ))}
      </section>
      {summary.weakestSkill && (
        <div className="summary-insight">
          <Icon name="target" />
          <div>
            <strong>Kỹ năng nên luyện tiếp</strong>
            <span>
              {summary.weakestSkill === "TYPING_WORD"
                ? "Chính tả và khả năng tự nhớ từ"
                : summary.weakestSkill === "LISTENING_TO_WORD"
                  ? "Nghe và nhận diện từ"
                  : "Liên kết từ với nghĩa và ngữ cảnh"}
            </span>
          </div>
        </div>
      )}
      <div className="summary-actions">
        {!!summary.incorrect && (
          <button className="review-primary" onClick={onRetry}>
            Ôn lại từ sai
          </button>
        )}
        <button className="review-secondary" onClick={onHome}>
          Về trang ôn tập
        </button>
      </div>
    </main>
  );
}
