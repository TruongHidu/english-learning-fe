import api from '../api/axios'

export const learningService = {
  getProgress: <TResponse>() => api.get<TResponse>('/learning/progress'),

  updateProgress: <TResponse, TPayload>(payload: TPayload) =>
    api.put<TResponse>('/learning/progress', payload),
}
