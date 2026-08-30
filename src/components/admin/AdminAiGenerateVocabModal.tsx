import { useState, useEffect } from 'react'
import { adminAiService } from '../../services/admin-ai.service'
import { adminTopicService } from '../../services/admin-topic.service'

interface TopicOption {
  id: string
  name: string
}

interface AdminAiGenerateVocabModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function AdminAiGenerateVocabModal({
  isOpen,
  onClose,
  onSuccess,
}: AdminAiGenerateVocabModalProps) {
  const [topics, setTopics] = useState<TopicOption[]>([])
  const [selectedTopicId, setSelectedTopicId] = useState('')
  const [level, setLevel] = useState<'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'>('A1')
  const [quantity, setQuantity] = useState(20)

  const [isLoadingTopics, setIsLoadingTopics] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  const [generatedVocabs, setGeneratedVocabs] = useState<any[]>([])
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      void fetchTopics()
      setGeneratedVocabs([])
      setStatusMessage(null)
      setErrorMessage(null)
    }
  }, [isOpen])

  async function fetchTopics() {
    setIsLoadingTopics(true)
    try {
      const data = await adminTopicService.getAllTopics()
      setTopics(data.map((t: any) => ({ id: t.id, name: t.name })))
      if (data.length > 0) {
        setSelectedTopicId(data[0].id)
      }
    } catch (err: any) {
      console.error('Failed to load topics', err)
    } finally {
      setIsLoadingTopics(false)
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedTopicId) {
      setErrorMessage('Vui lòng chọn một Chủ đề')
      return
    }

    setIsGenerating(true)
    setErrorMessage(null)
    setStatusMessage(null)
    try {
      const res = await adminAiService.generateVocabularies({
        topicId: selectedTopicId,
        level,
        quantity: Number(quantity),
      })
      setGeneratedVocabs(res.vocabularies)
      setStatusMessage(`✨ AI đã tạo thành công ${res.count} từ vựng nháp (DRAFT)!`)
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Có lỗi xảy ra khi gọi AI sinh từ vựng')
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleBulkPublish() {
    if (generatedVocabs.length === 0) return
    setIsPublishing(true)
    try {
      const ids = generatedVocabs.map((v) => v.id)
      await adminAiService.bulkPublishVocabularies(ids)
      setStatusMessage('🚀 Đã duyệt & phát hành thành công tất cả từ vựng sang trạng thái PUBLISHED!')
      setGeneratedVocabs((prev) => prev.map((v) => ({ ...v, status: 'PUBLISHED' })))
      if (onSuccess) onSuccess()
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Lỗi duyệt từ vựng')
    } finally {
      setIsPublishing(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-900 border-2 border-emerald-500/30">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-emerald-600 p-5 text-white dark:border-gray-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✨</span>
            <div>
              <h3 className="text-lg font-black">AI Tạo Từ Vựng Tự Động</h3>
              <p className="text-xs font-bold text-emerald-100">
                Nhập Topic, Trình độ và Số lượng để AI khởi tạo tự động
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-lg font-black text-white hover:bg-white/30"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
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

          {/* Form */}
          <form onSubmit={handleGenerate} className="grid gap-4 sm:grid-cols-3 bg-gray-50 p-5 rounded-2xl dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
            {/* Topic Select */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-black uppercase text-gray-700 dark:text-gray-300 mb-1">
                Chủ đề (Topic)
              </label>
              {isLoadingTopics ? (
                <div className="h-10 w-full animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
              ) : (
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
              )}
            </div>

            {/* Level Select */}
            <div>
              <label className="block text-xs font-black uppercase text-gray-700 dark:text-gray-300 mb-1">
                Trình độ (Level)
              </label>
              <select
                value={level}
                onChange={(e: any) => setLevel(e.target.value)}
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

            {/* Submit Button */}
            <div className="sm:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={isGenerating || isLoadingTopics}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-black uppercase text-white shadow-md hover:bg-emerald-700 disabled:opacity-50 transition-all"
              >
                {isGenerating ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>AI Đang Tạo Từ Vựng...</span>
                  </>
                ) : (
                  <>
                    <span>✨ AI Tạo Từ Vựng</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Generated Results Preview */}
          {generatedVocabs.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-gray-900 dark:text-white">
                  Danh Sách Từ Vựng Vừa Tạo ({generatedVocabs.length})
                </h4>
                <button
                  type="button"
                  onClick={handleBulkPublish}
                  disabled={isPublishing}
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-black uppercase text-white shadow-sm hover:bg-emerald-600 disabled:opacity-50"
                >
                  {isPublishing ? 'Đang duyệt...' : '🚀 Duyệt & Phát Hành Tất Cả'}
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 rounded-2xl border border-gray-200 p-3 dark:border-gray-800 bg-white dark:bg-gray-900">
                {generatedVocabs.map((v, idx) => (
                  <div
                    key={v.id || idx}
                    className="flex items-center justify-between rounded-xl bg-gray-50 p-3 text-xs dark:bg-gray-800"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-emerald-600 dark:text-emerald-400">{v.word}</span>
                        {v.phonetic && <span className="text-[11px] text-gray-400">{v.phonetic}</span>}
                        {v.partOfSpeech && (
                          <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] uppercase font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                            {v.partOfSpeech}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 font-bold text-gray-700 dark:text-gray-300">{v.meaning}</p>
                      {v.example && <p className="mt-0.5 italic text-gray-500 text-[11px]">&quot;{v.example}&quot;</p>}
                    </div>

                    <span
                      className={`rounded-lg px-2.5 py-1 text-[10px] font-black uppercase ${
                        v.status === 'PUBLISHED'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {v.status === 'PUBLISHED' ? '🟢 PUBLISHED' : '📝 DRAFT'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 bg-gray-50 p-4 text-right dark:border-gray-800 dark:bg-gray-800/50">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-gray-200 px-5 py-2 text-xs font-black uppercase text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
