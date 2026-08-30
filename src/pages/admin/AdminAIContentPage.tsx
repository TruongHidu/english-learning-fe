import { useState, useEffect, useRef } from 'react'
import { adminAiService } from '../../services/admin-ai.service'
import { adminCourseService } from '../../services/admin-course.service'
import { adminSectionService } from '../../services/admin-section.service'
import { adminTopicService } from '../../services/admin-topic.service'
import { adminLessonService } from '../../services/admin-lesson.service'
import { adminVocabularyService } from '../../services/admin-vocabulary.service'
import { adminQuestionService } from '../../services/admin-question.service'
import PageHeader from '../../components/admin/PageHeader'
import QuestionFormModal from '../../components/admin/QuestionFormModal'
import VocabularyFormModal from '../../components/admin/VocabularyFormModal'
import type {
  QuestionFormSubmission,
  QuestionMediaFieldErrors,
  QuestionResponse,
} from '../../types/question.types'
import type {
  CreateVocabularyInput,
  VocabularyResponse,
} from '../../types/vocabulary.types'
import { getAdminContentError } from '../../utils/admin-content-errors'
import { buildQuestionFormData } from '../../utils/question-media'

export default function AdminAIContentPage() {
  const [activeTab, setActiveTab] = useState<'VOCAB' | 'QUESTION'>('VOCAB')

  // 4-Step Cascade Select Data State: Course -> Section -> Topic -> Lesson
  const [courses, setCourses] = useState<any[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState('')

  const [sections, setSections] = useState<any[]>([])
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [isLoadingSections, setIsLoadingSections] = useState(false)

  const [topics, setTopics] = useState<any[]>([])
  const [selectedTopicId, setSelectedTopicId] = useState('')
  const [isLoadingTopics, setIsLoadingTopics] = useState(false)

  const [lessons, setLessons] = useState<any[]>([])
  const [selectedLessonId, setSelectedLessonId] = useState('')
  const [isLoadingLessons, setIsLoadingLessons] = useState(false)

  const [vocabularies, setVocabularies] = useState<any[]>([])
  const [selectedVocabId, setSelectedVocabId] = useState('')

  // Form Parameters
  const [vocabLevel, setVocabLevel] = useState<'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'>('A1')
  const [vocabQuantity, setVocabQuantity] = useState(20)

  const [questionTypes, setQuestionTypes] = useState<string[]>([
    'MULTIPLE_CHOICE',
    'FILL_IN_BLANK',
    'TRANSLATION',
    'MATCHING',
    'REORDER',
  ])
  const [questionQuantity, setQuestionQuantity] = useState(8)
  const [questionDifficulty, setQuestionDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('EASY')

  // Status & Feedback States
  const [isGeneratingVocab, setIsGeneratingVocab] = useState(false)
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // View Filter Mode: 'NEWLY_GENERATED' vs 'ALL_DRAFTS' (Default ALL_DRAFTS for persistence on F5)
  const [viewFilter, setViewFilter] = useState<'NEWLY_GENERATED' | 'ALL_DRAFTS'>('ALL_DRAFTS')

  // Multi-Select State
  const [selectedVocabIds, setSelectedVocabIds] = useState<string[]>([])
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([])
  const [selectedTargetVocabIds, setSelectedTargetVocabIds] = useState<string[]>([])

  // Draft List & Newly Generated States
  const [draftVocabs, setDraftVocabs] = useState<any[]>([])
  const [newlyGeneratedVocabs, setNewlyGeneratedVocabs] = useState<any[]>([])

  const [draftQuestions, setDraftQuestions] = useState<any[]>([])
  const [newlyGeneratedQuestions, setNewlyGeneratedQuestions] = useState<any[]>([])

  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false)

  // View / Edit Modal States for Vocab & Question
  const [viewItem, setViewItem] = useState<any | null>(null)
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
  async function handleCourseChange(courseId: string) {
    setSelectedCourseId(courseId)
    setSelectedSectionId('')
    setSections([])
    setSelectedTopicId('')
    setTopics([])
    setSelectedLessonId('')
    setLessons([])
    setVocabularies([])
    setSelectedVocabId('')
    setSelectedTargetVocabIds([])
    setDraftVocabs([])
    setDraftQuestions([])
    setSelectedVocabIds([])
    setSelectedQuestionIds([])

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
    setSelectedSectionId(sectionId)
    setSelectedTopicId('')
    setTopics([])
    setSelectedLessonId('')
    setLessons([])
    setVocabularies([])
    setSelectedVocabId('')
    setSelectedTargetVocabIds([])
    setDraftVocabs([])
    setDraftQuestions([])
    setSelectedVocabIds([])
    setSelectedQuestionIds([])

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
    setSelectedTopicId(topicId)
    setSelectedLessonId('')
    setLessons([])
    setVocabularies([])
    setSelectedVocabId('')
    setSelectedTargetVocabIds([])
    setDraftVocabs([])
    setDraftQuestions([])
    setSelectedVocabIds([])
    setSelectedQuestionIds([])

    if (topicId) {
      await loadLessonsAndVocabs(topicId)
    }
  }

  async function loadLessonsAndVocabs(topicId: string) {
    setIsLoadingLessons(true)
    try {
      const [lessonData, vocabRes] = await Promise.all([
        adminLessonService.getLessonsByTopic(topicId),
        adminVocabularyService.getVocabulariesByTopic(topicId),
      ])
      setLessons(lessonData)
      if (lessonData.length > 0) {
        setSelectedLessonId(lessonData[0].id)
      } else {
        setSelectedLessonId('')
      }
      setVocabularies(vocabRes.vocabularies)
      setSelectedVocabId('')
      void loadDraftsForTopic(topicId)
    } catch (err) {
      console.error('Failed to load lessons and vocabularies for topic', err)
    } finally {
      setIsLoadingLessons(false)
    }
  }

  // Fetch up to 500 draft items for BOTH Vocabs and Questions simultaneously
  async function loadDraftsForTopic(topicId: string) {
    if (!topicId) return
    setIsLoadingDrafts(true)
    setSelectedVocabIds([])
    setSelectedQuestionIds([])
    try {
      const [vRes, qRes] = await Promise.all([
        adminVocabularyService.getVocabulariesByTopic(topicId, { status: 'DRAFT', limit: 500 }),
        adminQuestionService.getQuestionsByTopic(topicId, { status: 'DRAFT', limit: 500 }),
      ])
      setDraftVocabs(vRes.vocabularies)
      setDraftQuestions(qRes.questions)
    } catch (err) {
      console.error('Failed to load drafts', err)
    } finally {
      setIsLoadingDrafts(false)
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

    const controller = new AbortController()
    vocabAbortControllerRef.current = controller
    setIsGeneratingVocab(true)
    setErrorMessage(null)
    setStatusMessage(null)
    try {
      const qty = Math.max(1, Math.min(50, Number(vocabQuantity) || 20))
      const res = await adminAiService.generateVocabularies(
        {
          topicId: selectedTopicId,
          lessonId: selectedLessonId || undefined,
          level: vocabLevel,
          quantity: qty,
        },
        { signal: controller.signal }
      )
      setNewlyGeneratedVocabs(res.vocabularies)
      setViewFilter('NEWLY_GENERATED')
      setSelectedVocabIds([])
      setStatusMessage(`AI đã tạo đúng ${res.count} từ vựng mới thuộc bài/chủ đề đã chọn và lưu vào danh sách nháp!`)
      await loadDraftsForTopic(selectedTopicId)
      void loadLessonsAndVocabs(selectedTopicId)
    } catch (err: any) {
      console.error('handleGenerateVocab error:', err)
      if (err?.name === 'CanceledError' || err?.name === 'AbortError' || err?.code === 'ERR_CANCELED' || err?.message?.includes('canceled')) {
        setStatusMessage('Đã hủy lệnh AI tạo từ vựng!')
      } else {
        setErrorMessage(getAdminContentError(err, 'Lỗi khi AI sinh từ vựng'))
      }
    } finally {
      setIsGeneratingVocab(false)
      vocabAbortControllerRef.current = null
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

    const controller = new AbortController()
    questionAbortControllerRef.current = controller
    setIsGeneratingQuestion(true)
    setErrorMessage(null)
    setStatusMessage(null)
    try {
      const qty = Math.max(1, Math.min(50, Number(questionQuantity) || 10))
      const res = await adminAiService.generateQuestions(
        {
          topicId: selectedTopicId,
          lessonId: selectedLessonId || undefined,
          vocabularyId: selectedVocabId || undefined,
          vocabularyIds: selectedTargetVocabIds.length > 0 ? selectedTargetVocabIds : undefined,
          questionTypes,
          quantity: qty,
          difficulty: questionDifficulty,
        },
        { signal: controller.signal }
      )
      setNewlyGeneratedQuestions(res.questions)
      setViewFilter('NEWLY_GENERATED')
      setSelectedQuestionIds([])
      setStatusMessage(`AI đã tạo đúng ${res.count} câu hỏi mới và lưu vào danh sách nháp!`)
      await loadDraftsForTopic(selectedTopicId)
    } catch (err: any) {
      console.error('handleGenerateQuestion error:', err)
      if (err?.name === 'CanceledError' || err?.name === 'AbortError' || err?.code === 'ERR_CANCELED' || err?.message?.includes('canceled')) {
        setStatusMessage('Đã hủy lệnh AI tạo câu hỏi!')
      } else {
        setErrorMessage(getAdminContentError(err, 'Lỗi khi AI sinh câu hỏi'))
      }
    } finally {
      setIsGeneratingQuestion(false)
      questionAbortControllerRef.current = null
    }
  }

  // --- Handlers: Multi-Select Checkboxes ---
  const activeVocabsToShow = viewFilter === 'NEWLY_GENERATED' ? newlyGeneratedVocabs : draftVocabs
  const activeQuestionsToShow = viewFilter === 'NEWLY_GENERATED' ? newlyGeneratedQuestions : draftQuestions

  function toggleSelectAllVocabs() {
    if (selectedVocabIds.length === activeVocabsToShow.length) {
      setSelectedVocabIds([])
    } else {
      setSelectedVocabIds(activeVocabsToShow.map((v) => v.id))
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
      setStatusMessage('Đã duyệt & phát hành từ vựng sang PUBLISHED vào bài học!')
      setNewlyGeneratedVocabs((prev) => prev.filter((v) => v.id !== vocabId))
      setSelectedVocabIds((prev) => prev.filter((i) => i !== vocabId))
      void loadDraftsForTopic(selectedTopicId)
    } catch (err) {
      setErrorMessage('Lỗi duyệt từ vựng')
    }
  }

  async function handleDeleteVocab(vocabId: string) {
    if (!window.confirm('Bạn có chắc muốn xóa từ vựng này?')) return
    try {
      await adminVocabularyService.deleteVocabulary(vocabId)
      setStatusMessage('Đã xóa từ vựng khỏi hệ thống.')
      setNewlyGeneratedVocabs((prev) => prev.filter((v) => v.id !== vocabId))
      setSelectedVocabIds((prev) => prev.filter((i) => i !== vocabId))
      void loadDraftsForTopic(selectedTopicId)
    } catch (err) {
      setErrorMessage('Lỗi xóa từ vựng')
    }
  }

  async function handleBulkPublishVocabs() {
    const idsToPublish = selectedVocabIds.length > 0 ? selectedVocabIds : activeVocabsToShow.map((v) => v.id)
    if (idsToPublish.length === 0) return
    try {
      await adminAiService.bulkPublishVocabularies(idsToPublish)
      setStatusMessage(`Đã duyệt & phát hành thành công ${idsToPublish.length} từ vựng vào bài học!`)
      setNewlyGeneratedVocabs((prev) => prev.filter((v) => !idsToPublish.includes(v.id)))
      setSelectedVocabIds([])
      void loadDraftsForTopic(selectedTopicId)
    } catch (err) {
      setErrorMessage('Lỗi duyệt hàng loạt từ vựng')
    }
  }

  async function handleBulkDeleteVocabs() {
    if (selectedVocabIds.length === 0) return
    if (!window.confirm(`Bạn có chắc muốn XÓA ${selectedVocabIds.length} từ vựng đã chọn?`)) return
    try {
      await adminAiService.bulkDeleteVocabularies(selectedVocabIds)
      setStatusMessage(`Đã xóa thành công ${selectedVocabIds.length} từ vựng đã chọn!`)
      setNewlyGeneratedVocabs((prev) => prev.filter((v) => !selectedVocabIds.includes(v.id)))
      setSelectedVocabIds([])
      void loadDraftsForTopic(selectedTopicId)
    } catch (err) {
      setErrorMessage('Lỗi xóa hàng loạt từ vựng')
    }
  }

  async function openEditVocab(v: any) {
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

  // --- Handlers: Question Actions (Single & Bulk) ---
  async function handlePublishQuestion(qId: string) {
    try {
      await adminQuestionService.updateQuestionStatus(qId, 'PUBLISHED')
      if (selectedLessonId) {
        await adminQuestionService.assignQuestionsToLesson(selectedLessonId, [qId]).catch(() => {})
      }
      setStatusMessage('Đã duyệt & phát hành câu hỏi sang PUBLISHED và gán vào bài học!')
      setNewlyGeneratedQuestions((prev) => prev.filter((q) => q.id !== qId))
      setSelectedQuestionIds((prev) => prev.filter((i) => i !== qId))
      void loadDraftsForTopic(selectedTopicId)
    } catch (err) {
      setErrorMessage('Lỗi duyệt câu hỏi')
    }
  }

  async function handleDeleteQuestion(qId: string) {
    if (!window.confirm('Bạn có chắc muốn xóa câu hỏi này?')) return
    try {
      await adminQuestionService.deleteQuestion(qId)
      setStatusMessage('Đã xóa câu hỏi khỏi hệ thống.')
      setNewlyGeneratedQuestions((prev) => prev.filter((q) => q.id !== qId && q._id !== qId))
      setDraftQuestions((prev) => prev.filter((q) => q.id !== qId && q._id !== qId))
      setSelectedQuestionIds((prev) => prev.filter((i) => i !== qId))
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Lỗi xóa câu hỏi')
    }
  }

  async function handleBulkPublishQuestions() {
    const idsToPublish = selectedQuestionIds.length > 0 ? selectedQuestionIds : activeQuestionsToShow.map((q) => q.id)
    if (idsToPublish.length === 0) return
    try {
      await adminAiService.bulkPublishQuestions(idsToPublish)
      if (selectedLessonId) {
        await adminQuestionService.assignQuestionsToLesson(selectedLessonId, idsToPublish).catch(() => {})
      }
      setStatusMessage(`Đã duyệt & phát hành thành công ${idsToPublish.length} câu hỏi vào bài học!`)
      setNewlyGeneratedQuestions((prev) => prev.filter((q) => !idsToPublish.includes(q.id)))
      setSelectedQuestionIds([])
      void loadDraftsForTopic(selectedTopicId)
    } catch (err) {
      setErrorMessage('Lỗi duyệt hàng loạt câu hỏi')
    }
  }

  async function handleBulkDeleteQuestions() {
    if (selectedQuestionIds.length === 0) return
    if (!window.confirm(`Bạn có chắc muốn XÓA ${selectedQuestionIds.length} câu hỏi đã chọn?`)) return
    try {
      await adminAiService.bulkDeleteQuestions(selectedQuestionIds)
      setStatusMessage(`Đã xóa thành công ${selectedQuestionIds.length} câu hỏi đã chọn!`)
      setNewlyGeneratedQuestions((prev) => prev.filter((q) => !selectedQuestionIds.includes(q.id)))
      setSelectedQuestionIds([])
      void loadDraftsForTopic(selectedTopicId)
    } catch (err) {
      setErrorMessage('Lỗi xóa hàng loạt câu hỏi')
    }
  }

  async function openEditQuestion(q: any) {
    setQuestionFormServerError(null)
    setQuestionFormServerMediaErrors({})
    try {
      const fullQuestion = await adminQuestionService.getQuestionById(q.id)
      setSelectedQuestionForModal(fullQuestion)
    } catch {
      setSelectedQuestionForModal(q)
    }
    setIsQuestionFormOpen(true)
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
        description="Chọn tuần tự 4 bước: 1. Khóa học -> 2. Phần học (Section) -> 3. Chủ đề (Topic) -> 4. Bài học (Lesson)."
      />

      {/* AI Disclaimer Alert */}
      <div className="flex items-center gap-2.5 rounded-2xl border border-amber-200/90 bg-amber-50/70 px-4 py-3 text-xs font-semibold text-amber-800 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
        <span className="text-base">⚠️</span>
        <span>
          <strong>Lưu ý:</strong> Nội dung do AI cung cấp có thể không chính xác. Vui lòng kiểm tra và chỉnh sửa kỹ trước khi duyệt (Approve) phát hành vào bài học.
        </span>
      </div>

      {/* Main Tabs */}
      <div className="flex items-center gap-3 border-b border-gray-200 pb-3 dark:border-gray-800">
        <button
          type="button"
          onClick={() => {
            setActiveTab('VOCAB')
            setViewFilter('NEWLY_GENERATED')
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
              Chọn Đủ 4 Bước Tuần Tự (Course ➔ Section ➔ Topic ➔ Lesson)
            </h2>

            {/* 4-Step Cascade Select: Course -> Section -> Topic -> Lesson */}
            <div className="grid gap-4 sm:grid-cols-4">
              <div>
                <label className="block text-xs font-black uppercase text-gray-700 dark:text-gray-300 mb-1">
                  1. Khóa học (Bắt buộc)
                </label>
                <select
                  value={selectedCourseId}
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
                  disabled={!selectedCourseId || isLoadingSections}
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
                  disabled={!selectedSectionId || isLoadingTopics}
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

              <div>
                <label className="block text-xs font-black uppercase text-gray-700 dark:text-gray-300 mb-1">
                  4. Bài học ({selectedTopicId ? 'Tùy chọn' : 'Vui lòng chọn 3 trước'})
                </label>
                <select
                  disabled={!selectedTopicId || isLoadingLessons}
                  value={selectedLessonId}
                  onChange={(e) => setSelectedLessonId(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-xs font-bold text-gray-800 outline-none focus:border-emerald-500 disabled:bg-gray-100 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  <option value="">
                    {isLoadingLessons ? 'Đang tải bài học...' : selectedTopicId ? '(Gán theo Topic chung)' : '-- Chọn Chủ đề trước --'}
                  </option>
                  {lessons.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Level & Quantity */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-black uppercase text-gray-700 dark:text-gray-300 mb-1">
                  Trình độ (Level)
                </label>
                <select
                  value={vocabLevel}
                  onChange={(e: any) => setVocabLevel(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-xs font-bold text-gray-800 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  <option value="A1">Level A1 (Dễ)</option>
                  <option value="A2">Level A2 (Cơ bản)</option>
                  <option value="B1">Level B1 (Trung bình)</option>
                  <option value="B2">Level B2 (Khá)</option>
                  <option value="C1">Level C1 (Nâng cao)</option>
                  <option value="C2">Level C2 (Thành thạo)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-gray-700 dark:text-gray-300 mb-1">
                  Số lượng từ (Quantity)
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={vocabQuantity}
                  onChange={(e) => setVocabQuantity(Math.max(1, Math.min(50, Number(e.target.value))))}
                  className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-xs font-bold text-gray-800 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
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
                disabled={isGeneratingVocab}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-black uppercase text-white shadow-md hover:bg-emerald-700 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isGeneratingVocab ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>AI Đang Tạo Từ Vựng...</span>
                  </>
                ) : (
                  <>
                    <span>AI Tạo Đúng {vocabQuantity} Từ Vựng Mới</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Draft Vocabs List with Multi-Select Controls */}
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Filter Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setViewFilter('NEWLY_GENERATED')
                    setSelectedVocabIds([])
                  }}
                  className={`rounded-xl px-4 py-2 text-xs font-black transition-all ${
                    viewFilter === 'NEWLY_GENERATED'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                  }`}
                >
                  Vừa Sinh Ra ({newlyGeneratedVocabs.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewFilter('ALL_DRAFTS')
                    setSelectedVocabIds([])
                  }}
                  className={`rounded-xl px-4 py-2 text-xs font-black transition-all ${
                    viewFilter === 'ALL_DRAFTS'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                  }`}
                >
                  Tất Cả Bản Nháp ({draftVocabs.length})
                </button>
              </div>

              {/* Multi-Select Action Controls */}
              {activeVocabsToShow.length > 0 && (
                <div className="flex items-center gap-2">
                  <label className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={activeVocabsToShow.length > 0 && selectedVocabIds.length === activeVocabsToShow.length}
                      onChange={toggleSelectAllVocabs}
                      className="accent-emerald-600 h-4 w-4"
                    />
                    <span>Chọn tất cả ({selectedVocabIds.length}/{activeVocabsToShow.length})</span>
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
                    Duyệt {selectedVocabIds.length > 0 ? `đã chọn (${selectedVocabIds.length})` : `tất cả (${activeVocabsToShow.length})`}
                  </button>
                </div>
              )}
            </div>

            {isLoadingDrafts ? (
              <div className="py-8 text-center">
                <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              </div>
            ) : activeVocabsToShow.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center text-xs font-bold text-gray-500 dark:border-gray-800">
                {viewFilter === 'NEWLY_GENERATED'
                  ? 'Chưa có từ vựng nào vừa sinh ra. Hãy chọn Khóa học ➔ Phần học ➔ Chủ đề và bấm "AI Tạo Từ Vựng Mới".'
                  : 'Chưa có từ vựng nháp nào trong bài này.'}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {activeVocabsToShow.map((v) => {
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
                        {/* 4-Step Location Breadcrumb Tag */}
                        <div className="mb-2 flex flex-wrap items-center gap-1 text-[10px] font-bold text-gray-500 bg-amber-100/80 dark:bg-gray-800 px-2.5 py-1 rounded-xl">
                          <span className="text-emerald-700 dark:text-emerald-400">📚 {courses.find((c) => c.id === selectedCourseId)?.name || 'Khóa học'}</span>
                          <span>➔</span>
                          <span className="text-purple-700 dark:text-purple-400">📑 {sections.find((s) => s.id === selectedSectionId)?.name || 'Phần học'}</span>
                          <span>➔</span>
                          <span className="text-amber-700 dark:text-amber-400">📂 {topics.find((t) => t.id === selectedTopicId)?.name || 'Chủ đề'}</span>
                          {selectedLessonId && (
                            <>
                              <span>➔</span>
                              <span className="text-cyan-700 dark:text-cyan-400">📖 {lessons.find((l) => l.id === selectedLessonId)?.name || 'Bài học'}</span>
                            </>
                          )}
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
                          <span className="rounded-lg bg-amber-200 px-2 py-0.5 text-[10px] font-black uppercase text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            DRAFT
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
                          Approve
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
              Chọn Đủ 4 Bước Tuần Tự (Course ➔ Section ➔ Topic ➔ Lesson)
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
                <label className="block text-xs font-black uppercase text-cyan-700 dark:text-cyan-400 mb-1">
                  📖 Bài học thuộc Chủ đề (Tùy chọn gán câu hỏi)
                </label>
                <select
                  disabled={!selectedTopicId || isLoadingLessons}
                  value={selectedLessonId}
                  onChange={(e) => setSelectedLessonId(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-xs font-bold text-gray-800 outline-none focus:border-cyan-500 disabled:bg-gray-100 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  <option value="">
                    {isLoadingLessons ? 'Đang tải bài học...' : selectedTopicId ? '(Tất cả các bài học trong chủ đề)' : '-- Chọn Chủ đề trước --'}
                  </option>
                  {lessons.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
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
                        const allIds = vocabularies.map((v) => v.id || v._id)
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
                      const vId = v.id || v._id
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
                  {[
                    { id: 'MULTIPLE_CHOICE', label: 'Trắc nghiệm' },
                    { id: 'FILL_IN_BLANK', label: 'Điền từ' },
                    { id: 'TRANSLATION', label: 'Dịch câu' },
                    { id: 'MATCHING', label: 'Nối từ' },
                    { id: 'REORDER', label: 'Sắp xếp' },
                  ].map((t) => (
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
                    onChange={(e: any) => setQuestionDifficulty(e.target.value)}
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
                disabled={isGeneratingQuestion}
                className="flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-2.5 text-xs font-black uppercase text-white shadow-md hover:bg-cyan-700 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isGeneratingQuestion ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>AI Đang Tạo Câu Hỏi...</span>
                  </>
                ) : (
                  <>
                    <span>AI Tạo Đúng {questionQuantity} Câu Hỏi Mới</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Draft Questions List with Multi-Select Controls */}
          <div className="space-y-4">
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
                  Vừa Sinh Ra ({newlyGeneratedQuestions.length})
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
                <div className="flex items-center gap-2">
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
                    Duyệt {selectedQuestionIds.length > 0 ? `đã chọn (${selectedQuestionIds.length})` : `tất cả (${activeQuestionsToShow.length})`}
                  </button>
                </div>
              )}
            </div>

            {isLoadingDrafts ? (
              <div className="py-8 text-center">
                <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
              </div>
            ) : activeQuestionsToShow.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center text-xs font-bold text-gray-500 dark:border-gray-800">
                {viewFilter === 'NEWLY_GENERATED'
                  ? 'Chưa có câu hỏi nào vừa sinh ra. Hãy chọn Khóa học ➔ Phần học ➔ Chủ đề và bấm "AI Tạo Câu Hỏi Mới".'
                  : 'Chưa có câu hỏi nháp nào trong bài này.'}
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
                          {/* 4-Step Location Breadcrumb Tag */}
                          <div className="mb-1.5 inline-flex flex-wrap items-center gap-1 text-[10px] font-bold text-gray-500 bg-cyan-100/80 dark:bg-gray-800 px-2.5 py-0.5 rounded-xl">
                            <span className="text-emerald-700 dark:text-emerald-400">📚 {courses.find((c) => c.id === selectedCourseId)?.name || 'Khóa học'}</span>
                            <span>➔</span>
                            <span className="text-purple-700 dark:text-purple-400">📑 {sections.find((s) => s.id === selectedSectionId)?.name || 'Phần học'}</span>
                            <span>➔</span>
                            <span className="text-amber-700 dark:text-amber-400">📂 {topics.find((t) => t.id === selectedTopicId)?.name || 'Chủ đề'}</span>
                            {selectedLessonId && (
                              <>
                                <span>➔</span>
                                <span className="text-cyan-700 dark:text-cyan-400">📖 {lessons.find((l) => l.id === selectedLessonId)?.name || 'Bài học'}</span>
                              </>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="rounded bg-cyan-100 px-2 py-0.5 text-[10px] font-black uppercase text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
                              {q.type}
                            </span>
                            <span className="rounded bg-purple-100 px-2 py-0.5 text-[10px] font-black uppercase text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                              AI GENERATED
                            </span>
                            <span className="text-[10px] font-bold text-gray-400">Độ khó: {q.difficulty}</span>
                          </div>
                          <h4 className="text-sm font-black text-gray-900 dark:text-white">{q.content}</h4>
                          {q.explanation && (
                            <p className="text-xs text-gray-500">💡 {q.explanation}</p>
                          )}
                        </div>
                      </div>

                      {/* 4 Action Buttons */}
                      <div className="flex items-center justify-end gap-1.5 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => setViewItem(q)}
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
                          Approve
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
                Preview Chi Tiết ({viewItem.word || viewItem.type})
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
              {viewItem.word ? (
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
                        {viewItem.options.map((opt: any, idx: number) => (
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
                      {viewItem.options.map((opt: any, idx: number) => (
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
                      {viewItem.matchingPairs.map((p: any, idx: number) => (
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
