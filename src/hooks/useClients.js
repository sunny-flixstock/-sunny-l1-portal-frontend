import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import {
  createClient,
  fetchAllClients,
  fetchClient,
  fetchClients,
  updateClientCsvConfig,
} from '../api/clientApi.js'

export const clientKeys = {
  all: ['clients'],
  list: (params) => ['clients', 'list', params],
  detail: (code) => ['clients', code],
}

export function useClients({ q = '', pageNum = 1, pageSize = 20 } = {}) {
  const params = { q, pageNum, pageSize }

  return useQuery({
    queryKey: clientKeys.list(params),
    queryFn: async () => {
      const response = await fetchClients(params)
      return response
    },
    meta: {
      errorMessage: 'Failed to load clients',
    },
  })
}

export function useAllClients({ q = '' } = {}) {
  return useQuery({
    queryKey: [...clientKeys.all, 'all', q],
    queryFn: async () => {
      const response = await fetchAllClients({ q })
      return response.data ?? []
    },
    meta: {
      errorMessage: 'Failed to load clients',
    },
  })
}

export function useClient(code, enabled = true) {
  return useQuery({
    queryKey: clientKeys.detail(code),
    queryFn: async () => {
      const response = await fetchClient(code)
      return response.data
    },
    enabled: Boolean(code) && enabled,
    meta: {
      errorMessage: 'Failed to load client settings',
    },
  })
}

export function useCreateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body) => createClient(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.all })
      message.success('Client created')
    },
    onError: (error) => {
      message.error(error.message || 'Failed to create client')
    },
  })
}

export function useUpdateClientCsvConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ code, csvConfig }) => updateClientCsvConfig(code, csvConfig),
    onSuccess: (response, { code }) => {
      queryClient.setQueryData(clientKeys.detail(code), response.data)
      queryClient.invalidateQueries({ queryKey: clientKeys.all })
      message.success('CSV config saved')
    },
    onError: (error) => {
      message.error(error.message || 'Failed to save CSV config')
    },
  })
}
