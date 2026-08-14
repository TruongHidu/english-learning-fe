export type ContentStatus = 'DRAFT' | 'PUBLISHED' | 'INACTIVE'

export interface CourseResponse {
  id: string
  name: string
  description: string | null
  level: string
  thumbnailUrl: string | null
  status: ContentStatus
  orderIndex: number
  createdAt: string
  updatedAt: string
}

export interface SectionResponse {
  id: string
  courseId: string
  name: string
  description: string | null
  orderIndex: number
  status: ContentStatus
  createdAt: string
  updatedAt: string
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface CourseListQueryParams {
  page?: number
  limit?: number
  search?: string
  status?: ContentStatus
  level?: string
}

export interface CreateCoursePayload {
  name: string
  description?: string
  level: string
  thumbnailUrl?: string | null
  orderIndex: number
}

export interface UpdateCoursePayload {
  name?: string
  description?: string
  level?: string
  thumbnailUrl?: string | null
  orderIndex?: number
}

export interface UpdateCourseStatusPayload {
  status: ContentStatus
}

export interface CreateSectionPayload {
  name: string
  description?: string
  orderIndex: number
}

export interface UpdateSectionPayload {
  name?: string
  description?: string
  orderIndex?: number
}

export interface UpdateSectionStatusPayload {
  status: ContentStatus
}

export interface GetPublishedCoursesResponse {
  success: true
  message: string
  data: {
    courses: CourseResponse[]
  }
}

export interface GetCourseResponse {
  success: true
  message: string
  data: {
    course: CourseResponse
  }
}

export interface GetPublishedSectionsResponse {
  success: true
  message: string
  data: {
    sections: SectionResponse[]
  }
}

export interface GetAdminCoursesResponse {
  success: true
  message: string
  data: {
    courses: CourseResponse[]
    pagination: PaginationMeta
  }
}

export interface GetAdminSectionsResponse {
  success: true
  message: string
  data: {
    sections: SectionResponse[]
  }
}

export interface GetSectionResponse {
  success: true
  message: string
  data: {
    section: SectionResponse
  }
}
