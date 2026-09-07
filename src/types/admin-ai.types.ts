import type { ApiSuccess } from './api.types'
import type { VocabularyResponse } from './vocabulary.types'
import type { QuestionResponse } from './question.types'
import type { VocabularyDifficulty } from './vocabulary.types'

export type AiGenerationStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMMITTING'
  | 'COMPLETED'
  | 'PARTIAL'
  | 'FAILED'
  | 'CANCELED'
  | 'COMMITTED'

export type AiQuestionGenerationStatus = AiGenerationStatus

export type AiSupportedQuestionType =
  | 'MULTIPLE_CHOICE'
  | 'MATCHING'
  | 'FILL_BLANK'
  | 'ORDER_SENTENCE'
  | 'TRANSLATION'

export interface GeneratedVocabularyCandidate {
  candidateKey: string
  word: string
  meaning: string
  phonetic?: string
  partOfSpeech?: string
  example?: string
  exampleMeaning?: string
}

export interface GenerateVocabularyPreviewRequest {
  count?: number
  requirements?: string
}

export interface GenerateVocabularyPreviewResponse {
  generationId: string
  topicId: string
  requestedCount: number
  generatedCount: number
  candidates: GeneratedVocabularyCandidate[]
}

export interface CommitVocabularyRequest {
  items: GeneratedVocabularyCandidate[]
}

export interface CommitVocabularyResponse {
  generationId: string
  status: 'COMMITTED'
  committedCount: number
  alreadyCommitted: boolean
  vocabularies: VocabularyResponse[]
}

interface QuestionCandidateBase {
  candidateKey: string
  vocabularyId?: string
  vocabularyIds?: string[]
  content: string
  instruction?: string
  explanation?: string
  difficulty: VocabularyDifficulty
}

export interface GeneratedQuestionOption {
  content: string
  isCorrect: boolean
  orderIndex: number
}

export interface GeneratedMatchingPair {
  vocabularyId?: string
  leftValue: string
  rightValue: string
  orderIndex: number
}

export interface MultipleChoiceQuestionCandidate extends QuestionCandidateBase {
  type: 'MULTIPLE_CHOICE'
  correctAnswer: string
  options: GeneratedQuestionOption[]
}

export interface FillBlankQuestionCandidate extends QuestionCandidateBase {
  type: 'FILL_BLANK'
  correctAnswer: string
}

export interface MatchingQuestionCandidate extends QuestionCandidateBase {
  type: 'MATCHING'
  matchingPairs: GeneratedMatchingPair[]
}

export interface OrderSentenceQuestionCandidate extends QuestionCandidateBase {
  type: 'ORDER_SENTENCE'
  correctAnswer: string
  options: GeneratedQuestionOption[]
}

export interface TranslationQuestionCandidate extends QuestionCandidateBase {
  type: 'TRANSLATION'
  correctAnswer: string
}

export type GeneratedQuestionCandidate =
  | MultipleChoiceQuestionCandidate
  | FillBlankQuestionCandidate
  | MatchingQuestionCandidate
  | OrderSentenceQuestionCandidate
  | TranslationQuestionCandidate

export interface GenerateQuestionPreviewRequest {
  lessonId?: string
  vocabularyIds?: string[]
  questionTypes: AiSupportedQuestionType[]
  count?: number
  difficulty?: VocabularyDifficulty
  requirements?: string
}

export interface GenerateQuestionPreviewResponse {
  generationId: string
  topicId: string
  lessonId: string | null
  requestedCount: number
  generatedCount: number
  acceptedCount: number
  status: 'COMPLETED' | 'PARTIAL'
  candidates: GeneratedQuestionCandidate[]
}

export interface CommitQuestionRequest {
  items: GeneratedQuestionCandidate[]
}

export interface CommitQuestionResponse {
  generationId: string
  status: 'COMMITTED'
  committedCount: number
  alreadyCommitted: boolean
  questions: QuestionResponse[]
}

export interface AiGenerationResponse {
  id: string
  topicId: string
  generationType: 'VOCABULARY' | 'QUESTION'
  status: AiGenerationStatus
  requestedCount: number
  generatedCount: number
  acceptedCount: number
  candidates: Array<GeneratedVocabularyCandidate | GeneratedQuestionCandidate>
  resultIds: string[]
  errorCode: string | null
  errorMessage: string | null
}

export type GenerateVocabularyPreviewApiResponse =
  ApiSuccess<GenerateVocabularyPreviewResponse>
export type CommitVocabularyApiResponse = ApiSuccess<CommitVocabularyResponse>
export type GenerateQuestionPreviewApiResponse =
  ApiSuccess<GenerateQuestionPreviewResponse>
export type CommitQuestionApiResponse = ApiSuccess<CommitQuestionResponse>
export type GetAiGenerationApiResponse = ApiSuccess<{
  generation: AiGenerationResponse
}>
