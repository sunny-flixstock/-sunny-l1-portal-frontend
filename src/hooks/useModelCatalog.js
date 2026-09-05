import { useQuery } from '@tanstack/react-query'
import { fetchDescriptionModelCatalog } from '../api/modelCatalogApi.js'

export const modelCatalogKeys = {
  description: ['modelCatalog', 'description'],
}

export function useDescriptionModelCatalog() {
  return useQuery({
    queryKey: modelCatalogKeys.description,
    queryFn: async () => {
      const response = await fetchDescriptionModelCatalog()
      return response.data
    },
    staleTime: 5 * 60 * 1000,
    meta: {
      errorMessage: 'Failed to load model catalog',
    },
  })
}
