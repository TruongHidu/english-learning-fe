import { useState, useEffect, useRef } from 'react'
import { adminAiService } from '../../services/admin-ai.service'
import { adminCourseService } from '../../services/admin-course.service'
import { adminSectionService } from '../../services/admin-section.service'
import { adminTopicService } from '../../services/admin-topic.service'
import { adminLessonService } from '../../services/admin-lesson.service'
import { adminVocabularyService } from '../../services/admin-vocabulary.service'
import { adminQuestionService } from '../../services/admin-question.service'
import PageHeader from '../../components/admin/PageHeader'
import LessonFormModal from '../../components/admin/LessonFormModal'
import QuestionFormModal from '../../components/admin/QuestionFormModal'
import VocabularyFormModal from '../../components/admin/VocabularyFormModal'
import AiVocabularyPreview from '../../components/admin/AiVocabularyPreview'
import AiQuestionPreview from '../../components/admin/AiQuestionPreview'
import type {
  QuestionFormSubmission,
  QuestionMediaFieldErrors,
  QuestionListItemResponse,
  QuestionResponse,
  PendingQuestionAssignment,
} from '../../types/question.types'
import type {
  CreateVocabularyInput,
  VocabularyResponse,
} from '../../types/vocabulary.types'
import type { CourseResponse, SectionResponse } from '../../types/course.types'
import type { TopicResponse } from '../../types/topic.types'
import type { LessonResponse } from '../../types/lesson.types'
import type { LessonFormValues } from '../../schemas/lesson.schema'
import type {
  AiGenerationStatus,
  AiQuestionGenerationStatus,
  AiSupportedQuestionType,
  GeneratedQuestionCandidate,
  GeneratedVocabularyCandidate,
} from '../../types/admin-ai.types'
import { getAdminContentError } from '../../utils/admin-content-errors'
import {
  getAiVocabularyError,
  getAiQuestionError,
  isRequestCanceled,
} from '../../utils/admin-ai-errors'
import { buildQuestionFormData } from '../../utils/question-media'

type PreviewItem = VocabularyResponse | QuestionResponse

function isQuestionDetail(
  question: QuestionResponse | QuestionListItemResponse,
): question is QuestionResponse {
  return 'correctAnswer' in question
}

