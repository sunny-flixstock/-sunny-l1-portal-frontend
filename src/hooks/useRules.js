import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import {
  createRule,
  createRulesBulk,
  deleteRule,
  fetchRule,
  fetchRules,
  fetchRulesMeta,
  fetchRuleTags,
  updateRule,
} from '../api/ruleApi.js'

export const ruleKeys = {
  all: ['rules'],
  list: (params) => ['rules', 'list', params],
  detail: (id) => ['rules', id],
  meta: ['rules', 'meta'],
  tags: (client) => ['rules', 'tags', client ?? ''],
}

export function useRules(params = {}) {
  return useQuery({
    queryKey: ruleKeys.list(params),
    queryFn: () => fetchRules(params),
    meta: {
      errorMessage: 'Failed to load rules',
    },
  })
}

export function useRule(id, enabled = true) {
  return useQuery({
    queryKey: ruleKeys.detail(id),
    queryFn: async () => {
      const response = await fetchRule(id)
      return response.data
    },
    enabled: Boolean(id) && enabled,
    meta: {
      errorMessage: 'Failed to load rule',
    },
  })
}

export function useRulesMeta() {
  return useQuery({
    queryKey: ruleKeys.meta,
    queryFn: async () => {
      const response = await fetchRulesMeta()
      return response.data
    },
    staleTime: Infinity,
    meta: {
      errorMessage: 'Failed to load rule options',
    },
  })
}

export function useRuleTags(client) {
  return useQuery({
    queryKey: ruleKeys.tags(client),
    queryFn: async () => {
      const response = await fetchRuleTags(client)
      return response.data
    },
    meta: {
      errorMessage: 'Failed to load tags',
    },
  })
}

export function useCreateRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body) => createRule(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ruleKeys.all })
      message.success('Rule created')
    },
    onError: (error) => {
      message.error(error.message || 'Failed to create rule')
    },
  })
}

export function useBulkCreateRules() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (rules) => createRulesBulk(rules),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ruleKeys.all })
    },
    onError: (error) => {
      message.error(error.message || 'Failed to create rules')
    },
  })
}

export function useUpdateRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, body }) => updateRule(id, body),
    onSuccess: (response, { id }) => {
      queryClient.setQueryData(ruleKeys.detail(id), response.data)
      queryClient.invalidateQueries({ queryKey: ruleKeys.all })
      message.success('Rule updated')
    },
    onError: (error) => {
      message.error(error.message || 'Failed to update rule')
    },
  })
}

export function useDeleteRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => deleteRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ruleKeys.all })
      message.success('Rule deleted')
    },
    onError: (error) => {
      message.error(error.message || 'Failed to delete rule')
    },
  })
}
