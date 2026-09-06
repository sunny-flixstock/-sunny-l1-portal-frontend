import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { fetchL1FeedbackIssues, submitL1FeedbackIssueDecision } from '../api/l1FeedbackApi.js'
import { l1GroundTruthKeys } from './useL1GroundTruth.js'

export const l1FeedbackIssueKeys = {
  all: ['l1FeedbackIssues'],
}

export function useL1FeedbackIssues() {
  return useQuery({
    queryKey: l1FeedbackIssueKeys.all,
    queryFn: async () => (await fetchL1FeedbackIssues()).data,
    meta: { errorMessage: 'Failed to load open issues' },
  })
}

export function useSubmitL1FeedbackIssueDecision() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body) => submitL1FeedbackIssueDecision(body),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: l1FeedbackIssueKeys.all })
      queryClient.invalidateQueries({ queryKey: l1GroundTruthKeys.all })
      const status = result?.data?.status
      if (status === 'needsManualHandling') {
        message.warning('Recorded, but this issue needs manual handling (not a ground-truth doc)')
      } else if (status === 'preambleSuggestionRecorded') {
        message.info(
          'Preamble suggestion recorded — no framework document was changed; this is for engineering follow-up in the rendering pipeline'
        )
      } else {
        message.success('Decision recorded')
      }
    },
    onError: (error) => {
      message.error(error.message || 'Failed to submit decision', 10)
    },
  })
}
