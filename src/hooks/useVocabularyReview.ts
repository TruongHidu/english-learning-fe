import { useCallback, useEffect, useState } from "react";
import { vocabularyReviewService } from "../services/vocabulary-review.service";

export function useReviewStats() {
  const [stats, setStats] = useState({
    dueToday: 0,
    weakCount: 0,
    masteredCount: 0,
    reviewedToday: 0,
    accuracy7Days: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setStats((await vocabularyReviewService.getStats()).data);
    } catch {
      setError("Không thể tải thống kê ôn tập");
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    void refetch();
  }, [refetch]);
  return { stats, isLoading, error, refetch };
}
