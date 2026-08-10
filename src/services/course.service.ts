import api from '../api/axios'

export const courseService = {
  getAll: <TResponse>() => api.get<TResponse>('/courses'),

  getById: <TResponse>(courseId: string) =>
    api.get<TResponse>(`/courses/${courseId}`),
}
