import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import {
  archiveSystemInstruction,
  createSystemInstruction,
  fetchInstructionTypes,
  fetchSystemInstruction,
  fetchSystemInstructions,
  fetchSystemInstructionsMeta,
  updateSystemInstructionName,
} from '../api/systemInstructionApi.js'

export const systemInstructionKeys = {
  all: ['systemInstructions'],
  types: ['systemInstructions', 'types'],
  list: (params) => ['systemInstructions', 'list', params],
  detail: (id, includeContent) => ['systemInstructions', id, { includeContent }],
  meta: ['systemInstructions', 'meta'],
}

export function useInstructionTypes() {
  return useQuery({
    queryKey: systemInstructionKeys.types,
    queryFn: async () => {
      const response = await fetchInstructionTypes()
      return response.data
    },
    meta: {
      errorMessage: 'Failed to load instruction types',
    },
  })
}

export function useSystemInstructionsMeta() {
  return useQuery({
    queryKey: systemInstructionKeys.meta,
    queryFn: async () => {
      const response = await fetchSystemInstructionsMeta()
      return response.data
    },
    staleTime: Infinity,
    meta: {
      errorMessage: 'Failed to load instruction options',
    },
  })
}

export function useSystemInstructions(params = {}) {
  return useQuery({
    queryKey: systemInstructionKeys.list(params),
    queryFn: () => fetchSystemInstructions(params),
    meta: {
      errorMessage: 'Failed to load system instructions',
    },
  })
}

export function useSystemInstruction(id, { includeContent = false, enabled = true } = {}) {
  return useQuery({
    queryKey: systemInstructionKeys.detail(id, includeContent),
    queryFn: async () => {
      const response = await fetchSystemInstruction(id, { includeContent })
      return response.data
    },
    enabled: Boolean(id) && enabled,
    meta: {
      errorMessage: 'Failed to load system instruction',
    },
  })
}

export function useCreateSystemInstruction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body) => createSystemInstruction(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemInstructionKeys.all })
      message.success('Instruction created')
    },
    onError: (error) => {
      message.error(error.message || 'Failed to create instruction')
    },
  })
}

export function useUpdateSystemInstructionName() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, name }) => updateSystemInstructionName(id, name),
    onSuccess: (response, { id }) => {
      queryClient.setQueryData(systemInstructionKeys.detail(id, true), (prev) =>
        prev ? { ...prev, name: response.data.name } : prev,
      )
      queryClient.setQueryData(systemInstructionKeys.detail(id, false), (prev) =>
        prev ? { ...prev, name: response.data.name } : prev,
      )
      queryClient.invalidateQueries({ queryKey: systemInstructionKeys.all })
      message.success('Name updated')
    },
    onError: (error) => {
      message.error(error.message || 'Failed to update name')
    },
  })
}

export function useArchiveSystemInstruction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => archiveSystemInstruction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemInstructionKeys.all })
      message.success('Instruction archived')
    },
    onError: (error) => {
      message.error(error.message || 'Failed to archive instruction')
    },
  })
}
