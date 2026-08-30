import { useState, useEffect } from 'react'
import { adminAiService } from '../../services/admin-ai.service'
import { adminTopicService } from '../../services/admin-topic.service'
import { adminQuestionService } from '../../services/admin-question.service'

interface TopicOption {
  id: string
  name: string
}

export default function AdminAiQuestionWorkflowPage() {
  const [topics, setTopics] = useState<TopicOption[]>([])
  const [selectedTopicId, setSelectedTopicId] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    'MULTIPLE_CHOICE',
    'FILL_IN_BLANK',
    'MATCHING',
    'REORDER',
  ])
  const [quantity, setQuantity] = useState(8)
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('EASY')

  const [activeTab, setActiveTab] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT')
  const [questions, setQuestions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // View & Edit Modals State
  const [viewQuestion, setViewQuestion] = useState<any | null>(null)
  const [editQuestion, setEditQuestion] = useState<any | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editExplanation, setEditExplanation] = useState('')

  useEffect(() => {
    void fetchTopics()
  }, [])

  useEffect(() => {
    if (selectedTopicId) {
      void fetchQuestions()
    }
  }, [selectedTopicId, activeTab])

  async function fetchTopics() {
    try {
      const data = await adminTopicService.getAllTopics()
      const list = data.map((t: any) => ({ id: t.id, name: t.name }))
      setTopics(list)
      if (list.length > 0) {
        setSelectedTopicId(list[0].id)
      }
    } catch (err) {
      console.error('Failed to load topics', err)
    }
  }

  async function fetchQuestions() {
    if (!selectedTopicId) return
    setIsLoading(true)
    try {
      const data = await adminQuestionService.getQuestionsByTopic(selectedTopicId, {
        status: activeTab,
      })
      setQuestions(data.questions)
    } catch (err) {
      console.error('Failed to load questions', err)
    } finally {
      setIsLoading(false)
    }
  }

  function handleTypeToggle(type: string) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    )
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedTopicId) {
      setErrorMessage('Vui lòng chọn một Chủ đề')
      return
    }
    if (selectedTypes.length === 0) {
      setErrorMessage('Phải chọn ít nhất 1 loại câu hỏi')
      return
    }

    setIsGenerating(true)
    setErrorMessage(null)
    setStatusMessage(null)

    try {
      const res = await adminAiService.generateQuestions({
        topicId: selectedTopicId,
        questionTypes: selectedTypes,
        quantity: Number(quantity),
        difficulty,
      })
      setStatusMessage(`✨ AI đã tạo thành công ${res.count} câu hỏi nháp DRAFT!`)
      if (activeTab === 'DRAFT') {
        void fetchQuestions()
      } else {
        setActiveTab('DRAFT')
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Có lỗi khi AI sinh câu hỏi')
    } finally {
      setIsGenerating(false)
    }
  }

  async function handlePublish(questionId: string) {
    try {
      await adminQuestionService.updateQuestionStatus(questionId, 'PUBLISHED')
      setStatusMessage('🚀 Đã duyệt & phát hành câu hỏi sang trạng thái PUBLISHED!')
      void fetchQuestions()
    } catch (err: any) {
      setErrorMessage('Lỗi duyệt câu hỏi')
    }
  }

  async function handleDelete(questionId: string) {
    if (!window.confirm('Bạn có chắc muốn xóa câu hỏi này?')) return
    try {
      await adminQuestionService.deleteQuestion(questionId)
      setStatusMessage('🗑️ Đã xóa câu hỏi khỏi hệ thống.')
      void fetchQuestions()
    } catch (err: any) {
      setErrorMessage('Lỗi xóa câu hỏi')
    }
  }

  async function handleBulkPublish() {
    const draftIds = questions.map((q) => q.id)
    if (draftIds.length === 0) return
    try {
      await adminAiService.bulkPublishQuestions(draftIds)
      setStatusMessage(`🚀 Đã duyệt & phát hành ${draftIds.length} câu hỏi!`)
      void fetchQuestions()
    } catch (err: any) {
      setErrorMessage('Lỗi duyệt hàng loạt')
    }
  }

  function openEditModal(q: any) {
    setEditQuestion(q)
    setEditContent(q.content || '')
    setEditExplanation(q.explanation || '')
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editQuestion) return
    try {
      await adminQuestionService.updateQuestion(editQuestion.id, {
        content: editContent,
        explanation: editExplanation,
      })
      setStatusMessage('✏️ Đã cập nhật nội dung câu hỏi!')
      setEditQuestion(null)
      void fetchQuestions()
    } catch (err: any) {
      setErrorMessage('Lỗi cập nhật câu hỏi')
    }
  }

  return (
    <main className="w-full max-w-5xl px-4 py-6 md:px-8 space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 text-white shadow-lg md:p-8">
        <div className="flex items-center gap-3">
          <span className="text-3xl">✨</span>
          <div>
            <h1 className="text-2xl font-black md:text-3xl">AI Tạo Câu Hỏi & Workflow Duyệt</h1>
            <p className="mt-1 text-xs font-bold text-emerald-100">
              AI tự động khởi tạo câu hỏi DRAFT $\rightarrow$ Admin Review 4 thao tác: Xem - Sửa - Approve/Publish - Xóa
            </p>
          </div>
        </div>
      </div>

      {/* Generator Form */}
      <div className="rounded-3xl border-2 border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-base font-black text-gray-900 dark:text-white mb-4">
          ✨ Trình Khởi Tạo Câu Hỏi AI
        </h2>

        {errorMessage && (
          <div className="mb-4 rounded-2xl border-2 border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">
            ⚠️ {errorMessage}
          </div>
        )}

        {statusMessage && (
          <div className="mb-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800">
            {statusMessage}
          </div>
        )}

        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Topic Select */}
            <div>
              <label className="block text-xs font-black uppercase text-gray-700 dark:text-gray-300 mb-1">
                Chủ đề (Topic)
              </label>
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-xs font-bold text-gray-800 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity Input */}
            <div>
              <label className="block text-xs font-black uppercase text-gray-700 dark:text-gray-300 mb-1">
                Số lượng (Quantity)
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(50, Number(e.target.value))))}
                className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-xs font-bold text-gray-800 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>

            {/* Difficulty Select */}
            <div>
              <label className="block text-xs font-black uppercase text-gray-700 dark:text-gray-300 mb-1">
                Độ khó (Difficulty)
              </label>
              <select
                value={difficulty}
                onChange={(e: any) => setDifficulty(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-xs font-bold text-gray-800 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="EASY">Dễ (EASY)</option>
                <option value="MEDIUM">Vừa (MEDIUM)</option>
                <option value="HARD">Khó (HARD)</option>
              </select>
            </div>
          </div>

          {/* Question Types Checkboxes */}
          <div>
            <label className="block text-xs font-black uppercase text-gray-700 dark:text-gray-300 mb-2">
              Các loại câu hỏi cần sinh:
            </label>
            <div className="flex flex-wrap items-center gap-3">
              {[
                { id: 'MULTIPLE_CHOICE', label: 'Trắc nghiệm (MULTIPLE_CHOICE)' },
                { id: 'FILL_IN_BLANK', label: 'Điền từ (FILL_IN_BLANK)' },
                { id: 'MATCHING', label: 'Nối từ (MATCHING)' },
                { id: 'REORDER', label: 'Sắp xếp câu (REORDER)' },
              ].map((t) => (
                <label
                  key={t.id}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                    selectedTypes.includes(t.id)
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(t.id)}
                    onChange={() => handleTypeToggle(t.id)}
                    className="accent-emerald-500"
                  />
                  <span>{t.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isGenerating}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-black uppercase text-white shadow-md hover:bg-emerald-700 disabled:opacity-50 transition-all"
            >
              {isGenerating ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>AI Đang Khởi Tạo Câu Hỏi...</span>
                </>
              ) : (
                <>
                  <span>✨ AI Tạo Câu Hỏi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Workflow Tabs & Review List */}
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-3 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('DRAFT')}
              className={`rounded-2xl px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === 'DRAFT'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              📝 Bản Nháp AI (DRAFT)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('PUBLISHED')}
              className={`rounded-2xl px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === 'PUBLISHED'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              🚀 Đã Duyệt (PUBLISHED)
            </button>
          </div>

          {activeTab === 'DRAFT' && questions.length > 0 && (
            <button
              type="button"
              onClick={handleBulkPublish}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black uppercase text-white shadow-sm hover:bg-emerald-700"
            >
              🚀 Duyệt Tất Cả ({questions.length})
            </button>
          )}
        </div>

        {/* List Content */}
        {isLoading ? (
          <div className="py-12 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            <p className="mt-3 text-xs font-bold text-gray-500">Đang tải danh sách câu hỏi...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-2 text-4xl">📋</div>
            <p className="text-sm font-bold text-gray-500">
              Chưa có câu hỏi nào trong danh sách {activeTab}.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q) => (
              <div
                key={q.id}
                className="rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 transition-all hover:border-emerald-300"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {q.type}
                      </span>
                      {q.createdByAi && (
                        <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-black uppercase text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                          ✨ AI GENERATED
                        </span>
                      )}
                      <span className="text-[10px] font-bold text-gray-400">Độ khó: {q.difficulty}</span>
                    </div>
                    <h3 className="text-base font-black text-gray-900 dark:text-white">
                      {q.content}
                    </h3>
                    {q.explanation && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        💡 Giải thích: {q.explanation}
                      </p>
                    )}
                  </div>

                  {/* 4 Review Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                    {/* 👁️ View */}
                    <button
                      type="button"
                      onClick={() => setViewQuestion(q)}
                      className="rounded-xl border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                      title="Xem trước câu hỏi"
                    >
                      👁️ Xem
                    </button>

                    {/* ✏️ Edit */}
                    <button
                      type="button"
                      onClick={() => openEditModal(q)}
                      className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                      title="Sửa nội dung câu hỏi"
                    >
                      ✏️ Sửa
                    </button>

                    {/* ✅ Approve & Publish */}
                    {q.status === 'DRAFT' && (
                      <button
                        type="button"
                        onClick={() => handlePublish(q.id)}
                        className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-black uppercase text-white shadow-sm hover:bg-emerald-700"
                        title="Duyệt & Phát hành"
                      >
                        ✅ Approve
                      </button>
                    )}

                    {/* 🗑️ Delete */}
                    <button
                      type="button"
                      onClick={() => handleDelete(q.id)}
                      className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300"
                      title="Xóa câu hỏi"
                    >
                      🗑️ Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Preview Modal */}
      {viewQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-900 border-2 border-emerald-500/30">
            <div className="flex items-center justify-between border-b pb-3 dark:border-gray-800">
              <h3 className="text-base font-black text-gray-900 dark:text-white">
                👁️ Preview Câu Hỏi ({viewQuestion.type})
              </h3>
              <button
                type="button"
                onClick={() => setViewQuestion(null)}
                className="text-lg font-black text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="py-4 space-y-3">
              <p className="text-sm font-black text-gray-800 dark:text-white">{viewQuestion.content}</p>
              {viewQuestion.options && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-500">Các lựa chọn:</p>
                  {viewQuestion.options.map((opt: any, idx: number) => (
                    <div
                      key={idx}
                      className={`rounded-xl p-2.5 text-xs font-bold border ${
                        opt.isCorrect
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-300'
                      }`}
                    >
                      {opt.content} {opt.isCorrect && '✅ (Đáp án đúng)'}
                    </div>
                  ))}
                </div>
              )}
              {viewQuestion.correctAnswer && (
                <div className="rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Đáp án đúng: {JSON.stringify(viewQuestion.correctAnswer)}
                </div>
              )}
              {viewQuestion.explanation && (
                <p className="text-xs italic text-gray-500">💡 Giải thích: {viewQuestion.explanation}</p>
              )}
            </div>
            <div className="text-right border-t pt-3 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setViewQuestion(null)}
                className="rounded-xl bg-gray-200 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-900 border-2 border-amber-500/30 space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3 dark:border-gray-800">
              <h3 className="text-base font-black text-gray-900 dark:text-white">
                ✏️ Chỉnh Sửa Câu Hỏi AI
              </h3>
              <button
                type="button"
                onClick={() => setEditQuestion(null)}
                className="text-lg font-black text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-gray-700 dark:text-gray-300 mb-1">
                Nội dung câu hỏi
              </label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-xs font-bold text-gray-800 outline-none focus:border-amber-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-gray-700 dark:text-gray-300 mb-1">
                Giải thích đáp án
              </label>
              <textarea
                value={editExplanation}
                onChange={(e) => setEditExplanation(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-xs font-bold text-gray-800 outline-none focus:border-amber-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 border-t pt-3 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setEditQuestion(null)}
                className="rounded-xl bg-gray-200 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="rounded-xl bg-amber-500 px-5 py-2 text-xs font-black uppercase text-white hover:bg-amber-600"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  )
}
