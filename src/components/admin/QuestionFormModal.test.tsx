import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import QuestionFormModal from './QuestionFormModal'

function renderForm() {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  render(<QuestionFormModal isOpen isLoading={false} onSubmit={onSubmit} onClose={vi.fn()} />)
  fireEvent.change(screen.getAllByRole('combobox')[0]!, { target: { value: 'TRANSLATION' } })
  // The form's content textarea precedes the optional alternatives textarea.
  fireEvent.change(screen.getAllByRole('textbox')[0]!, { target: { value: 'Hello' } })
  fireEvent.change(screen.getByPlaceholderText('Nhập đáp án đúng...'), { target: { value: 'Xin chào' } })
  return onSubmit
}

it('submits trimmed, deduplicated admin alternatives and omits them after changing type', async () => {
  const submit = renderForm()
  fireEvent.change(screen.getByPlaceholderText(/Mỗi dòng một bản dịch/), { target: { value: ' Chào bạn \nchào   BẠN\n\n Chào ' } })
  fireEvent.click(screen.getByRole('button', { name: 'Tạo câu hỏi' }))
  await waitFor(() => expect(submit).toHaveBeenCalledTimes(1))
  expect(submit.mock.calls[0]![0].payload.acceptedAnswers).toEqual(['Chào bạn', 'Chào'])
  fireEvent.change(screen.getAllByRole('combobox')[0]!, { target: { value: 'ORDER_SENTENCE' } })
  expect(screen.queryByPlaceholderText(/Mỗi dòng một bản dịch/)).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Tạo câu hỏi' }))
  await waitFor(() => expect(submit).toHaveBeenCalledTimes(2))
  expect(submit.mock.calls[1]![0].payload).not.toHaveProperty('acceptedAnswers')
})

it('shows validation at the alternatives field and prevents oversized submissions', () => {
  const submit = renderForm()
  fireEvent.change(screen.getByPlaceholderText(/Mỗi dòng một bản dịch/), { target: { value: 'x'.repeat(2001) } })
  expect(screen.getByRole('alert')).toHaveTextContent('2000 ký tự')
  fireEvent.click(screen.getByRole('button', { name: 'Tạo câu hỏi' }))
  expect(submit).not.toHaveBeenCalled()
})
