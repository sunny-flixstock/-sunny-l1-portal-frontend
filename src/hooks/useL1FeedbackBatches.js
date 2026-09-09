import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { message, notification } from 'antd'
import {
  createL1FeedbackBatch,
  fetchL1FeedbackBatches,
  fetchL1FeedbackBatch,
  fetchL1FeedbackBatchDetail,
  runBztSportsAutoBatch,
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

/** The one-click BZT Sports pipeline: fetch -> payload session -> email
 * deck -> batch RCA. Returns { sessionId, batchId, deckEmailed, emailError,
 * skuCount } (or { sessionId, batchId: null, message } if nothing was
 * flagged in the window) -- the caller feeds batchId straight into
 * useL1FeedbackBatch to track live progress the same way a manual batch is
 * tracked. */
export function useRunBztSportsAutoBatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (window) => runBztSportsAutoBatch(window),
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({ queryKey: l1BatchKeys.all })
      if (!data.batchId) {
        notification.info({ message: 'Nothing to run', description: data.message || 'No SKUs were flagged for rework in this window' })
        return
      }
      // The deck is always ready to download the moment the batch starts,
      // regardless of whether email is configured -- that's the primary
      // "you're done, go get it" signal. Email (if SMTP is set up) is a
      // bonus mentioned alongside it, never the headline.
      notification.success({
        message: 'Feedback deck ready',
        description: `${data.skuCount} SKU(s) fetched — deck is ready to download below.${data.deckEmailed ? ' Also emailed to ashish@flixstock.com (cc viren@flixstock.com).' : ''} RCA batch started — tracking progress below.`,
        duration: 8,
      })
    },
    onError: (error) => {
      message.error(error.message || 'Failed to run the feedback batch')
    },
  })
}