export default function AdminAIContentPage() {
  const [activeTab, setActiveTab] = useState<'VOCAB' | 'QUESTION'>('VOCAB')

  // 4-Step Cascade Select Data State: Course -> Section -> Topic -> Lesson
  const [courses, setCourses] = useState<CourseResponse[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState('')

  const [sections, setSections] = useState<SectionResponse[]>([])
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [isLoadingSections, setIsLoadingSections] = useState(false)

  const [topics, setTopics] = useState<TopicResponse[]>([])
  const [selectedTopicId, setSelectedTopicId] = useState('')
  const [isLoadingTopics, setIsLoadingTopics] = useState(false)

  const [lessons, setLessons] = useState<LessonResponse[]>([])
  const [selectedLessonId, setSelectedLessonId] = useState('')
  const [assignedQuestionIds, setAssignedQuestionIds] = useState<string[]>([])
  const [isLoadingLessons, setIsLoadingLessons] = useState(false)
  const [isCreatingLesson, setIsCreatingLesson] = useState(false)
  const [isAssigningQuestions, setIsAssigningQuestions] = useState(false)
  const [lessonFormError, setLessonFormError] = useState<string | null>(null)
  const [isLessonFormOpen, setIsLessonFormOpen] = useState(false)
  const [pendingQuestionAssignment, setPendingQuestionAssignment] =
    useState<PendingQuestionAssignment | null>(null)

  const [vocabularies, setVocabularies] = useState<VocabularyResponse[]>([])
  // Form Parameters
  const [vocabQuantity, setVocabQuantity] = useState(10)
  const [vocabRequirements, setVocabRequirements] = useState('')

  const [questionTypes, setQuestionTypes] = useState<AiSupportedQuestionType[]>([
    'MULTIPLE_CHOICE',
    'FILL_BLANK',
    'MATCHING',
    'ORDER_SENTENCE',
  ])
  const [questionQuantity, setQuestionQuantity] = useState(8)
  const [questionDifficulty, setQuestionDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('EASY')
  const [questionRequirements, setQuestionRequirements] = useState('')

  // Status & Feedback States
  const [isGeneratingVocab, setIsGeneratingVocab] = useState(false)
  const [isCommittingVocab, setIsCommittingVocab] = useState(false)
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false)
  const [isCommittingQuestion, setIsCommittingQuestion] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // View Filter Mode: 'NEWLY_GENERATED' vs 'ALL_DRAFTS' (Default ALL_DRAFTS for persistence on F5)
  const [viewFilter, setViewFilter] = useState<'NEWLY_GENERATED' | 'ALL_DRAFTS'>('ALL_DRAFTS')

  // Multi-Select State
  const [selectedVocabIds, setSelectedVocabIds] = useState<string[]>([])
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([])
  const [selectedTargetVocabIds, setSelectedTargetVocabIds] = useState<string[]>([])

  // Draft List & Newly Generated States
  const [draftVocabs, setDraftVocabs] = useState<VocabularyResponse[]>([])
  const [vocabularyGenerationId, setVocabularyGenerationId] = useState<string | null>(null)
  const [vocabularyGenerationStatus, setVocabularyGenerationStatus] =
    useState<AiGenerationStatus | null>(null)
  const [vocabularyCandidates, setVocabularyCandidates] =
    useState<GeneratedVocabularyCandidate[]>([])
  const [selectedCandidateKeys, setSelectedCandidateKeys] = useState<string[]>([])
  const [questionGenerationId, setQuestionGenerationId] = useState<string | null>(null)
  const [questionGenerationStatus, setQuestionGenerationStatus] =
    useState<AiQuestionGenerationStatus | null>(null)
  const [questionCandidates, setQuestionCandidates] =
    useState<GeneratedQuestionCandidate[]>([])
  const [selectedQuestionCandidateKeys, setSelectedQuestionCandidateKeys] =
    useState<string[]>([])

  const [draftQuestions, setDraftQuestions] = useState<QuestionListItemResponse[]>([])
  const [newlyGeneratedQuestions, setNewlyGeneratedQuestions] = useState<QuestionResponse[]>([])

  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false)

  // View / Edit Modal States for Vocab & Question
  const [viewItem, setViewItem] = useState<PreviewItem | null>(null)
  const [selectedVocabForModal, setSelectedVocabForModal] =
    useState<VocabularyResponse | null>(null)
  const [isVocabFormOpen, setIsVocabFormOpen] = useState(false)
  const [isVocabFormSubmitting, setIsVocabFormSubmitting] = useState(false)
  const [vocabFormServerError, setVocabFormServerError] =
    useState<string | null>(null)

  const [selectedQuestionForModal, setSelectedQuestionForModal] =
    useState<QuestionResponse | null>(null)
  const [isQuestionFormOpen, setIsQuestionFormOpen] = useState(false)
  const [isQuestionFormSubmitting, setIsQuestionFormSubmitting] = useState(false)
  const [questionFormServerError, setQuestionFormServerError] =
    useState<string | null>(null)
  const [questionFormServerMediaErrors, setQuestionFormServerMediaErrors] =
    useState<QuestionMediaFieldErrors>({})

  // AbortController refs for cancellable AI generation
  const vocabAbortControllerRef = useRef<AbortController | null>(null)
  const questionAbortControllerRef = useRef<AbortController | null>(null)
  const commitVocabInFlightRef = useRef(false)
  const commitQuestionInFlightRef = useRef(false)
  const assignmentInFlightRef = useRef(false)
  const lessonLoadVersionRef = useRef(0)
  const assignedLoadVersionRef = useRef(0)
  const draftLoadVersionRef = useRef(0)

  useEffect(() => () => {
    vocabAbortControllerRef.current?.abort()
    questionAbortControllerRef.current?.abort()
  }, [])

  // Auto-dismiss status & error messages after 3 seconds
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [statusMessage])

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [errorMessage])

  function resetVocabularyPreview() {
    setVocabularyGenerationId(null)
    setVocabularyGenerationStatus(null)
    setVocabularyCandidates([])
    setSelectedCandidateKeys([])
  }

  function resetQuestionPreview() {
    setQuestionGenerationId(null)
    setQuestionGenerationStatus(null)
    setQuestionCandidates([])
    setSelectedQuestionCandidateKeys([])
  }

  // 1. Initial Load All Courses
  useEffect(() => {
    void loadCourses()
  }, [])

  async function loadCourses() {
    try {
      const data = await adminCourseService.getAllCourses()
      setCourses(data)
      if (data.length > 0) {
        const firstCourseId = data[0].id
        setSelectedCourseId(firstCourseId)
        void loadSectionsByCourse(firstCourseId)
      }
    } catch (err) {
      console.error('Failed to load courses', err)
    }
  }

  // Step 1: Course Selection Change -> Tải Sections
  function confirmQuestionSelectionReset(): boolean {
    if (selectedQuestionIds.length === 0 && !pendingQuestionAssignment) return true
    return window.confirm(
      'Bạn đang có câu hỏi đã chọn hoặc thao tác gán chưa hoàn tất. Đổi Topic sẽ xóa lựa chọn hiện tại, bạn có muốn tiếp tục?',
    )
  }

  async function handleCourseChange(courseId: string) {
    if (!confirmQuestionSelectionReset()) return
    assignedLoadVersionRef.current += 1
    draftLoadVersionRef.current += 1
    setSelectedCourseId(courseId)
    setSelectedSectionId('')
    setSections([])
    setSelectedTopicId('')
    setTopics([])
    setSelectedLessonId('')
    setAssignedQuestionIds([])
    setLessons([])
    setVocabularies([])
    setSelectedTargetVocabIds([])
    setDraftVocabs([])
    setDraftQuestions([])
    setSelectedVocabIds([])
    setSelectedQuestionIds([])
    setPendingQuestionAssignment(null)
    setLessonFormError(null)
    resetVocabularyPreview()
    resetQuestionPreview()

    if (courseId) {
      await loadSectionsByCourse(courseId)
    }
  }

  async function loadSectionsByCourse(courseId: string) {
    setIsLoadingSections(true)
    try {
      const sectionData = await adminSectionService.getAdminSections(courseId)
      setSections(sectionData)
      if (sectionData.length > 0) {
        const firstSectionId = sectionData[0].id
        setSelectedSectionId(firstSectionId)
        void loadTopicsBySection(firstSectionId)
      }
    } catch (err) {
      console.error('Failed to load sections for course', err)
    } finally {
      setIsLoadingSections(false)
    }
  }

  // Step 2: Section Selection Change -> Tải Topics
  async function handleSectionChange(sectionId: string) {
    if (!confirmQuestionSelectionReset()) return
    assignedLoadVersionRef.current += 1
    draftLoadVersionRef.current += 1
    setSelectedSectionId(sectionId)
    setSelectedTopicId('')
    setTopics([])
    setSelectedLessonId('')
    setAssignedQuestionIds([])
    setLessons([])
    setVocabularies([])
    setSelectedTargetVocabIds([])
    setDraftVocabs([])
    setDraftQuestions([])
    setSelectedVocabIds([])
    setSelectedQuestionIds([])
    setPendingQuestionAssignment(null)
    setLessonFormError(null)
    resetVocabularyPreview()
    resetQuestionPreview()

    if (sectionId) {
      await loadTopicsBySection(sectionId)
    }
  }

  async function loadTopicsBySection(sectionId: string) {
    setIsLoadingTopics(true)
    try {
      const topicData = await adminTopicService.getTopicsBySection(sectionId)
      setTopics(topicData)
      if (topicData.length > 0) {
        const firstTopicId = topicData[0].id
        setSelectedTopicId(firstTopicId)
        void loadLessonsAndVocabs(firstTopicId)
      }
    } catch (err) {
      console.error('Failed to load topics for section', err)
    } finally {
      setIsLoadingTopics(false)
    }
  }

  // Step 3: Topic Selection Change -> Tải Lessons & Vocabs & Drafts
  async function handleTopicChange(topicId: string) {
    if (!confirmQuestionSelectionReset()) return
    assignedLoadVersionRef.current += 1
    draftLoadVersionRef.current += 1
    setSelectedTopicId(topicId)
    setSelectedLessonId('')
    setAssignedQuestionIds([])
    setLessons([])
    setVocabularies([])
    setSelectedTargetVocabIds([])
    setDraftVocabs([])
    setDraftQuestions([])
    setSelectedVocabIds([])
    setSelectedQuestionIds([])
    setPendingQuestionAssignment(null)
    setLessonFormError(null)
    resetVocabularyPreview()
    resetQuestionPreview()

    if (topicId) {
      await loadLessonsAndVocabs(topicId)
    }
  }

  async function loadLessonsAndVocabs(topicId: string) {
    const requestVersion = ++lessonLoadVersionRef.current
    setIsLoadingLessons(true)
    try {
      const [lessonData, vocabRes] = await Promise.all([
        adminLessonService.getLessonsByTopic(topicId),
        adminVocabularyService.getVocabulariesByTopic(topicId),
      ])
      if (requestVersion !== lessonLoadVersionRef.current) return
      setLessons(lessonData)
      if (lessonData.length > 0) {
        setSelectedLessonId(lessonData[0].id)
        void loadAssignedQuestionIds(lessonData[0].id)
      } else {
        setSelectedLessonId('')
        setAssignedQuestionIds([])
      }
      setVocabularies(vocabRes.vocabularies)
      void loadDraftsForTopic(topicId)
    } catch (err) {
      if (requestVersion !== lessonLoadVersionRef.current) return
      console.error('Failed to load lessons and vocabularies for topic', err)
    } finally {
      if (requestVersion === lessonLoadVersionRef.current) setIsLoadingLessons(false)
    }
  }

  async function loadAssignedQuestionIds(lessonId: string) {
    const requestVersion = ++assignedLoadVersionRef.current
    try {
      const assignments = await adminQuestionService.getLessonQuestions(lessonId)
      if (requestVersion !== assignedLoadVersionRef.current) return
      setAssignedQuestionIds(assignments.map((assignment) => assignment.questionId))
    } catch (error: unknown) {
      if (requestVersion !== assignedLoadVersionRef.current) return
      setErrorMessage(getAdminContentError(error, 'Không thể tải danh sách câu hỏi đã gán.'))
    }
  }

  function handleLessonSelection(lessonId: string) {
    setSelectedLessonId(lessonId)
    setAssignedQuestionIds([])
    if (lessonId) void loadAssignedQuestionIds(lessonId)
  }

  // Fetch up to 500 draft items for BOTH Vocabs and Questions simultaneously
  async function loadDraftsForTopic(topicId: string) {
    if (!topicId) return
    const requestVersion = ++draftLoadVersionRef.current
    setIsLoadingDrafts(true)
    setSelectedVocabIds([])
    setSelectedQuestionIds([])
    try {
      const [vRes, qRes] = await Promise.all([
        adminVocabularyService.getVocabulariesByTopic(topicId, { status: 'DRAFT', limit: 500 }),
        adminQuestionService.getQuestionsByTopic(topicId, { status: 'DRAFT', limit: 500 }),
      ])
      if (requestVersion !== draftLoadVersionRef.current) return
      setDraftVocabs(vRes.vocabularies)
      setDraftQuestions(qRes.questions)
    } catch (err) {
      if (requestVersion !== draftLoadVersionRef.current) return
      console.error('Failed to load drafts', err)
    } finally {
      if (requestVersion === draftLoadVersionRef.current) setIsLoadingDrafts(false)
    }
  }

  // --- Handlers: AI Generation with Cancel Support ---
  function handleCancelGenerateVocab() {
    if (vocabAbortControllerRef.current) {
      vocabAbortControllerRef.current.abort()
      vocabAbortControllerRef.current = null
    }
    setIsGeneratingVocab(false)
    setStatusMessage('Đã hủy lệnh AI tạo từ vựng!')
  }

  function handleCancelGenerateQuestion() {
    if (questionAbortControllerRef.current) {
      questionAbortControllerRef.current.abort()
      questionAbortControllerRef.current = null
    }
    setIsGeneratingQuestion(false)
    setStatusMessage('Đã hủy lệnh AI tạo câu hỏi!')
  }

  async function handleGenerateVocab(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCourseId) {
      setErrorMessage('Vui lòng chọn 1. Khóa học trước')
      return
    }
    if (!selectedSectionId) {
      setErrorMessage('Vui lòng chọn 2. Phần học tiếp theo')
      return
    }
    if (!selectedTopicId) {
      setErrorMessage('Vui lòng chọn 3. Chủ đề tiếp theo')
      return
    }

    vocabAbortControllerRef.current?.abort()
    const controller = new AbortController()
    vocabAbortControllerRef.current = controller
    setIsGeneratingVocab(true)
    setErrorMessage(null)
    setStatusMessage(null)
    try {
      const count = Math.max(1, Math.min(20, Number(vocabQuantity) || 10))
      const result = await adminAiService.generateVocabularyPreview(
        selectedTopicId,
        {
          count,
          requirements: vocabRequirements.trim() || undefined,
        },
        { signal: controller.signal },
      )
      setVocabularyGenerationId(result.generationId)
      setVocabularyGenerationStatus(
        result.generatedCount >= result.requestedCount ? 'COMPLETED' : 'PARTIAL',
      )
      setVocabularyCandidates(result.candidates)
      setSelectedCandidateKeys(
        result.candidates.map((candidate) => candidate.candidateKey),
      )
      setStatusMessage(
        'AI đã tạo danh sách đề xuất, vui lòng kiểm tra trước khi lưu',
      )
    } catch (error: unknown) {
      if (isRequestCanceled(error)) {
        setStatusMessage('Đã hủy yêu cầu tạo đề xuất từ vựng.')
      } else {
        setErrorMessage(
          getAiVocabularyError(error, 'Không thể tạo đề xuất từ vựng bằng AI.'),
        )
      }
    } finally {
      if (vocabAbortControllerRef.current === controller) {
        setIsGeneratingVocab(false)
        vocabAbortControllerRef.current = null
      }
    }
  }

  async function handleCommitVocabularies() {
    if (
      commitVocabInFlightRef.current ||
      isCommittingVocab ||
      !vocabularyGenerationId
    ) {
      return
    }

    const selectedKeySet = new Set(selectedCandidateKeys)
    const selectedItems = vocabularyCandidates.filter((candidate) =>
      selectedKeySet.has(candidate.candidateKey),
    )
    if (selectedItems.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất một đề xuất để lưu.')
      return
    }

    commitVocabInFlightRef.current = true
    setIsCommittingVocab(true)
    setErrorMessage(null)
    setStatusMessage(null)
    try {
      const result = await adminAiService.commitVocabularyGeneration(
        vocabularyGenerationId,
        { items: selectedItems },
      )
      const committedKeys = new Set(selectedItems.map((item) => item.candidateKey))
      setVocabularyCandidates((current) =>
        current.filter((candidate) => !committedKeys.has(candidate.candidateKey)),
      )
      setSelectedCandidateKeys([])
      setVocabularyGenerationStatus('COMMITTED')

      try {
        const [draftResult, allResult] = await Promise.all([
          adminVocabularyService.getVocabulariesByTopic(selectedTopicId, {
            status: 'DRAFT',
            limit: 500,
          }),
          adminVocabularyService.getVocabulariesByTopic(selectedTopicId, {
            limit: 500,
          }),
        ])
        setDraftVocabs(draftResult.vocabularies)
        setVocabularies(allResult.vocabularies)
      } catch (reloadError: unknown) {
        setStatusMessage(
          `Đã lưu ${result.committedCount} Vocabulary DRAFT, nhưng chưa tải lại được danh sách.`,
        )
        setErrorMessage(
          getAiVocabularyError(
            reloadError,
            'Hãy tải lại trang để xem các Vocabulary vừa lưu.',
          ),
        )
        return
      }
      setStatusMessage(
        result.alreadyCommitted
          ? 'Generation này đã được lưu trước đó. Danh sách DRAFT đã được tải lại.'
          : `Đã lưu thành công ${result.committedCount} Vocabulary DRAFT.`,
      )
    } catch (error: unknown) {
      setErrorMessage(
        getAiVocabularyError(error, 'Không thể lưu các đề xuất đã chọn.'),
      )
    } finally {
      commitVocabInFlightRef.current = false
      setIsCommittingVocab(false)
    }
  }

  async function handleGenerateQuestion(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCourseId) {
      setErrorMessage('Vui lòng chọn 1. Khóa học trước')
      return
    }
    if (!selectedSectionId) {
      setErrorMessage('Vui lòng chọn 2. Phần học tiếp theo')
      return
    }
    if (!selectedTopicId) {
      setErrorMessage('Vui lòng chọn 3. Chủ đề tiếp theo')
      return
    }
    if (questionTypes.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất 1 loại câu hỏi')
      return
    }
    if (vocabularies.length === 0) {
      setErrorMessage('Chủ đề chưa có từ vựng hợp lệ để tạo câu hỏi.')
      return
    }

    questionAbortControllerRef.current?.abort()
    const controller = new AbortController()
    questionAbortControllerRef.current = controller
    setIsGeneratingQuestion(true)
    setErrorMessage(null)
    setStatusMessage(null)
    try {
      const count = Math.max(1, Math.min(50, Number(questionQuantity) || 10))
      const result = await adminAiService.generateQuestionPreview(
        selectedTopicId,
        {
          lessonId: selectedLessonId || undefined,
          vocabularyIds: selectedTargetVocabIds.length > 0 ? selectedTargetVocabIds : undefined,
          questionTypes,
          count,
          difficulty: questionDifficulty,
          requirements: questionRequirements.trim() || undefined,
        },
        { signal: controller.signal }
      )
      setQuestionGenerationId(result.generationId)
      setQuestionGenerationStatus(result.status)
      setQuestionCandidates(result.candidates)
      setSelectedQuestionCandidateKeys(
        result.candidates.map((candidate) => candidate.candidateKey),
      )
      setStatusMessage(
        `AI đã tạo ${result.acceptedCount} đề xuất câu hỏi, vui lòng kiểm tra trước khi lưu.`,
      )
    } catch (error: unknown) {
      if (isRequestCanceled(error)) {
        setStatusMessage('Đã hủy yêu cầu tạo đề xuất câu hỏi.')
      } else {
        setErrorMessage(getAiQuestionError(error, 'Không thể tạo đề xuất câu hỏi bằng AI.'))
      }
    } finally {
      if (questionAbortControllerRef.current === controller) {
        setIsGeneratingQuestion(false)
        questionAbortControllerRef.current = null
      }
    }
  }

  async function handleCommitQuestions() {
    if (
      commitQuestionInFlightRef.current ||
      isCommittingQuestion ||
      !questionGenerationId
    ) return

    const selected = new Set(selectedQuestionCandidateKeys)
    const items = questionCandidates.filter((candidate) =>
      selected.has(candidate.candidateKey),
    )
    if (items.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất một đề xuất câu hỏi để lưu.')
      return
    }
    const targetLessonId = selectedLessonId

    commitQuestionInFlightRef.current = true
    setIsCommittingQuestion(true)
    setErrorMessage(null)
    setStatusMessage(null)
    try {
      const result = await adminAiService.commitQuestionGeneration(
        questionGenerationId,
        { items },
      )
      setQuestionGenerationStatus('COMMITTED')
      setQuestionCandidates([])
      setSelectedQuestionCandidateKeys([])
      setNewlyGeneratedQuestions(result.questions)
      setViewFilter('NEWLY_GENERATED')
      await loadDraftsForTopic(selectedTopicId)
      const committedQuestionIds = result.questions.map((question) => question.id)
      setSelectedQuestionIds(committedQuestionIds)

      if (targetLessonId && committedQuestionIds.length > 0) {
        setPendingQuestionAssignment({
          topicId: selectedTopicId,
          lessonId: targetLessonId,
          questionIds: committedQuestionIds,
        })
        const assigned = await assignQuestionsToLesson(
          targetLessonId,
          committedQuestionIds,
        )
        if (assigned) {
          setStatusMessage(
            result.alreadyCommitted
              ? 'Generation đã được lưu trước đó và Question đã được gán vào Lesson đã chọn.'
              : `Đã lưu ${result.committedCount} Question DRAFT và gán vào Lesson đã chọn.`,
          )
        } else {
          setStatusMessage(
            `Đã lưu ${result.committedCount} Question DRAFT nhưng chưa gán được vào Lesson. Hãy bấm “Thử gán lại”.`,
          )
        }
        return
      }

      setStatusMessage(
        result.alreadyCommitted
          ? 'Generation đã được commit trước đó; danh sách DRAFT đã được tải lại.'
          : `Đã lưu ${result.committedCount} Question DRAFT. Chọn một Lesson để gán câu hỏi.`,
      )
    } catch (error: unknown) {
      setErrorMessage(getAiQuestionError(error, 'Không thể lưu các đề xuất câu hỏi.'))
    } finally {
      commitQuestionInFlightRef.current = false
      setIsCommittingQuestion(false)
    }
  }

  // --- Handlers: Multi-Select Checkboxes ---
  const activeQuestionsToShow = viewFilter === 'NEWLY_GENERATED' ? newlyGeneratedQuestions : draftQuestions

  function toggleSelectAllVocabs() {
    if (selectedVocabIds.length === draftVocabs.length) {
      setSelectedVocabIds([])
    } else {
      setSelectedVocabIds(draftVocabs.map((vocabulary) => vocabulary.id))
    }
  }

  function toggleSelectVocab(id: string) {
    setSelectedVocabIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  function toggleSelectAllQuestions() {
    if (selectedQuestionIds.length === activeQuestionsToShow.length) {
      setSelectedQuestionIds([])
    } else {
      setSelectedQuestionIds(activeQuestionsToShow.map((q) => q.id))
    }
  }

  function toggleSelectQuestion(id: string) {
    setSelectedQuestionIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  // --- Handlers: Vocab Actions (Single & Bulk) ---
  async function handlePublishVocab(vocabId: string) {
    try {
      await adminVocabularyService.updateVocabularyStatus(vocabId, 'PUBLISHED')
      setStatusMessage('Vocabulary đã chuyển sang trạng thái PUBLISHED.')
      setSelectedVocabIds((prev) => prev.filter((i) => i !== vocabId))
      void loadDraftsForTopic(selectedTopicId)
    } catch {
      setErrorMessage('Lỗi duyệt từ vựng')
    }
  }

  async function handleDeleteVocab(vocabId: string) {
    if (!window.confirm('Bạn có chắc muốn xóa từ vựng này?')) return
    try {
      await adminVocabularyService.deleteVocabulary(vocabId)
      setStatusMessage('Đã xóa từ vựng khỏi hệ thống.')
      setSelectedVocabIds((prev) => prev.filter((i) => i !== vocabId))
      void loadDraftsForTopic(selectedTopicId)
    } catch {
      setErrorMessage('Lỗi xóa từ vựng')
    }
  }

  async function handleBulkPublishVocabs() {
    const idsToPublish = selectedVocabIds.length > 0
      ? selectedVocabIds
      : draftVocabs.map((vocabulary) => vocabulary.id)
    if (idsToPublish.length === 0) return
    try {
      await adminAiService.bulkPublishVocabularies(idsToPublish)
      setStatusMessage(`Đã chuyển ${idsToPublish.length} Vocabulary sang PUBLISHED.`)
      setSelectedVocabIds([])
      void loadDraftsForTopic(selectedTopicId)
    } catch {
      setErrorMessage('Lỗi duyệt hàng loạt từ vựng')
    }
  }

  async function handleBulkDeleteVocabs() {
    if (selectedVocabIds.length === 0) return
    if (!window.confirm(`Bạn có chắc muốn XÓA ${selectedVocabIds.length} từ vựng đã chọn?`)) return
    try {
      await adminAiService.bulkDeleteVocabularies(selectedVocabIds)
      setStatusMessage(`Đã xóa thành công ${selectedVocabIds.length} từ vựng đã chọn!`)
      setSelectedVocabIds([])
      void loadDraftsForTopic(selectedTopicId)
    } catch {
      setErrorMessage('Lỗi xóa hàng loạt từ vựng')
    }
  }

  async function openEditVocab(v: VocabularyResponse) {
    setVocabFormServerError(null)
    try {
      const fullVocab = await adminVocabularyService.getVocabularyById(v.id)
      setSelectedVocabForModal(fullVocab)
    } catch {
      setSelectedVocabForModal(v)
    }
    setIsVocabFormOpen(true)
  }

  const handleVocabFormSubmit = async (values: CreateVocabularyInput) => {
    if (!selectedVocabForModal) return
    setIsVocabFormSubmitting(true)
    setVocabFormServerError(null)
    try {
      await adminVocabularyService.updateVocabulary(selectedVocabForModal.id, values)
      setStatusMessage('Đã cập nhật từ vựng thành công!')
      setIsVocabFormOpen(false)
      setSelectedVocabForModal(null)
      void loadDraftsForTopic(selectedTopicId)
    } catch (err: unknown) {
      setVocabFormServerError(getAdminContentError(err, 'Không thể lưu từ vựng.'))
    } finally {
      setIsVocabFormSubmitting(false)
    }
  }

  // --- Handlers: Question assignment (kept separate from Publish) ---
  async function assignQuestionsToLesson(lessonId: string, questionIds: string[]): Promise<boolean> {
    if (assignmentInFlightRef.current || questionIds.length === 0) return false
    assignmentInFlightRef.current = true
    setIsAssigningQuestions(true)
    setErrorMessage(null)
    try {
      const result = await adminQuestionService.assignQuestionsToLessonWithResult(lessonId, {
        questionIds: [...new Set(questionIds)],
      })
      setLessons((current) => {
        const withoutUpdated = current.filter((lesson) => lesson.id !== result.lesson.id)
        return [...withoutUpdated, result.lesson].sort(
          (left, right) => left.orderIndex - right.orderIndex || left.createdAt.localeCompare(right.createdAt),
        )
      })
      setSelectedLessonId(result.lesson.id)
      setAssignedQuestionIds((current) => Array.from(new Set([
        ...current,
        ...result.questions.map((assignment) => assignment.questionId),
      ])))
      setSelectedQuestionIds((current) => current.filter((id) => !questionIds.includes(id)))
      setPendingQuestionAssignment(null)
      setStatusMessage(
        result.skippedCount > 0
          ? `Đã gán ${result.assignedCount} câu hỏi; bỏ qua ${result.skippedCount} câu đã có trong Lesson.`
          : `Đã gán ${result.assignedCount} câu hỏi vào Lesson DRAFT.`,
      )
      return true
    } catch (error: unknown) {
      setErrorMessage(getAdminContentError(error, 'Không thể gán câu hỏi vào Lesson.'))
      return false
    } finally {
      assignmentInFlightRef.current = false
      setIsAssigningQuestions(false)
    }
  }

  async function handleAssignSelectedQuestions() {
    if (!selectedTopicId) {
      setErrorMessage('Vui lòng chọn Topic trước khi gán câu hỏi.')
      return
    }
    if (!selectedLessonId) {
      setErrorMessage('Vui lòng chọn Lesson hoặc tạo Lesson mới trước khi gán.')
      return
    }
    if (selectedQuestionIds.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất một câu hỏi để gán.')
      return
    }
    await assignQuestionsToLesson(selectedLessonId, selectedQuestionIds)
  }

  async function handleCreateLessonForAssignment(values: LessonFormValues) {
    if (!selectedTopicId) {
      setLessonFormError('Vui lòng chọn Topic trước khi tạo Lesson.')
      return
    }

    const questionIds = [...new Set(selectedQuestionIds)]
    const topicId = selectedTopicId
    setIsCreatingLesson(true)
    setLessonFormError(null)
    setErrorMessage(null)
    try {
      const lesson = await adminLessonService.createLessonForAssignment(topicId, {
        name: values.name,
        description: values.description,
        orderIndex: values.orderIndex,
        requiredScore: values.requiredScore,
        xpReward: values.xpReward,
        diamondReward: values.diamondReward,
        questionCount: 0,
        status: 'DRAFT',
      })
      setLessons((current) => [...current, lesson].sort(
        (left, right) => left.orderIndex - right.orderIndex || left.createdAt.localeCompare(right.createdAt),
      ))
      setSelectedLessonId(lesson.id)
      setAssignedQuestionIds([])
      setIsLessonFormOpen(false)

      if (questionIds.length === 0) {
        setPendingQuestionAssignment(null)
        setStatusMessage(
          'Đã tạo Lesson DRAFT. Lesson này đã được chọn để nhận các câu hỏi AI sau khi lưu.',
        )
        return
      }

      setPendingQuestionAssignment({ topicId, questionIds, lessonId: lesson.id })
      setStatusMessage('Đã tạo Lesson DRAFT. Đang gán các câu hỏi đã chọn...')
      const assigned = await assignQuestionsToLesson(lesson.id, questionIds)
      if (!assigned) {
        setStatusMessage('Lesson đã được tạo nhưng chưa gán câu hỏi. Bạn có thể thử gán lại.')
      }
    } catch (error: unknown) {
      setLessonFormError(getAdminContentError(error, 'Không thể tạo Lesson mới.'))
    } finally {
      setIsCreatingLesson(false)
    }
  }

  async function retryPendingQuestionAssignment() {
    const pending = pendingQuestionAssignment
    if (!pending || !pending.lessonId) return
    if (pending.topicId !== selectedTopicId) {
      setErrorMessage('Topic hiện tại không khớp với Lesson đang chờ gán.')
      return
    }
    await assignQuestionsToLesson(pending.lessonId, pending.questionIds)
  }

  // --- Handlers: Question Actions (Single & Bulk) ---
  async function handlePublishQuestion(qId: string) {
    try {
      await adminQuestionService.updateQuestionStatus(qId, 'PUBLISHED')
      setStatusMessage('Đã chuyển câu hỏi sang trạng thái PUBLISHED. Gán vào Lesson là thao tác riêng.')
      setNewlyGeneratedQuestions((prev) => prev.filter((q) => q.id !== qId))
      setSelectedQuestionIds((prev) => prev.filter((i) => i !== qId))
      void loadDraftsForTopic(selectedTopicId)
    } catch (error: unknown) {
      setErrorMessage(getAdminContentError(error, 'Không thể Publish câu hỏi.'))
    }
  }

  async function handleDeleteQuestion(qId: string) {
    if (!window.confirm('Bạn có chắc muốn xóa câu hỏi này?')) return
    try {
      await adminQuestionService.deleteQuestion(qId)
      setStatusMessage('Đã xóa câu hỏi khỏi hệ thống.')
      setNewlyGeneratedQuestions((prev) => prev.filter((q) => q.id !== qId))
      setDraftQuestions((prev) => prev.filter((q) => q.id !== qId))
      setSelectedQuestionIds((prev) => prev.filter((i) => i !== qId))
      setAssignedQuestionIds((prev) => prev.filter((id) => id !== qId))
    } catch (err: unknown) {
      setErrorMessage(getAdminContentError(err, 'Lỗi xóa câu hỏi'))
    }
  }

  async function handleBulkPublishQuestions() {
    const idsToPublish = selectedQuestionIds.length > 0 ? selectedQuestionIds : activeQuestionsToShow.map((q) => q.id)
    if (idsToPublish.length === 0) return
    try {
      await adminAiService.bulkPublishQuestions(idsToPublish)
      setStatusMessage(`Đã chuyển ${idsToPublish.length} câu hỏi sang PUBLISHED. Gán vào Lesson là thao tác riêng.`)
      setNewlyGeneratedQuestions((prev) => prev.filter((q) => !idsToPublish.includes(q.id)))
      setSelectedQuestionIds([])
      void loadDraftsForTopic(selectedTopicId)
    } catch (error: unknown) {
      setErrorMessage(getAdminContentError(error, 'Không thể Publish các câu hỏi đã chọn.'))
    }
  }

  async function handleBulkDeleteQuestions() {
    if (selectedQuestionIds.length === 0) return
    if (!window.confirm(`Bạn có chắc muốn XÓA ${selectedQuestionIds.length} câu hỏi đã chọn?`)) return
    try {
      await adminAiService.bulkDeleteQuestions(selectedQuestionIds)
      setStatusMessage(`Đã xóa thành công ${selectedQuestionIds.length} câu hỏi đã chọn!`)
      setNewlyGeneratedQuestions((prev) => prev.filter((q) => !selectedQuestionIds.includes(q.id)))
      setAssignedQuestionIds((prev) => prev.filter((id) => !selectedQuestionIds.includes(id)))
      setSelectedQuestionIds([])
      void loadDraftsForTopic(selectedTopicId)
    } catch {
      setErrorMessage('Lỗi xóa hàng loạt câu hỏi')
    }
  }

  async function openEditQuestion(q: QuestionResponse | QuestionListItemResponse) {
    setQuestionFormServerError(null)
    setQuestionFormServerMediaErrors({})
    try {
      const fullQuestion = await adminQuestionService.getQuestionById(q.id)
      setSelectedQuestionForModal(fullQuestion)
    } catch (error: unknown) {
      setErrorMessage(getAdminContentError(error, 'Không thể tải chi tiết câu hỏi.'))
      return
    }
    setIsQuestionFormOpen(true)
  }

  async function openViewQuestion(q: QuestionResponse | QuestionListItemResponse) {
    if (isQuestionDetail(q)) {
      setViewItem(q)
      return
    }
    try {
      setViewItem(await adminQuestionService.getQuestionById(q.id))
    } catch (error: unknown) {
      setErrorMessage(getAdminContentError(error, 'Không thể tải chi tiết câu hỏi.'))
    }
  }

  const handleQuestionFormSubmit = async (submission: QuestionFormSubmission) => {
    if (!selectedQuestionForModal) return
    setIsQuestionFormSubmitting(true)
    setQuestionFormServerError(null)
    setQuestionFormServerMediaErrors({})
    try {
      const formData = buildQuestionFormData({
        payload: submission.payload,
        imageFile: submission.imageFile,
        audioFile: submission.audioFile,
        removeImage: submission.removeImage,
        removeAudio: submission.removeAudio,
      })
      await adminQuestionService.updateQuestion(selectedQuestionForModal.id, formData)
      setStatusMessage('Đã cập nhật câu hỏi thành công!')
      setIsQuestionFormOpen(false)
      setSelectedQuestionForModal(null)
      void loadDraftsForTopic(selectedTopicId)
    } catch (err: unknown) {
      setQuestionFormServerError(getAdminContentError(err, 'Không thể lưu câu hỏi.'))
    } finally {
      setIsQuestionFormSubmitting(false)
    }
  }

  return (
    <main className="w-full max-w-5xl px-4 py-6 md:px-8 space-y-6">
      {/* Header */}
      <PageHeader
        title="AI Tạo Nội Dung Học Tập Tự Động"
        description="AI tạo đề xuất để Admin kiểm tra; chỉ các mục được chọn và commit mới trở thành DRAFT trong hệ thống."
      />

      {/* AI Disclaimer Alert */}
      <div className="flex items-center gap-2.5 rounded-2xl border border-amber-200/90 bg-amber-50/70 px-4 py-3 text-xs font-semibold text-amber-800 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
        <span className="text-base">⚠️</span>
        <span>
          <strong>Lưu ý:</strong> Đề xuất AI chưa được lưu vào database. Hãy kiểm tra, chỉnh sửa và commit thành DRAFT trước; thao tác Publish chỉ dành cho record đã lưu.
        </span>
      </div>

      {/* Main Tabs */}
      <div className="flex items-center gap-3 border-b border-gray-200 pb-3 dark:border-gray-800">
        <button
          type="button"
          onClick={() => {
            setActiveTab('VOCAB')
            setSelectedVocabIds([])
            if (selectedTopicId) void loadDraftsForTopic(selectedTopicId)
          }}
          className={`rounded-2xl px-6 py-3 text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'VOCAB'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300'
          }`}
        >
          AI Tạo Từ Vựng
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('QUESTION')
            setViewFilter('NEWLY_GENERATED')
            setSelectedQuestionIds([])
            if (selectedTopicId) void loadDraftsForTopic(selectedTopicId)
          }}
          className={`rounded-2xl px-6 py-3 text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'QUESTION'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300'
          }`}
        >
          AI Tạo Câu Hỏi
        </button>
      </div>

      {/* Feedback Messages */}
      {errorMessage && (
        <div className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">
          ⚠️ {errorMessage}
        </div>
      )}
      {statusMessage && (
        <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800">
          {statusMessage}
        </div>
      )}

      {/* TAB 1: AI TẠO TỪ VỰNG */}
      {activeTab === 'VOCAB' && (
        <div className="space-y-6">
          <form
            onSubmit={handleGenerateVocab}
            className="rounded-3xl border-2 border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 space-y-4"
          >
            <h2 className="text-base font-black text-gray-900 dark:text-white">
              Chọn Course ➔ Section ➔ Topic để tạo đề xuất từ vựng
            </h2>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-black uppercase text-gray-700 dark:text-gray-300 mb-1">
                  1. Khóa học (Bắt buộc)
                </label>
                <select
                  value={selectedCourseId}
                  disabled={isGeneratingVocab || isCommittingVocab}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-xs font-bold text-gray-800 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  <option value="">-- Chọn Khóa học --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-gray-700 dark:text-gray-300 mb-1">
                  2. Phần học ({selectedCourseId ? 'Bắt buộc' : 'Vui lòng chọn 1 trước'})
                </label>
                <select
                  disabled={!selectedCourseId || isLoadingSections || isGeneratingVocab || isCommittingVocab}
                  value={selectedSectionId}
                  onChange={(e) => handleSectionChange(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-xs font-bold text-gray-800 outline-none focus:border-emerald-500 disabled:bg-gray-100 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  <option value="">
                    {isLoadingSections ? 'Đang tải phần học...' : selectedCourseId ? '-- Chọn Phần học trong Khóa học --' : '-- Chọn Khóa học trước --'}
                  </option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-gray-700 dark:text-gray-300 mb-1">
                  3. Chủ đề ({selectedSectionId ? 'Bắt buộc' : 'Vui lòng chọn 2 trước'})
                </label>
                <select
                  disabled={!selectedSectionId || isLoadingTopics || isGeneratingVocab || isCommittingVocab}
                  value={selectedTopicId}
                  onChange={(e) => handleTopicChange(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-xs font-bold text-gray-800 outline-none focus:border-emerald-500 disabled:bg-gray-100 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  <option value="">
                    {isLoadingTopics ? 'Đang tải chủ đề...' : selectedSectionId ? '-- Chọn Chủ đề trong Phần học --' : '-- Chọn Phần học trước --'}
                  </option>
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-black uppercase text-gray-700 dark:text-gray-300 mb-1">
                  Trình độ lấy từ Course
                </label>
                <div className="rounded-xl border border-gray-200 bg-gray-100 p-2.5 text-xs font-black text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                  {courses.find((course) => course.id === selectedCourseId)?.level || 'Chưa chọn Course'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-gray-700 dark:text-gray-300 mb-1">
                  Số lượng từ (Quantity)
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={vocabQuantity}
                  onChange={(event) =>
                    setVocabQuantity(
                      Math.max(1, Math.min(20, Number(event.target.value) || 1)),
                    )
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-xs font-bold text-gray-800 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-gray-700 dark:text-gray-300 mb-1">
                  Yêu cầu bổ sung
                </label>
                <textarea
                  value={vocabRequirements}
                  maxLength={500}
                  rows={2}
                  placeholder="Ví dụ: Ưu tiên từ thông dụng trong giao tiếp"
                  onChange={(event) => setVocabRequirements(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-xs font-bold text-gray-800 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
                <span className="text-[10px] font-semibold text-gray-400">
                  {vocabRequirements.length}/500
                </span>
              </div>
            </div>

            <div className="flex justify-end items-center gap-3 pt-2">
              {isGeneratingVocab && (
                <button
                  type="button"
                  onClick={handleCancelGenerateVocab}
                  className="rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-black uppercase text-white shadow-md hover:bg-rose-700 transition-all"
                >
                  ⛔ Hủy Lệnh AI
                </button>
              )}
              <button
                type="submit"
                disabled={isGeneratingVocab || isCommittingVocab}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-black uppercase text-white shadow-md hover:bg-emerald-700 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isGeneratingVocab ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>AI đang tạo đề xuất...</span>
                  </>
                ) : (
                  <>
                    <span>Tạo {vocabQuantity} từ bằng AI</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <AiVocabularyPreview
            candidates={vocabularyCandidates}
            selectedKeys={selectedCandidateKeys}
            generationStatus={vocabularyGenerationStatus}
            isCommitting={isCommittingVocab}
            onCandidatesChange={setVocabularyCandidates}
            onSelectedKeysChange={setSelectedCandidateKeys}
            onCommit={handleCommitVocabularies}
          />

          <div className="flex flex-wrap gap-2 text-[11px] font-black uppercase">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">
              Đề xuất AI chưa lưu
            </span>
            <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-800">
              Vocabulary DRAFT đã lưu
            </span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">
              Vocabulary đã PUBLISHED
            </span>
          </div>

          {/* Draft Vocabs List with Multi-Select Controls */}
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-black text-gray-900 dark:text-white">
                  Vocabulary DRAFT đã lưu ({draftVocabs.length})
                </h3>
                <p className="text-xs font-semibold text-gray-500">
                  Chỉ các record có ID trong database mới có thể sửa, xóa hoặc publish.
                </p>
              </div>

              {/* Multi-Select Action Controls */}
              {draftVocabs.length > 0 && (
                <div className="flex items-center gap-2">
                  <label className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={draftVocabs.length > 0 && selectedVocabIds.length === draftVocabs.length}
                      onChange={toggleSelectAllVocabs}
                      className="accent-emerald-600 h-4 w-4"
                    />
                    <span>Chọn tất cả ({selectedVocabIds.length}/{draftVocabs.length})</span>
                  </label>

                  {selectedVocabIds.length > 0 && (
                    <button
                      type="button"
                      onClick={handleBulkDeleteVocabs}
                      className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-black uppercase text-white shadow-sm hover:bg-rose-700"
                    >
                      Xóa đã chọn ({selectedVocabIds.length})
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleBulkPublishVocabs}
                    className="rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-black uppercase text-white shadow-sm hover:bg-emerald-700"
                  >
                    Publish {selectedVocabIds.length > 0 ? `đã chọn (${selectedVocabIds.length})` : `tất cả (${draftVocabs.length})`}
                  </button>
                </div>
              )}
            </div>

            {isLoadingDrafts ? (
              <div className="py-8 text-center">
                <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              </div>
            ) : draftVocabs.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center text-xs font-bold text-gray-500 dark:border-gray-800">
                Chưa có Vocabulary DRAFT nào đã lưu trong chủ đề này.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {draftVocabs.map((v) => {
                  const isChecked = selectedVocabIds.includes(v.id)
                  return (
                    <div
                      key={v.id}
                      className={`flex flex-col justify-between rounded-2xl border-2 p-4 shadow-sm transition-all space-y-3 ${
                        isChecked
                          ? 'border-emerald-500 bg-emerald-50/60 dark:border-emerald-600 dark:bg-emerald-950/40'
                          : 'border-amber-200 bg-amber-50/40 dark:border-amber-900/40 dark:bg-gray-900'
                      }`}
                    >
                      <div>
                        {/* Saved Vocabulary location */}
                        <div className="mb-2 flex flex-wrap items-center gap-1 text-[10px] font-bold text-gray-500 bg-amber-100/80 dark:bg-gray-800 px-2.5 py-1 rounded-xl">
                          <span className="text-emerald-700 dark:text-emerald-400">📚 {courses.find((c) => c.id === selectedCourseId)?.name || 'Khóa học'}</span>
                          <span>➔</span>
                          <span className="text-purple-700 dark:text-purple-400">📑 {sections.find((s) => s.id === selectedSectionId)?.name || 'Phần học'}</span>
                          <span>➔</span>
                          <span className="text-amber-700 dark:text-amber-400">📂 {topics.find((t) => t.id === selectedTopicId)?.name || 'Chủ đề'}</span>
                        </div>

                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSelectVocab(v.id)}
                              className="mt-1 h-4 w-4 accent-emerald-600 cursor-pointer"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-base font-black text-gray-900 dark:text-white">{v.word}</h4>
                                {v.partOfSpeech && (
                                  <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] uppercase font-bold text-gray-600 dark:bg-gray-800">
                                    {v.partOfSpeech}
                                  </span>
                                )}
                              </div>
                              {v.phonetic && <span className="text-xs text-emerald-600 font-bold">{v.phonetic}</span>}
                            </div>
                          </div>
                          <span className="rounded-lg bg-sky-100 px-2 py-0.5 text-[10px] font-black uppercase text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                            Vocabulary DRAFT đã lưu
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-bold text-gray-800 dark:text-gray-200">{v.meaning}</p>
                        {v.example && <p className="mt-1 text-xs italic text-gray-500">&quot;{v.example}&quot;</p>}
                      </div>

                      {/* 4 Action Buttons */}
                      <div className="flex items-center justify-end gap-1.5 border-t border-amber-200/60 pt-3 dark:border-gray-800">
                        <button
                          type="button"
                          onClick={() => setViewItem(v)}
                          className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-gray-700 hover:bg-gray-100 border border-gray-200 dark:bg-gray-800 dark:text-gray-200"
                        >
                          Xem
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditVocab(v)}
                          className="rounded-lg bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-300"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePublishVocab(v.id)}
                          className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-black text-white hover:bg-emerald-700"
                        >
                          Publish
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteVocab(v.id)}
                          className="rounded-lg bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-200 dark:bg-rose-950 dark:text-rose-300"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: AI TẠO CÂU HỎI */}
      {activeTab === 'QUESTION' && (
        <div className="space-y-6">
          <form
            onSubmit={handleGenerateQuestion}
            className="rounded-3xl border-2 border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 space-y-4"
          >
            <h2 className="text-base font-black text-gray-900 dark:text-white">
              Chọn Course ➔ Section ➔ Topic để tạo đề xuất câu hỏi
            </h2>

            {/* 3 Main Cascade Steps: Course -> Section -> Topic */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-black uppercase text-gray-700 dark:text-gray-300 mb-1">
                  1. Khóa học (Bắt buộc)
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-xs font-bold text-gray-800 outline-none focus:border-cyan-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  <option value="">-- Chọn Khóa học --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-gray-700 dark:text-gray-300 mb-1">
                  2. Phần học ({selectedCourseId ? 'Bắt buộc' : 'Vui lòng chọn 1 trước'})
                </label>
                <select
                  disabled={!selectedCourseId || isLoadingSections}
                  value={selectedSectionId}
                  onChange={(e) => handleSectionChange(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-xs font-bold text-gray-800 outline-none focus:border-cyan-500 disabled:bg-gray-100 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  <option value="">
                    {isLoadingSections ? 'Đang tải phần học...' : selectedCourseId ? '-- Chọn Phần học trong Khóa học --' : '-- Chọn Khóa học trước --'}
                  </option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-gray-700 dark:text-gray-300 mb-1">
                  3. Chủ đề ({selectedSectionId ? 'Bắt buộc' : 'Vui lòng chọn 2 trước'})
                </label>
                <select
                  disabled={!selectedSectionId || isLoadingTopics}
                  value={selectedTopicId}
                  onChange={(e) => handleTopicChange(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-xs font-bold text-gray-800 outline-none focus:border-cyan-500 disabled:bg-gray-100 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  <option value="">
                    {isLoadingTopics ? 'Đang tải chủ đề...' : selectedSectionId ? '-- Chọn Chủ đề trong Phần học --' : '-- Chọn Phần học trước --'}
                  </option>
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sibling Level under Topic: Lesson & Vocabulary */}
            <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-gray-200 dark:border-gray-800">
              <div>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <label className="block text-xs font-black uppercase text-cyan-700 dark:text-cyan-400">
                      📖 Lesson ngữ cảnh/đích gán (không bắt buộc)
                    </label>
                    {selectedTopicId && (
                      <button
                        type="button"
                        onClick={() => {
                          setLessonFormError(null)
                          setErrorMessage(null)
                          setIsLessonFormOpen(true)
                        }}
                        disabled={isCreatingLesson || isAssigningQuestions}
                        className="text-[11px] font-bold text-cyan-600 hover:underline disabled:opacity-50 dark:text-cyan-400"
                      >
                        + Tạo bài học mới
                      </button>
                    )}
                  </div>
                  <select
                  disabled={!selectedTopicId || isLoadingLessons || isCommittingQuestion}
                  value={selectedLessonId}
                  onChange={(e) => handleLessonSelection(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-xs font-bold text-gray-800 outline-none focus:border-cyan-500 disabled:bg-gray-100 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  <option value="">
                    {isLoadingLessons ? 'Đang tải bài học...' : selectedTopicId ? '-- Chọn Lesson để gán câu hỏi --' : '-- Chọn Chủ đề trước --'}
                  </option>
                  {lessons.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
                {selectedTopicId && lessons.length === 0 && !isLoadingLessons && (
                  <p className="mt-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                    Topic chưa có Lesson. Hãy tạo Lesson mới để gán câu hỏi.
                  </p>
                )}
                <p className="mt-1 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                  Nếu chọn Lesson, sau khi commit thành DRAFT hệ thống sẽ tự gán các Question vừa lưu vào Lesson đó.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-black uppercase text-emerald-700 dark:text-emerald-400">
                    🔤 Từ vựng thuộc Chủ đề ({selectedTargetVocabIds.length > 0 ? `Đã chọn ${selectedTargetVocabIds.length}/${vocabularies.length} từ` : `Tất cả ${vocabularies.length} từ`})
                  </label>
                  {vocabularies.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const allIds = vocabularies.map((v) => v.id)
                        if (selectedTargetVocabIds.length === vocabularies.length) {
                          setSelectedTargetVocabIds([])
                        } else {
                          setSelectedTargetVocabIds(allIds)
                        }
                      }}
                      className="text-[11px] font-bold text-cyan-600 hover:underline dark:text-cyan-400"
                    >
                      {selectedTargetVocabIds.length === vocabularies.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả từ'}
                    </button>
                  )}
                </div>

                {!selectedTopicId ? (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs font-bold text-gray-400 dark:border-gray-800 dark:bg-gray-900">
                    -- Chọn Chủ đề trước --
                  </div>
                ) : vocabularies.length === 0 ? (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs font-bold text-gray-400 dark:border-gray-800 dark:bg-gray-900">
                    Chủ đề này chưa có từ vựng nào.
                  </div>
                ) : (
                  <div className="max-h-36 overflow-y-auto flex flex-wrap gap-1.5 rounded-xl border border-gray-300 bg-white p-2.5 dark:border-gray-700 dark:bg-gray-900">
                    {vocabularies.map((v) => {
                      const vId = v.id
                      const isSelected = selectedTargetVocabIds.includes(vId)
                      return (
                        <button
                          key={vId}
                          type="button"
                          onClick={() => {
                            setSelectedTargetVocabIds((prev) =>
                              prev.includes(vId) ? prev.filter((i) => i !== vId) : [...prev, vId],
                            )
                          }}
                          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                          }`}
                        >
                          <span>{isSelected ? '✓' : '+'}</span>
                          <span>{v.word}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Checkboxes & Parameters */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-black uppercase text-gray-700 dark:text-gray-300 mb-2">
                  Loại câu hỏi:
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {([
                    { id: 'MULTIPLE_CHOICE', label: 'Trắc nghiệm' },
                    { id: 'FILL_BLANK', label: 'Điền từ' },
                    { id: 'MATCHING', label: 'Nối từ' },
                    { id: 'ORDER_SENTENCE', label: 'Sắp xếp câu' },
                  ] satisfies ReadonlyArray<{ id: AiSupportedQuestionType; label: string }>).map((t) => (
                    <label
                      key={t.id}
                      className={`flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                        questionTypes.includes(t.id)
                          ? 'border-cyan-500 bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300'
                          : 'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={questionTypes.includes(t.id)}
                        onChange={() => {
                          setQuestionTypes((prev) =>
                            prev.includes(t.id) ? prev.filter((item) => item !== t.id) : [...prev, t.id],
                          )
                        }}
                        className="accent-cyan-600"
                      />
                      <span>{t.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-black uppercase text-gray-700 dark:text-gray-300 mb-1">
                    Độ khó
                  </label>
                  <select
                    value={questionDifficulty}
                    onChange={(event) =>
                      setQuestionDifficulty(
                        event.target.value as 'EASY' | 'MEDIUM' | 'HARD',
                      )
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-xs font-bold text-gray-800 outline-none focus:border-cyan-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  >
                    <option value="EASY">Dễ (EASY)</option>
                    <option value="MEDIUM">Vừa (MEDIUM)</option>
                    <option value="HARD">Khó (HARD)</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-black uppercase text-gray-700 dark:text-gray-300 mb-1">
                    Số lượng
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={questionQuantity}
                    onChange={(e) => setQuestionQuantity(Math.max(1, Math.min(50, Number(e.target.value))))}
                    className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-xs font-bold text-gray-800 outline-none focus:border-cyan-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-black uppercase text-gray-700 dark:text-gray-300">
                Yêu cầu bổ sung (không bắt buộc)
              </label>
              <textarea
                value={questionRequirements}
                onChange={(event) => setQuestionRequirements(event.target.value.slice(0, 500))}
                maxLength={500}
                rows={3}
                placeholder="Ví dụ: dùng ngữ cảnh giao tiếp hằng ngày, câu ngắn và rõ ràng..."
                className="w-full rounded-xl border border-gray-300 bg-white p-3 text-xs font-semibold text-gray-800 outline-none focus:border-cyan-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
              <p className="mt-1 text-right text-[10px] font-semibold text-gray-400">
                {questionRequirements.length}/500
              </p>
            </div>

            <div className="flex justify-end items-center gap-3 pt-2">
              {isGeneratingQuestion && (
                <button
                  type="button"
                  onClick={handleCancelGenerateQuestion}
                  className="rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-black uppercase text-white shadow-md hover:bg-rose-700 transition-all"
                >
                  ⛔ Hủy Lệnh AI
                </button>
              )}
              <button
                type="submit"
                disabled={isGeneratingQuestion || isCommittingQuestion}
                className="flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-2.5 text-xs font-black uppercase text-white shadow-md hover:bg-cyan-700 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isGeneratingQuestion ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>AI Đang Tạo Câu Hỏi...</span>
                  </>
                ) : (
                  <>
                    <span>AI Tạo {questionQuantity} Đề Xuất Câu Hỏi</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {questionGenerationId && questionGenerationStatus && (
            <AiQuestionPreview
              candidates={questionCandidates}
              vocabularies={vocabularies.map(({ id, word }) => ({ id, word }))}
              selectedKeys={selectedQuestionCandidateKeys}
              generationStatus={questionGenerationStatus}
              isCommitting={isCommittingQuestion}
              onCandidatesChange={setQuestionCandidates}
              onSelectedKeysChange={setSelectedQuestionCandidateKeys}
              onCommit={handleCommitQuestions}
            />
          )}

          {/* Draft Questions List with Multi-Select Controls */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase">
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">Đề xuất AI: chưa lưu</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">DRAFT: đã lưu, chưa Publish</span>
              <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-indigo-700">Đã gán: thuộc Lesson đang chọn</span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700">PUBLISHED: đã phát hành</span>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Filter Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setViewFilter('NEWLY_GENERATED')
                    setSelectedQuestionIds([])
                  }}
                  className={`rounded-xl px-4 py-2 text-xs font-black transition-all ${
                    viewFilter === 'NEWLY_GENERATED'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                  }`}
                >
                  Vừa Lưu DRAFT ({newlyGeneratedQuestions.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewFilter('ALL_DRAFTS')
                    setSelectedQuestionIds([])
                  }}
                  className={`rounded-xl px-4 py-2 text-xs font-black transition-all ${
                    viewFilter === 'ALL_DRAFTS'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                  }`}
                >
                  Tất Cả Bản Nháp ({draftQuestions.length})
                </button>
              </div>

              {/* Multi-Select Action Controls */}
              {activeQuestionsToShow.length > 0 && (
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <label className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={activeQuestionsToShow.length > 0 && selectedQuestionIds.length === activeQuestionsToShow.length}
                      onChange={toggleSelectAllQuestions}
                      className="accent-cyan-600 h-4 w-4"
                    />
                    <span>Chọn tất cả ({selectedQuestionIds.length}/{activeQuestionsToShow.length})</span>
                  </label>

                  {selectedQuestionIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => void handleAssignSelectedQuestions()}
                      disabled={!selectedLessonId || isAssigningQuestions || isCreatingLesson}
                      className="rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-black uppercase text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isAssigningQuestions ? 'Đang gán...' : `Gán vào Lesson (${selectedQuestionIds.length})`}
                    </button>
                  )}

                  {selectedQuestionIds.length > 0 && (
                    <button
                      type="button"
                      onClick={handleBulkDeleteQuestions}
                      className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-black uppercase text-white shadow-sm hover:bg-rose-700"
                    >
                      Xóa đã chọn ({selectedQuestionIds.length})
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleBulkPublishQuestions}
                    className="rounded-xl bg-cyan-600 px-4 py-1.5 text-xs font-black uppercase text-white shadow-sm hover:bg-cyan-700"
                  >
                    Publish {selectedQuestionIds.length > 0 ? `đã chọn (${selectedQuestionIds.length})` : `tất cả (${activeQuestionsToShow.length})`}
                  </button>
                </div>
              )}
            </div>

            {pendingQuestionAssignment?.lessonId && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                <span>
                  Lesson đã tạo nhưng còn {pendingQuestionAssignment.questionIds.length} câu hỏi chưa được gán. Lesson vẫn được giữ lại để tránh tạo trùng.
                </span>
                <button
                  type="button"
                  onClick={() => void retryPendingQuestionAssignment()}
                  disabled={isAssigningQuestions}
                  className="rounded-lg bg-amber-600 px-3 py-1.5 text-[11px] font-black text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {isAssigningQuestions ? 'Đang thử lại...' : 'Thử gán lại'}
                </button>
              </div>
            )}

            {isLoadingDrafts ? (
              <div className="py-8 text-center">
                <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
              </div>
            ) : activeQuestionsToShow.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center text-xs font-bold text-gray-500 dark:border-gray-800">
                {viewFilter === 'NEWLY_GENERATED'
                  ? 'Chưa có Question DRAFT nào vừa được lưu từ danh sách đề xuất AI.'
                  : 'Chưa có Question DRAFT nào trong Topic này.'}
              </div>
            ) : (
              <div className="space-y-3">
                {activeQuestionsToShow.map((q) => {
                  const isChecked = selectedQuestionIds.includes(q.id)
                  return (
                    <div
                      key={q.id}
                      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border-2 p-4 shadow-sm transition-all ${
                        isChecked
                          ? 'border-cyan-500 bg-cyan-50/70 dark:border-cyan-600 dark:bg-cyan-950/40'
                          : 'border-cyan-200 bg-cyan-50/30 dark:border-cyan-900/40 dark:bg-gray-900'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectQuestion(q.id)}
                          className="mt-1 h-4 w-4 accent-cyan-600 cursor-pointer"
                        />
                        <div className="space-y-1">
                          {/* Question belongs to Topic; Lesson assignment is shown separately. */}
                          <div className="mb-1.5 inline-flex flex-wrap items-center gap-1 text-[10px] font-bold text-gray-500 bg-cyan-100/80 dark:bg-gray-800 px-2.5 py-0.5 rounded-xl">
                            <span className="text-emerald-700 dark:text-emerald-400">📚 {courses.find((c) => c.id === selectedCourseId)?.name || 'Khóa học'}</span>
                            <span>➔</span>
                            <span className="text-purple-700 dark:text-purple-400">📑 {sections.find((s) => s.id === selectedSectionId)?.name || 'Phần học'}</span>
                            <span>➔</span>
                            <span className="text-amber-700 dark:text-amber-400">📂 {topics.find((t) => t.id === selectedTopicId)?.name || 'Chủ đề'}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="rounded bg-cyan-100 px-2 py-0.5 text-[10px] font-black uppercase text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
                              {q.type}
                            </span>
                            {q.createdByAi && (
                              <span className="rounded bg-purple-100 px-2 py-0.5 text-[10px] font-black uppercase text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                                AI GENERATED
                              </span>
                            )}
                            <span className="text-[10px] font-bold text-gray-400">Độ khó: {q.difficulty}</span>
                            <span className={`rounded px-2 py-0.5 text-[10px] font-black uppercase ${
                              assignedQuestionIds.includes(q.id)
                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {assignedQuestionIds.includes(q.id)
                                ? 'Đã gán vào Lesson đang chọn'
                                : 'Chưa gán vào Lesson đang chọn'}
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-gray-900 dark:text-white">{q.content}</h4>
                          {isQuestionDetail(q) && q.explanation && (
                            <p className="text-xs text-gray-500">💡 {q.explanation}</p>
                          )}
                        </div>
                      </div>

                      {/* 4 Action Buttons */}
                      <div className="flex items-center justify-end gap-1.5 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => void openViewQuestion(q)}
                          className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-gray-700 hover:bg-gray-100 border border-gray-200 dark:bg-gray-800 dark:text-gray-200"
                        >
                          Xem
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditQuestion(q)}
                          className="rounded-lg bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-300"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePublishQuestion(q.id)}
                          className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-black text-white hover:bg-emerald-700"
                        >
                          Publish
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="rounded-lg bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-200 dark:bg-rose-950 dark:text-rose-300"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-900 border-2 border-emerald-500/30 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 dark:border-gray-800">
              <h3 className="text-base font-black text-gray-900 dark:text-white">
                Preview Chi Tiết ({'word' in viewItem ? viewItem.word : viewItem.type})
              </h3>
              <button
                type="button"
                onClick={() => setViewItem(null)}
                className="text-lg font-black text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="py-2 space-y-3">
              {'word' in viewItem ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-emerald-600">{viewItem.word}</span>
                    {viewItem.phonetic && <span className="text-sm font-bold text-gray-400">{viewItem.phonetic}</span>}
                    {viewItem.partOfSpeech && (
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-bold uppercase text-gray-600">
                        {viewItem.partOfSpeech}
                      </span>
                    )}
                  </div>
                  <p className="text-base font-bold text-gray-800 dark:text-gray-200">
                    Nghĩa: {viewItem.meaning}
                  </p>
                  {viewItem.example && (
                    <div className="rounded-xl bg-gray-50 p-3 text-xs dark:bg-gray-800">
                      <p className="font-semibold text-gray-700 dark:text-gray-300">&quot;{viewItem.example}&quot;</p>
                      {viewItem.exampleMeaning && <p className="mt-1 text-gray-500">{viewItem.exampleMeaning}</p>}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="text-sm font-black text-gray-800 dark:text-white">{viewItem.content}</p>
                  {viewItem.type === 'ORDER_SENTENCE' && viewItem.options ? (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-gray-500">🧩 Các thẻ từ (Word Chips):</p>
                      <div className="flex flex-wrap gap-2">
                        {viewItem.options.map((opt, idx) => (
                          <span
                            key={idx}
                            className="rounded-xl border border-emerald-500/30 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          >
                            {opt.content}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : viewItem.options ? (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-gray-500">Các lựa chọn:</p>
                      {viewItem.options.map((opt, idx) => (
                        <div
                          key={idx}
                          className={`rounded-xl p-2.5 text-xs font-bold border ${
                            opt.isCorrect
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-300'
                          }`}
                        >
                          {opt.content} {opt.isCorrect && '(Đáp án đúng)'}
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {viewItem.correctAnswer && (
                    <div className="rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Đáp án đúng: {Array.isArray(viewItem.correctAnswer) ? viewItem.correctAnswer.join(' ') : String(viewItem.correctAnswer)}
                    </div>
                  )}
                  {viewItem.matchingPairs && (
                    <div className="space-y-1 rounded-xl bg-gray-50 p-3 text-xs dark:bg-gray-800">
                      <p className="font-bold text-gray-700 dark:text-gray-300">Cặp từ ghép nối:</p>
                      {viewItem.matchingPairs.map((p, idx) => (
                        <div key={idx} className="flex items-center gap-2 font-semibold text-emerald-600">
                          <span>{p.leftValue}</span> ➔ <span>{p.rightValue}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {viewItem.explanation && (
                    <p className="text-xs italic text-gray-500">💡 Giải thích: {viewItem.explanation}</p>
                  )}
                </>
              )}
            </div>

            <div className="text-right border-t pt-3 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setViewItem(null)}
                className="rounded-xl bg-gray-200 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL UNIFIED VOCABULARY FORM MODAL */}
      <VocabularyFormModal
        isOpen={isVocabFormOpen}
        vocabulary={selectedVocabForModal}
        isLoading={isVocabFormSubmitting}
        serverError={vocabFormServerError}
        onSubmit={handleVocabFormSubmit}
        onClose={() => {
          setIsVocabFormOpen(false)
          setSelectedVocabForModal(null)
        }}
      />

      <LessonFormModal
        isOpen={isLessonFormOpen}
        assignmentMode
        nextOrderIndex={lessons.reduce((max, lesson) => Math.max(max, lesson.orderIndex), -1) + 1}
        isLoading={isCreatingLesson}
        serverNameError={null}
        serverError={lessonFormError}
        onSubmit={handleCreateLessonForAssignment}
        onClose={() => {
          if (!isCreatingLesson) {
            setIsLessonFormOpen(false)
            setLessonFormError(null)
          }
        }}
      />

      {/* FULL UNIFIED QUESTION FORM MODAL */}
      <QuestionFormModal
        isOpen={isQuestionFormOpen}
        question={selectedQuestionForModal}
        topicVocabularies={vocabularies}
        isLoading={isQuestionFormSubmitting}
        serverError={questionFormServerError}
        serverMediaErrors={questionFormServerMediaErrors}
        onSubmit={handleQuestionFormSubmit}
        onClose={() => {
          setIsQuestionFormOpen(false)
          setSelectedQuestionForModal(null)
        }}
      />
    </main>
  )
}
