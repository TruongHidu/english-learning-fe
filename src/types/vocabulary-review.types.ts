import type { ApiSuccess } from "./api.types";

export type ReviewMode = "SMART_REVIEW" | "QUICK_PRACTICE" | "TEST_MODE";
export type ReviewScope =
  | "SMART_QUEUE"
  | "DUE_ONLY"
  | "WEAK_WORDS"
  | "RECENTLY_LEARNED"
  | "MISTAKES"
  | "BOOKMARKED"
  | "MASTERED_CHECK"
  | "FREE_REVIEW";
export type ReviewSkill =
  "ADAPTIVE" | "MEANING" | "LISTENING" | "SPELLING" | "CONTEXT";
export type ReviewQuestionType =
  | "WORD_TO_MEANING"
  | "MEANING_TO_WORD"
  | "LISTENING_TO_WORD"
  | "TYPING_WORD"
  | "FILL_IN_BLANK";
export type AnswerQuality = "FAIL" | "RETRY_CORRECT" | "HARD" | "GOOD" | "EASY";

export interface ReviewSettings {
  mode: ReviewMode;
  scope: ReviewScope;
  selectionMode: "WORD_COUNT" | "TIME";
  wordCount?: number;
  targetMinutes?: number;
  topicIds: string[];
  skillFocus: ReviewSkill;
  intensity: "LIGHT" | "STANDARD" | "DEEP";
  autoPlayAudio: boolean;
  showPhonetic: boolean;
  includeMastered: boolean;
  recentDays?: 1 | 3 | 7;
}
export interface ReviewQuestion {
  id: string;
  vocabularyId: string;
  topicId: string;
  type: ReviewQuestionType;
  prompt: string;
  phonetic?: string;
  audioUrl?: string;
  options: Array<{ id: string; label: string }>;
  isRetry: boolean;
  retryOfQuestionId?: string;
}
export interface ReviewSession {
  id: string;
  status: string;
  settings: ReviewSettings;
  progress: { answered: number; total: number };
  currentQuestion: ReviewQuestion | null;
  startedAt: string;
  resumed?: boolean;
}
export interface ReviewFeedback {
  accepted: true;
  isCorrect?: boolean;
  answerQuality?: AnswerQuality;
  correctAnswer?: {
    word: string;
    meaning: string;
    partOfSpeech?: string;
    example?: string;
    exampleMeaning?: string;
  };
  mastery?: { before: number; after: number };
  nextReviewAt?: string;
  explanation?: string;
  retryScheduled?: boolean;
  progress: { answered: number; total: number };
  nextQuestion: ReviewQuestion | null;
}
export interface ReviewSummary {
  reviewedWords: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  durationSeconds: number;
  longestStreak: number;
  xpEarned: number;
  masteryUp: number;
  masteryDown: number;
  weakestSkill: ReviewQuestionType | null;
  wrongVocabularyIds: string[];
}
export interface ReviewDashboard {
  dueToday: number;
  weakCount: number;
  masteredCount: number;
  reviewedToday: number;
  accuracy7Days: number;
  estimatedMinutes: number;
  attentionWords: Array<{
    vocabularyId: string;
    word: string;
    meaning: string;
    phonetic?: string;
    mastery: number;
    nextReviewAt: string;
    isBookmarked: boolean;
    score: number;
    reason: string;
  }>;
  topics: Array<{
    topicId: string;
    name: string;
    totalWords: number;
    dueCount: number;
    weakCount: number;
    masteredCount: number;
    accuracy: number;
    masteryProgress: number;
    estimatedMinutes: number;
  }>;
  skills: Array<{ skill: string; accuracy: number; attempts: number }>;
  schedule: {
    today: number;
    tomorrow: number;
    next3Days: number;
    next7Days: number;
  };
  suggestions: Array<{
    id: string;
    title: string;
    reason: string;
    estimatedMinutes: number;
    mode: ReviewMode;
    scope: ReviewScope;
    topicIds: string[];
    skillFocus: ReviewSkill;
  }>;
  activeSession: {
    id: string;
    answered: number;
    total: number;
    startedAt: string;
  } | null;
  goal: {
    type: "WORDS" | "MINUTES";
    target: number;
    progress: number;
    completed: boolean;
  };
}
export type DashboardResponse = ApiSuccess<ReviewDashboard>;
export type SessionResponse = ApiSuccess<ReviewSession>;
export type AnswerResponse = ApiSuccess<ReviewFeedback>;
export type CompleteResponse = ApiSuccess<{
  summary: ReviewSummary;
  rewards: {
    xpEarned: number;
    totalXp?: number;
    level?: number;
    currentStreak?: number;
  };
}>;
export type ReviewStatsResponse = ApiSuccess<
  Pick<
    ReviewDashboard,
    | "dueToday"
    | "weakCount"
    | "masteredCount"
    | "reviewedToday"
    | "accuracy7Days"
  >
>;
