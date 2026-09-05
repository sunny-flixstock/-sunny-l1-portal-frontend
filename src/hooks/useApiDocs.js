import { useQuery } from '@tanstack/react-query'
import { fetchApiDoc, fetchApiDocs } from '../api/apiDocsApi.js'

export const apiDocsKeys = {
  all: ['apiDocs'],
  list: () => ['apiDocs', 'list'],
  detail: (name) => ['apiDocs', name],
}

export function useApiDocs() {
  return useQuery({
    queryKey: apiDocsKeys.list(),
    queryFn: async () => {
      const response = await fetchApiDocs()
      return response.data ?? []
    },
    meta: {
      errorMessage: 'Failed to load API documentation',
    },
  })
}

export function useApiDoc(name, enabled = true) {
  return useQuery({
    queryKey: apiDocsKeys.detail(name),
    queryFn: async () => {
      const response = await fetchApiDoc(name)
      return response.data
    },
    enabled: Boolean(name) && enabled,
    meta: {
      errorMessage: 'Failed to load API document',
    },
  })
}
