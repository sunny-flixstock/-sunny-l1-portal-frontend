import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import {
  createCategoryRegistry,
  deleteCategoryRegistry,
  fetchCategoryRegistry,
  fetchCategoryRegistries,
} from '../api/categoryRegistryApi.js'

export const categoryRegistryKeys = {
  all: ['categoryRegistry'],
  list: (params) => ['categoryRegistry', 'list', params],
  detail: (id) => ['categoryRegistry', id],
}

export function useCategoryRegistries(params = {}) {
  return useQuery({
    queryKey: categoryRegistryKeys.list(params),
    queryFn: () => fetchCategoryRegistries(params),
    meta: {
      errorMessage: 'Failed to load category registries',
    },
  })
}

export function useCategoryRegistry(id, enabled = true) {
  return useQuery({
    queryKey: categoryRegistryKeys.detail(id),
    queryFn: async () => {
      const response = await fetchCategoryRegistry(id)
      return response.data
    },
    enabled: Boolean(id) && enabled,
    meta: {
      errorMessage: 'Failed to load category registry',
    },
  })
}

export function useCreateCategoryRegistry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body) => createCategoryRegistry(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryRegistryKeys.all })
      message.success('Category registry uploaded')
    },
    onError: (error) => {
      message.error(error.message || 'Failed to upload category registry')
    },
  })
}

export function useDeleteCategoryRegistry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => deleteCategoryRegistry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryRegistryKeys.all })
      message.success('Category registry deleted')
    },
    onError: (error) => {
      message.error(error.message || 'Failed to delete category registry')
    },
  })
}
