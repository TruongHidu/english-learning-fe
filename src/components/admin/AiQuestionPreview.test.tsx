import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import AiQuestionPreview from './AiQuestionPreview'
import type { GeneratedQuestionCandidate } from '../../types/admin-ai.types'

it('lets admins add translation alternatives and blocks invalid candidates before commit', () => {
  const commit = vi.fn().mockResolvedValue(undefined)
  function Preview() {
    const [candidates, setCandidates] = useState<GeneratedQuestionCandidate[]>([{
      candidateKey: 'q1', type: 'TRANSLATION', vocabularyId: 'v1', content: 'Hello',
      correctAnswer: 'Xin chào', difficulty: 'EASY',
    }])
    return <AiQuestionPreview candidates={candidates} vocabularies={[{ id: 'v1', word: 'Hello' }]}
      selectedKeys={['q1']} generationStatus="COMPLETED" isCommitting={false}
      onCandidatesChange={setCandidates} onSelectedKeysChange={vi.fn()}
      onCommit={() => commit(candidates)} />
  }
  render(<Preview />)
  const field = screen.getByPlaceholderText(/Mỗi dòng một bản dịch/)
  fireEvent.change(field, { target: { value: 'Chào bạn\nChào' } })
  fireEvent.click(screen.getByRole('button', { name: /Lưu 1 đề xuất thành DRAFT/ }))
  expect(commit.mock.calls[0]![0][0].acceptedAnswers).toEqual(['Chào bạn', 'Chào'])
  fireEvent.change(field, { target: { value: Array(21).fill('Chào').join('\n') } })
  expect(screen.getByRole('button', { name: /Lưu 1 đề xuất thành DRAFT/ })).toBeDisabled()
})
