import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import {
  createFrameworkVocab,
  deleteFrameworkVocab,
  fetchFrameworkVocab,
  fetchFrameworkVocabs,
} from '../api/frameworkVocabApi.js'
import { LABELS } from '../constants/brandAiStylistLabels.js'

export const frameworkVocabKeys = {
  all: ['frameworkVocab'],
  list: (params) => ['frameworkVocab', 'list', params],
  detail: (id) => ['frameworkVocab', id],
}

export function useFrameworkVocabs(params = {}) {
  return useQuery({
    queryKey: frameworkVocabKeys.list(params),
    queryFn: () => fetchFrameworkVocabs(params),
    meta: {
      errorMessage: `Failed to load ${LABELS.stylistVocab.toLowerCase()}`,
    },
  })
}

export function useFrameworkVocab(id, enabled = true) {
  return useQuery({
    queryKey: frameworkVocabKeys.detail(id),
    queryFn: async () => {
      const response = await fetchFrameworkVocab(id)
      return response.data
    },
    enabled: Boolean(id) && enabled,
    meta: {
      errorMessage: `Failed to load ${LABELS.stylistVocab.toLowerCase()}`,
    },
  })
}

export function useCreateFrameworkVocab() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body) => createFrameworkVocab(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: frameworkVocabKeys.all })
      message.success(`${LABELS.stylistVocab} uploaded`)
    },
    onError: (error) => {
      message.error(error.message || `Failed to upload ${LABELS.stylistVocab.toLowerCase()}`)
    },
  })
}

export function useDeleteFrameworkVocab() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => deleteFrameworkVocab(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: frameworkVocabKeys.all })
      message.success(`${LABELS.stylistVocab} deleted`)
    },
    onError: (error) => {
      message.error(error.message || `Failed to delete ${LABELS.stylistVocab.toLowerCase()}`)
    },
  })
}
