import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import {
  fetchL1GroundTruthDocuments,
  fetchL1GroundTruthVersions,
  fetchL1GroundTruthVersionContent,
  promoteL1GroundTruthVersion,
  seedL1GroundTruthDocuments,
  resetL1GroundTruthToCleanBaseline,
} from '../api/l1FeedbackApi.js'

export const l1GroundTruthKeys = {
  all: ['l1GroundTruth'],
  documents: (client) => ['l1GroundTruth', 'documents', client],
  versions: (documentId) => ['l1GroundTruth', 'versions', documentId],
  versionContent: (versionId) => ['l1GroundTruth', 'versionContent', versionId],
}

export function useL1GroundTruthDocuments(client = 'BZT') {
  return useQuery({
    queryKey: l1GroundTruthKeys.documents(client),
    queryFn: async () => (await fetchL1GroundTruthDocuments({ client })).data,
    meta: { errorMessage: 'Failed to load ground-truth documents' },
  })
}

export function useL1GroundTruthVersions(documentId, enabled = true) {
  return useQuery({
    queryKey: l1GroundTruthKeys.versions(documentId),
    queryFn: async () => (await fetchL1GroundTruthVersions(documentId)).data,
    enabled: Boolean(documentId) && enabled,
    meta: { errorMessage: 'Failed to load version history' },
  })
}

export function useL1GroundTruthVersionContent(versionId, enabled = true) {
  return useQuery({
    queryKey: l1GroundTruthKeys.versionContent(versionId),
    queryFn: async () => (await fetchL1GroundTruthVersionContent(versionId)).data,
    enabled: Boolean(versionId) && enabled,
    meta: { errorMessage: 'Failed to load version content' },
  })
}

export function usePromoteL1GroundTruthVersion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ documentId, versionId }) => promoteL1GroundTruthVersion(documentId, versionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: l1GroundTruthKeys.all })
      message.success('Version promoted to live')
    },
    onError: (error) => {
      message.error(error.message || 'Failed to promote version')
    },
  })
}

export function useResetL1GroundTruthToCleanBaseline() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => resetL1GroundTruthToCleanBaseline(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: l1GroundTruthKeys.all })
      queryClient.invalidateQueries({ queryKey: ['l1FeedbackBatches'] })
      queryClient.invalidateQueries({ queryKey: ['l1FeedbackIssues'] })
      queryClient.invalidateQueries({ queryKey: ['l1GenericFeedback'] })
      const { resetDocuments, batchesDeleted, tracesDeleted, genericFeedbackDeleted } = result?.data ?? {}
      message.success(
        `Reset ${resetDocuments?.length ?? 0} document(s) to clean v1; cleared ${batchesDeleted ?? 0} batch(es), ${tracesDeleted ?? 0} trace(s), ${genericFeedbackDeleted ?? 0} generic feedback request(s)`
      )
    },
    onError: (error) => {
      message.error(error.message || 'Failed to reset to clean baseline')
    },
  })
}

export function useSeedL1GroundTruthDocuments() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => seedL1GroundTruthDocuments(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: l1GroundTruthKeys.all })
      const count = result?.data?.created?.length ?? 0
      message.success(count ? `Seeded ${count} document(s)` : 'Already seeded')
    },
    onError: (error) => {
      message.error(error.message || 'Failed to seed ground-truth documents')
    },
  })
}
