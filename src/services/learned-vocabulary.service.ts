import api from '../api/axios'
import type {
  LearnedVocabulariesGroupedResponse,
  ExcludeFromReviewResponse,
} from '../types/learned-vocabulary.types'

export const learnedVocabularyService = {
  async excludeFromReview(vocabularyId: string, exclude: boolean): Promise<ExcludeFromReviewResponse> {
    const response = await api.patch<ExcludeFromReviewResponse>(`/user/vocabularies/${vocabularyId}/exclude-review`, { exclude })
    return response.data
  },

  async getLearnedVocabularies(): Promise<LearnedVocabulariesGroupedResponse> {
    const response = await api.get<LearnedVocabulariesGroupedResponse>('/user/vocabularies/learned')
    return response.data
  },
}
