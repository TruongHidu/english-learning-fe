import api from '../api/axios'
import type {
  ContentStatus,
  CreateSectionPayload,
  GetAdminSectionsResponse,
  GetSectionResponse,
  SectionResponse,
  UpdateSectionPayload,
} from '../types/course.types'

export const adminSectionService = {
  async getAdminSections(
    courseId: string,
    status?: ContentStatus,
  ): Promise<SectionResponse[]> {
    const params = status ? { status } : undefined
    const response = await api.get<GetAdminSectionsResponse>(
      `/admin/courses/${courseId}/sections`,
      { params },
    )
    return response.data.data.sections
  },

  async getAdminSectionById(sectionId: string): Promise<SectionResponse> {
    const response = await api.get<GetSectionResponse>(
      `/admin/sections/${sectionId}`,
    )
    return response.data.data.section
  },

  async createSection(
    courseId: string,
    payload: CreateSectionPayload,
  ): Promise<SectionResponse> {
    const body: CreateSectionPayload = {
      name: payload.name.trim(),
      description: payload.description?.trim() || undefined,
      orderIndex: Number(payload.orderIndex),
    }
    const response = await api.post<GetSectionResponse>(
      `/admin/courses/${courseId}/sections`,
      body,
    )
    return response.data.data.section
  },

  async updateSection(
    sectionId: string,
    payload: UpdateSectionPayload,
  ): Promise<SectionResponse> {
    const body: UpdateSectionPayload = {}
    if (payload.name !== undefined) body.name = payload.name.trim()
    if (payload.description !== undefined) {
      body.description = payload.description.trim()
    }
    if (payload.orderIndex !== undefined) {
      body.orderIndex = Number(payload.orderIndex)
    }

    const response = await api.patch<GetSectionResponse>(
      `/admin/sections/${sectionId}`,
      body,
    )
    return response.data.data.section
  },

  async updateSectionStatus(
    sectionId: string,
    status: ContentStatus,
  ): Promise<SectionResponse> {
    const response = await api.patch<GetSectionResponse>(
      `/admin/sections/${sectionId}/status`,
      { status },
    )
    return response.data.data.section
  },

  async deactivateSection(sectionId: string): Promise<SectionResponse> {
    const response = await api.delete<GetSectionResponse>(
      `/admin/sections/${sectionId}`,
    )
    return response.data.data.section
  },
}
