import api from "../api/axios";
import type {
  AnswerResponse,
  CompleteResponse,
  DashboardResponse,
  ReviewSettings,
  ReviewStatsResponse,
  SessionResponse,
} from "../types/vocabulary-review.types";

export const vocabularyReviewService = {
  async getDashboard() {
    return (
      await api.get<DashboardResponse>("/user/vocabularies/review/dashboard")
    ).data.data;
  },
  async createSession(settings: ReviewSettings) {
    return (
      await api.post<SessionResponse>(
        "/user/vocabularies/review/sessions",
        settings,
      )
    ).data.data;
  },
  async getSession(id: string) {
    return (
      await api.get<SessionResponse>(`/user/vocabularies/review/sessions/${id}`)
    ).data.data;
  },
  async answer(
    id: string,
    payload: {
      questionId: string;
      selectedOptionId?: string | null;
      typedAnswer?: string | null;
      responseTimeMs: number;
      usedHint: boolean;
    },
  ) {
    return (
      await api.post<AnswerResponse>(
        `/user/vocabularies/review/sessions/${id}/answers`,
        payload,
      )
    ).data.data;
  },
  async complete(id: string) {
    return (
      await api.post<CompleteResponse>(
        `/user/vocabularies/review/sessions/${id}/complete`,
      )
    ).data.data;
  },
  async exit(id: string, finish = false) {
    return (
      await api.post(`/user/vocabularies/review/sessions/${id}/exit`, {
        finish,
      })
    ).data.data;
  },
  async bookmark(vocabularyId: string, isBookmarked: boolean) {
    return (
      await api.patch(`/user/vocabularies/${vocabularyId}/bookmark`, {
        isBookmarked,
      })
    ).data.data;
  },
  async setGoal(type: "WORDS" | "MINUTES", target: number) {
    return (await api.put("/user/vocabularies/review/goal", { type, target }))
      .data.data;
  },
  async getStats() {
    return (
      await api.get<ReviewStatsResponse>("/user/vocabularies/review/stats")
    ).data;
  },
};
