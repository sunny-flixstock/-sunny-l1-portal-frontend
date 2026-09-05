import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import {
  createL1FeedbackBatch,
  fetchL1FeedbackBatches,
  fetchL1FeedbackBatch,
  fetchL1FeedbackBatchDetail,
} from '../api/l1FeedbackApi.js'

export const l1BatchKeys = {
  all: ['l1FeedbackBatches'],
  detail: (id) => ['l1FeedbackBatches', id],
}

export function useL1FeedbackBatches() {
  return useQuery({
    queryKey: l1BatchKeys.all,
    queryFn: async () => (await fetchL1FeedbackBatches()).data,
    meta: { errorMessage: 'Failed to load batches' },
  })
}

/** Polls every 3s while the batch is still processing, and stops itself
 * the moment it lands on a terminal status -- no manual interval teardown
 * needed at the call site. */
export function useL1FeedbackBatch(id, options = {}) {
  return useQuery({
    queryKey: l1BatchKeys.detail(id),
    queryFn: async () => (await fetchL1FeedbackBatch(id)).data,
    enabled: Boolean(id),
    refetchInterval: (query) => (query.state.data?.status === 'processing' ? 3000 : false),
    meta: { errorMessage: 'Failed to load batch' },
    ...options,
  })
}

/** Full session detail (traces + resulting ground-truth versions + event
 * timeline) for the Batch/Session History tab -- not polled, since the
 * caller re-fetches on demand when a row is selected. */
export function useL1FeedbackBatchDetail(id) {
  return useQuery({
    queryKey: [...l1BatchKeys.detail(id), 'full'],
    queryFn: async () => (await fetchL1FeedbackBatchDetail(id)).data,
    enabled: Boolean(id),
    meta: { errorMessage: 'Failed to load session detail' },
  })
}

export function useCreateL1FeedbackBatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (configs) => createL1FeedbackBatch(configs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: l1BatchKeys.all })
      message.info('Batch created — processing started, tracking progress below')
    },
    onError: (error) => {
      message.error(error.message || 'Failed to create batch')
    },
  })
}
