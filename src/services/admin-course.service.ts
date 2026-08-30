import api from '../api/axios'
import type {
  ContentStatus,
  CourseListQueryParams,
  CourseResponse,
  CreateCoursePayload,
  GetAdminCoursesResponse,
  GetCourseResponse,
  PaginationMeta,
  UpdateCoursePayload,
} from '../types/course.types'

export const adminCourseService = {
  async getAllCourses(): Promise<CourseResponse[]> {
    const response = await this.getAdminCourses({ limit: 100 })
    return response.courses
  },

  async getAdminCourses(
    params?: CourseListQueryParams,
  ): Promise<{ courses: CourseResponse[]; pagination: PaginationMeta }> {
    const cleanParams: Record<string, string | number> = {}

    if (params?.page !== undefined && params.page > 0) {
      cleanParams.page = params.page
    }
    if (params?.limit !== undefined && params.limit > 0) {
      cleanParams.limit = params.limit
    }
    if (params?.search && params.search.trim()) {
      cleanParams.search = params.search.trim()
    }
    if (params?.status) {
      cleanParams.status = params.status
    }
    if (params?.level && params.level.trim()) {
      cleanParams.level = params.level.trim()
    }

    const response = await api.get<GetAdminCoursesResponse>('/admin/courses', {
      params: cleanParams,
    })
    return response.data.data
  },

  async getAdminCourseById(courseId: string): Promise<CourseResponse> {
    const response = await api.get<GetCourseResponse>(`/admin/courses/${courseId}`)
    return response.data.data.course
  },

  async createCourse(payload: CreateCoursePayload): Promise<CourseResponse> {
    const body: CreateCoursePayload = {
      name: payload.name.trim(),
      description: payload.description?.trim() || undefined,
      level: payload.level.trim(),
      thumbnailUrl: payload.thumbnailUrl?.trim() || null,
      orderIndex: Number(payload.orderIndex),
    }
    const response = await api.post<GetCourseResponse>('/admin/courses', body)
    return response.data.data.course
  },

  async updateCourse(
    courseId: string,
    payload: UpdateCoursePayload,
  ): Promise<CourseResponse> {
    const body: UpdateCoursePayload = {}
    if (payload.name !== undefined) body.name = payload.name.trim()
    if (payload.description !== undefined) {
      body.description = payload.description.trim()
    }
    if (payload.level !== undefined) body.level = payload.level.trim()
    if (payload.thumbnailUrl !== undefined) {
      body.thumbnailUrl = payload.thumbnailUrl?.trim() || null
    }
    if (payload.orderIndex !== undefined) {
      body.orderIndex = Number(payload.orderIndex)
    }

    const response = await api.patch<GetCourseResponse>(
      `/admin/courses/${courseId}`,
      body,
    )
    return response.data.data.course
  },

  async updateCourseStatus(
    courseId: string,
    status: ContentStatus,
  ): Promise<CourseResponse> {
    const response = await api.patch<GetCourseResponse>(
      `/admin/courses/${courseId}/status`,
      { status },
    )
    return response.data.data.course
  },

  async deactivateCourse(courseId: string): Promise<CourseResponse> {
    const response = await api.delete<GetCourseResponse>(
      `/admin/courses/${courseId}`,
    )
    return response.data.data.course
  },
}
