import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import {
  createL1PayloadSession,
  fetchL1PayloadSessions,
  fetchL1PayloadSession,
  fetchL1PayloadSessionFiles,
  fetchL1PayloadFeedbackItems,
  verifyL1PayloadFeedbackItem,
  downloadL1PayloadSessionZip,
} from '../api/l1PayloadSessionApi.js'

export const l1PayloadSessionKeys = {
  list: ['l1PayloadSession', 'list'],
  session: (id) => ['l1PayloadSession', id],
  files: (id) => ['l1PayloadSession', id, 'files'],
  feedbackItems: (id) => ['l1PayloadSession', id, 'feedbackItems'],
}

export function useCreateL1PayloadSession() {
  return useMutation({
    mutationFn: (args) => createL1PayloadSession(args),
    onError: (error) => {
      message.error(error.message || 'Failed to create payload session')
    },
  })
}

export function useL1PayloadSessions() {
  return useQuery({
    queryKey: l1PayloadSessionKeys.list,
    queryFn: async () => (await fetchL1PayloadSessions()).data,
    meta: { errorMessage: 'Failed to load payload sessions' },
  })
}

// Same 3s-interval-while-processing pattern as useL1FeedbackBatch.
export function useL1PayloadSession(sessionId) {
  return useQuery({
    queryKey: l1PayloadSessionKeys.session(sessionId),
    queryFn: async () => (await fetchL1PayloadSession(sessionId)).data,
    enabled: Boolean(sessionId),
    refetchInterval: (query) => (query.state.data?.status === 'processing' ? 3000 : false),
    meta: { errorMessage: 'Failed to load payload session' },
  })
}

export function useL1PayloadSessionFiles(sessionId, enabled = true) {
  return useQuery({
    queryKey: l1PayloadSessionKeys.files(sessionId),
    queryFn: async () => (await fetchL1PayloadSessionFiles(sessionId)).data,
    enabled: Boolean(sessionId) && enabled,
    meta: { errorMessage: 'Failed to load staged files' },
  })
}

export function useL1PayloadFeedbackItems(sessionId) {
  return useQuery({
    queryKey: l1PayloadSessionKeys.feedbackItems(sessionId),
    queryFn: async () => (await fetchL1PayloadFeedbackItems(sessionId)).data,
    enabled: Boolean(sessionId),
    meta: { errorMessage: 'Failed to load feedback items' },
  })
}

export function useVerifyL1PayloadFeedbackItem(sessionId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (args) => verifyL1PayloadFeedbackItem(sessionId, args),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: l1PayloadSessionKeys.feedbackItems(sessionId) })
    },
    onError: (error) => {
      message.error(error.message || 'Failed to record verification')
    },
  })
}

export function useDownloadL1PayloadSessionZip() {
  return useMutation({
    mutationFn: (sessionId) => downloadL1PayloadSessionZip(sessionId),
    onError: (error) => {
      message.error(error.message || 'Failed to download zip')
    },
  })
}
