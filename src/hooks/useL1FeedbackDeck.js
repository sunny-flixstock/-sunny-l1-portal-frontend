import { useMutation } from '@tanstack/react-query'
import { message } from 'antd'
import { downloadL1PayloadFeedbackDeck } from '../api/l1PayloadSessionApi.js'

// Pure visibility/analysis artifact -- one slide per merged feedback item,
// generated on demand from a Payload Creation session. Deliberately has no
// relationship to L1FeedbackBatch/SKU config upload/RCA.
export function useDownloadL1PayloadFeedbackDeck() {
  return useMutation({
    mutationFn: (sessionId) => downloadL1PayloadFeedbackDeck(sessionId),
    onError: (error) => {
      message.error(error.message || 'Failed to download feedback deck')
    },
  })
}
