import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import VocabularyReviewPage from "./VocabularyReviewPage";
import { vocabularyReviewService } from "../../services/vocabulary-review.service";

vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => ({ updateCachedUser: vi.fn() }),
}));
vi.mock("../../services/vocabulary-review.service", () => ({
  vocabularyReviewService: {
    getDashboard: vi.fn(),
    createSession: vi.fn(),
    getSession: vi.fn(),
    answer: vi.fn(),
    complete: vi.fn(),
    exit: vi.fn(),
    bookmark: vi.fn(),
    setGoal: vi.fn(),
    getStats: vi.fn(),
  },
}));

const dashboard = {
  dueToday: 12,
  weakCount: 4,
  masteredCount: 8,
  reviewedToday: 3,
  accuracy7Days: 75,
  estimatedMinutes: 6,
  attentionWords: [
    {
      vocabularyId: "v1",
      word: "journey",
      meaning: "hành trình",
      phonetic: "/ˈdʒɜːni/",
      mastery: 2,
      nextReviewAt: new Date().toISOString(),
      isBookmarked: false,
      score: 30,
      reason: "LOW_MASTERY",
    },
  ],
  topics: [
    {
      topicId: "64f000000000000000000001",
      name: "Du lịch",
      totalWords: 24,
      dueCount: 8,
      weakCount: 4,
      masteredCount: 6,
      accuracy: 72,
      masteryProgress: 55,
      estimatedMinutes: 10,
    },
  ],
  skills: [{ skill: "SPELLING", accuracy: 54, attempts: 10 }],
  schedule: { today: 12, tomorrow: 8, next3Days: 21, next7Days: 30 },
  suggestions: [
    {
      id: "due",
      title: "Ôn 10 từ đến hạn",
      reason: "Giữ đúng lịch ghi nhớ",
      estimatedMinutes: 5,
      mode: "SMART_REVIEW",
      scope: "DUE_ONLY",
      topicIds: [],
      skillFocus: "ADAPTIVE",
    },
  ],
  activeSession: null,
  goal: { type: "WORDS", target: 10, progress: 3, completed: false },
} as const;

describe("VocabularyReviewPage", () => {
  beforeEach(() => {
    vi.mocked(vocabularyReviewService.getDashboard).mockResolvedValue(
      dashboard as never,
    );
  });
  it("renders personalized dashboard from backend data", async () => {
    render(
      <MemoryRouter>
        <VocabularyReviewPage />
      </MemoryRouter>,
    );
    expect(await screen.findByText("Bạn có 12 từ cần ôn")).toBeInTheDocument();
    expect(screen.getByText("journey")).toBeInTheDocument();
    expect(screen.getByText("Lịch ôn sắp tới")).toBeInTheDocument();
  });
  it("opens advanced setup without exposing flashcard controls", async () => {
    render(
      <MemoryRouter>
        <VocabularyReviewPage />
      </MemoryRouter>,
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Tùy chỉnh phiên" }),
    );
    expect(screen.getByText("Bạn muốn luyện như thế nào?")).toBeInTheDocument();
    expect(screen.getByText("Kiểm tra")).toBeInTheDocument();
    expect(screen.queryByText(/flashcard/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^(quên|nhớ)$/i }),
    ).not.toBeInTheDocument();
  });
});
