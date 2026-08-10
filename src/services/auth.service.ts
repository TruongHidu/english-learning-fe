import api from '../api/axios'

export const authService = {
  login: <TResponse, TCredentials>(credentials: TCredentials) =>
    api.post<TResponse>('/auth/login', credentials),

  register: <TResponse, TPayload>(payload: TPayload) =>
    api.post<TResponse>('/auth/register', payload),

  logout: () => api.post('/auth/logout'),
}
