import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import {
  getL1GenericFeedbackUploadUrl,
  submitL1GenericFeedback,
  fetchL1GenericFeedbackList,
  fetchL1GenericFeedback,
  submitL1GenericFeedbackDecision,
} from '../api/l1GenericFeedbackApi.js'
import { uploadFileToPresignedUrl } from '../utils/s3Upload.js'

export const l1GenericFeedbackKeys = {
  all: ['l1GenericFeedback'],
  detail: (id) => ['l1GenericFeedback', id],
}

export function useL1GenericFeedbackList() {
  return useQuery({
    queryKey: l1GenericFeedbackKeys.all,
    queryFn: async () => (await fetchL1GenericFeedbackList()).data,
    meta: { errorMessage: 'Failed to load generic feedback requests' },
  })
}

/** Polls every 3s while a request is still processing, same pattern as
 * useL1FeedbackBatch. */
export function useL1GenericFeedback(id, options = {}) {
  return useQuery({
    queryKey: l1GenericFeedbackKeys.detail(id),
    queryFn: async () => (await fetchL1GenericFeedback(id)).data,
    enabled: Boolean(id),
    refetchInterval: (query) => (query.state.data?.status === 'processing' ? 3000 : false),
    meta: { errorMessage: 'Failed to load generic feedback request' },
    ...options,
  })
}

/** Uploads each attached image file to S3 via the pre-signed flow, then
 * submits the text + resulting { key, mimeType } pairs. */
export function useSubmitL1GenericFeedback() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ text, files, createdBy }) => {
      const images = []
      for (const file of files || []) {
        const { data } = await getL1GenericFeedbackUploadUrl(file.name)
        await uploadFileToPresignedUrl({ url: data.url, file, contentType: data.contentType || file.type })
        images.push({ key: data.key, mimeType: data.contentType || file.type })
      }
      return submitL1GenericFeedback({ text, images, createdBy })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: l1GenericFeedbackKeys.all })
      message.info('Feedback submitted — routing to the right framework file(s)')
    },
    onError: (error) => {
      message.error(error.message || 'Failed to submit generic feedback')
    },
  })
}

export function useSubmitL1GenericFeedbackDecision() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }) => submitL1GenericFeedbackDecision(id, body),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: l1GenericFeedbackKeys.all })
      queryClient.invalidateQueries({ queryKey: l1GenericFeedbackKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: ['l1GroundTruth'] })
      const status = result?.data?.status
      message.success(status === 'rejected' ? 'Target rejected' : 'Decision recorded, Staging updated')
    },
    onError: (error) => {
      message.error(error.message || 'Failed to submit decision')
    },
  })
}
