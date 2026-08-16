export interface ApiSuccess<T> {
  success: true
  message: string
  data: T
}
