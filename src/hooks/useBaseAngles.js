import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import {
  archiveBaseAngle,
  createBaseAngle,
  fetchBaseAngle,
  fetchBaseAngleVersions,
  fetchBaseAngles,
  fetchBaseAnglesMeta,
  renameBaseAngle,
} from '../api/baseAngleApi.js'
import { fetchAllPages } from '../utils/fetchAllPages.js'

export const baseAngleKeys = {
  all: ['baseAngles'],
  list: (params) => ['baseAngles', 'list', params],
  detail: (id, params) => ['baseAngles', id, params],
  versions: (seriesKey) => ['baseAngles', 'versions', seriesKey],
  meta: ['baseAngles', 'meta'],
}

export function useBaseAngles(params = {}) {
  return useQuery({
    queryKey: baseAngleKeys.list(params),
    queryFn: () => fetchBaseAngles(params),
    meta: {
      errorMessage: 'Failed to load base angles',
    },
  })
}

export function useAllBaseAngles(params = {}) {
  return useQuery({
    queryKey: [...baseAngleKeys.all, 'all', params],
    queryFn: () => fetchAllPages((pageParams) => fetchBaseAngles({ ...pageParams, ...params })),
    meta: {
      errorMessage: 'Failed to load base angles',
    },
  })
}

export function useBaseAngle(id, params = {}, enabled = true) {
  return useQuery({
    queryKey: baseAngleKeys.detail(id, params),
    queryFn: async () => {
      const response = await fetchBaseAngle(id, params)
      return response.data
    },
    enabled: Boolean(id) && enabled,
    meta: {
      errorMessage: 'Failed to load base angle',
    },
  })
}

export function useBaseAngleVersions(seriesKey, enabled = true) {
  return useQuery({
    queryKey: baseAngleKeys.versions(seriesKey),
    queryFn: async () => {
      const response = await fetchBaseAngleVersions(seriesKey)
      return response.data
    },
    enabled: Boolean(seriesKey) && enabled,
    meta: {
      errorMessage: 'Failed to load version history',
    },
  })
}

export function useBaseAnglesMeta() {
  return useQuery({
    queryKey: baseAngleKeys.meta,
    queryFn: async () => {
      const response = await fetchBaseAnglesMeta()
      return response.data
    },
    staleTime: Infinity,
    meta: {
      errorMessage: 'Failed to load base angle options',
    },
  })
}

export function useCreateBaseAngle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body) => createBaseAngle(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: baseAngleKeys.all })
      message.success('Base angle saved')
    },
    onError: (error) => {
      message.error(error.message || 'Failed to save base angle')
    },
  })
}

export function useRenameBaseAngle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, name }) => renameBaseAngle(id, name),
    onSuccess: (response, { id }) => {
      queryClient.setQueryData(baseAngleKeys.detail(id, {}), response.data)
      queryClient.invalidateQueries({ queryKey: baseAngleKeys.all })
      message.success('Base angle renamed')
    },
    onError: (error) => {
      message.error(error.message || 'Failed to rename base angle')
    },
  })
}

export function useArchiveBaseAngle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => archiveBaseAngle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: baseAngleKeys.all })
      message.success('Base angle archived')
    },
    onError: (error) => {
      message.error(error.message || 'Failed to archive base angle')
    },
  })
}
