import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import {
  createAngleTechnicalSpecification,
  deleteAngleTechnicalSpecification,
  fetchAngleTechnicalSpecification,
  fetchAngleTechnicalSpecifications,
  fetchAngleTechnicalSpecificationsMeta,
} from '../api/angleTechnicalSpecificationApi.js'

export const angleTechnicalSpecificationKeys = {
  all: ['angleTechnicalSpecifications'],
  list: (params) => ['angleTechnicalSpecifications', 'list', params],
  detail: (id) => ['angleTechnicalSpecifications', id],
  meta: ['angleTechnicalSpecifications', 'meta'],
}

export function useAngleTechnicalSpecifications(params = {}, enabled = true) {
  return useQuery({
    queryKey: angleTechnicalSpecificationKeys.list(params),
    queryFn: () => fetchAngleTechnicalSpecifications(params),
    enabled,
    meta: {
      errorMessage: 'Failed to load angle technical specifications',
    },
  })
}

export function useAngleTechnicalSpecification(id, enabled = true) {
  return useQuery({
    queryKey: angleTechnicalSpecificationKeys.detail(id),
    queryFn: async () => {
      const response = await fetchAngleTechnicalSpecification(id)
      return response.data
    },
    enabled: Boolean(id) && enabled,
    meta: {
      errorMessage: 'Failed to load angle technical specification',
    },
  })
}

export function useAngleTechnicalSpecificationsMeta() {
  return useQuery({
    queryKey: angleTechnicalSpecificationKeys.meta,
    queryFn: async () => {
      const response = await fetchAngleTechnicalSpecificationsMeta()
      return response.data
    },
    staleTime: Infinity,
    meta: {
      errorMessage: 'Failed to load angle technical specification options',
    },
  })
}

export function useCreateAngleTechnicalSpecification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body) => createAngleTechnicalSpecification(body),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: angleTechnicalSpecificationKeys.all })
      if (response.data?.deduplicated) {
        message.info('An identical specification already exists — using the existing one')
      } else {
        message.success('Angle technical specification created')
      }
    },
    onError: (error) => {
      message.error(error.message || 'Failed to create angle technical specification')
    },
  })
}

export function useDeleteAngleTechnicalSpecification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => deleteAngleTechnicalSpecification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: angleTechnicalSpecificationKeys.all })
      message.success('Angle technical specification deleted')
    },
    onError: (error) => {
      message.error(error.message || 'Failed to delete angle technical specification')
    },
  })
}
