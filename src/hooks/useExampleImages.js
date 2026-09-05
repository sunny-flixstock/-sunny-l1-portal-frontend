import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import {
  batchUpdateExampleImages,
  deleteExampleImage,
  fetchExampleImageTags,
  fetchExampleImages,
  updateExampleImage,
} from '../api/exampleImageApi.js'

export const exampleImageKeys = {
  all: ['exampleImages'],
  list: (params) => ['exampleImages', 'list', params],
  tags: (client) => ['exampleImages', 'tags', client ?? ''],
}

export function useExampleImages(params = {}) {
  return useQuery({
    queryKey: exampleImageKeys.list(params),
    queryFn: () => fetchExampleImages(params),
    meta: {
      errorMessage: 'Failed to load example images',
    },
  })
}

export function useExampleImageTags(client) {
  return useQuery({
    queryKey: exampleImageKeys.tags(client),
    queryFn: async () => {
      const response = await fetchExampleImageTags(client)
      return response.data
    },
    meta: {
      errorMessage: 'Failed to load tags',
    },
  })
}

export function useUpdateExampleImage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, body }) => updateExampleImage(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exampleImageKeys.all })
      queryClient.invalidateQueries({ queryKey: ['exampleImages', 'tags'] })
      message.success('Tags updated')
    },
    onError: (error) => {
      message.error(error.message || 'Failed to update example image')
    },
  })
}

export function useBatchUpdateExampleImages() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (updates) => batchUpdateExampleImages(updates),
    onSuccess: (_, updates) => {
      queryClient.invalidateQueries({ queryKey: exampleImageKeys.all })
      queryClient.invalidateQueries({ queryKey: ['exampleImages', 'tags'] })
      message.success(`Updated tags on ${updates.length} image(s)`)
    },
    onError: (error) => {
      message.error(error.message || 'Failed to update example images')
    },
  })
}

export function useDeleteExampleImage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => deleteExampleImage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exampleImageKeys.all })
      message.success('Example image deleted')
    },
    onError: (error) => {
      message.error(error.message || 'Failed to delete example image')
    },
  })
}
