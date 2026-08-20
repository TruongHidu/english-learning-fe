interface ExitLessonModalProps {
  isOpen: boolean
  onContinue: () => void
  onExit: () => void
}

export default function ExitLessonModal({
  isOpen,
  onContinue,
  onExit,
}: ExitLessonModalProps) {
  if (!isOpen) return null

  return (
    <div className="lesson-exit-backdrop" role="presentation">
      <section
        className="lesson-exit-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-lesson-title"
        aria-describedby="exit-lesson-description"
      >
        <div className="lesson-exit-illustration" aria-hidden="true">
          🦉
        </div>
        <h2 id="exit-lesson-title">Đợi chút, đừng đi!</h2>
        <p id="exit-lesson-description">
          Bạn sẽ mất hết tiến trình của bài học này nếu thoát bây giờ
        </p>
        <div className="lesson-exit-actions">
          <button
            type="button"
            className="lesson-exit-continue"
            onClick={onContinue}
          >
            Tiếp tục học
          </button>
          <button type="button" className="lesson-exit-leave" onClick={onExit}>
            Thoát
          </button>
        </div>
      </section>
    </div>
  )
}
