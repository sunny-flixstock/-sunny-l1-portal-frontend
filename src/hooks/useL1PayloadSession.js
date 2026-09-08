import { useMutation, useQuery } from '@tanstack/react-query'
import { message } from 'antd'
import {
  createL1PayloadSession,
  fetchL1PayloadSession,
  fetchL1PayloadSessionFiles,
  downloadL1PayloadSessionZip,
} from '../api/l1PayloadSessionApi.js'

export const l1PayloadSessionKeys = {
  session: (id) => ['l1PayloadSession', id],
  files: (id) => ['l1PayloadSession', id, 'files'],
}

export function useCreateL1PayloadSession() {
  return useMutation({
    mutationFn: (args) => createL1PayloadSession(args),
    onError: (error) => {
      message.error(error.message || 'Failed to create payload session')
    },
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

export function useDownloadL1PayloadSessionZip() {
  return useMutation({
    mutationFn: (sessionId) => downloadL1PayloadSessionZip(sessionId),
    onError: (error) => {
      message.error(error.message || 'Failed to download zip')
    },
  })
}
