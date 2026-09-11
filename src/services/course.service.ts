import api from '../api/axios'
import type {
  CourseResponse,
  GetCourseResponse,
  GetPublishedCoursesResponse,
  GetPublishedSectionsResponse,
  UserCourseSectionResponse,
} from '../types/course.types'

export const courseService = {
  async getPublishedCourses(): Promise<CourseResponse[]> {
    const response = await api.get<GetPublishedCoursesResponse>('/courses')
    return response.data.data.courses
  },

  async getPublishedCourseById(courseId: string): Promise<CourseResponse> {
    const response = await api.get<GetCourseResponse>(`/courses/${courseId}`)
    return response.data.data.course
  },

  async getPublishedSections(courseId: string): Promise<UserCourseSectionResponse[]> {
    const response = await api.get<GetPublishedSectionsResponse>(`/courses/${courseId}/sections`)
    return response.data.data.sections.map(section => ({
      ...section,
      isLocked: section.hasAccess || section.isCompleted ? false : section.isLocked,
    })).sort(
      (first, second) => first.orderIndex - second.orderIndex,
    )
  },
}
