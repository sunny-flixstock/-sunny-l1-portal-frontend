import { useState } from 'react'
import { Button, Empty, Popconfirm, Space, Table, Tag, Typography } from 'antd'
import { DiffOutlined, EyeOutlined, ForwardOutlined, RocketOutlined, WarningOutlined } from '@ant-design/icons'
import {
  useL1GroundTruthDocuments,
  usePromoteL1GroundTruthVersion,
  useSeedL1GroundTruthDocuments,
  useResetL1GroundTruthToCleanBaseline,
  useAdvanceL1GroundTruthStagingVersion,
  useAdvanceL1GroundTruthStagingVersionBulk,
} from '../../hooks/useL1GroundTruth.js'
import { L1GroundTruthCompareModal } from './L1GroundTruthCompareModal.jsx'
import { L1GroundTruthContentModal } from './L1GroundTruthContentModal.jsx'

function docLabel(doc) {
  const gender = doc.gender ? doc.gender[0].toUpperCase() + doc.gender.slice(1) : 'Any'
  return `${gender} · ${doc.docKey}`
}

export function L1GroundTruthTable() {
  const { data: documents = [], isLoading } = useL1GroundTruthDocuments('BZT')
  const seedMutation = useSeedL1GroundTruthDocuments()
  const promoteMutation = usePromoteL1GroundTruthVersion()
  const resetMutation = useResetL1GroundTruthToCleanBaseline()
  const advanceMutation = useAdvanceL1GroundTruthStagingVersion()
  const advanceBulkMutation = useAdvanceL1GroundTruthStagingVersionBulk()
  const [compareDoc, setCompareDoc] = useState(null)
  const [viewDoc, setViewDoc] = useState(null)
  const pendingCount = documents.filter((doc) => doc.hasPendingStagingChanges).length

  const columns = [
    { title: 'File', dataIndex: 'fileName', key: 'fileName' },
    { title: 'Scope', key: 'scope', render: (_, doc) => docLabel(doc) },
    {
      title: 'Staging',
      key: 'staging',
      render: (_, doc) => (
        <Space>
          v{doc.stagingVersionNumber}
          {doc.hasPendingStagingChanges && <Tag color="gold">pending</Tag>}
        </Space>
      ),
    },
    {
      title: 'Live',
      key: 'live',
      render: (_, doc) => <Tag color="green">v{doc.liveVersionNumber}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, doc) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />} onClick={() => setViewDoc(doc)}>
            View
          </Button>
          <Button size="small" icon={<DiffOutlined />} onClick={() => setCompareDoc(doc)}>
            Compare
          </Button>
          {doc.hasPendingStagingChanges && (
            <Popconfirm
              title="Move to next staging version?"
              description="Seals everything approved so far into its own version number and opens a fresh draft — approvals since your last batch keep stacking onto that new draft until you do this again."
              okText="Move to next version"
              onConfirm={() => advanceMutation.mutate(doc._id)}
            >
              <Button size="small" icon={<ForwardOutlined />} loading={advanceMutation.isPending}>
                Move to next staging version
              </Button>
            </Popconfirm>
          )}
          {doc.hasPendingStagingChanges && (
            <Popconfirm
              title="Promote staging to live?"
              description={`v${doc.stagingVersionNumber} becomes the live version served to production.`}
              okText="Promote"
              onConfirm={() =>
                promoteMutation.mutate({ documentId: doc._id, versionId: doc.stagingVersionId })
              }
            >
              <Button size="small" type="primary" icon={<RocketOutlined />} loading={promoteMutation.isPending}>
                Promote to Live
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <>
      {documents.length > 0 && (
        <Space style={{ width: '100%', justifyContent: 'flex-end', marginBottom: 12 }}>
          {pendingCount > 1 && (
            <Popconfirm
              title={`Move ${pendingCount} document(s) to their next staging version?`}
              description="Seals every document with pending changes into its own new version number, in one click."
              okText="Advance all pending"
              onConfirm={() => advanceBulkMutation.mutate()}
            >
              <Button icon={<ForwardOutlined />} loading={advanceBulkMutation.isPending}>
                Advance all pending ({pendingCount})
              </Button>
            </Popconfirm>
          )}
          <Popconfirm
            title="Reset every document to a clean v1?"
            description={
              <Typography.Text style={{ maxWidth: 320, display: 'inline-block' }}>
                Collapses each document's version history to a single v1 built from its current Live
                content, for both Staging and Live, and clears all feedback batches, SKU traces, and
                generic feedback requests. This cannot be undone.
              </Typography.Text>
            }
            okText="Reset"
            okButtonProps={{ danger: true }}
            onConfirm={() => resetMutation.mutate()}
          >
            <Button danger icon={<WarningOutlined />} loading={resetMutation.isPending}>
              Reset to clean v1
            </Button>
          </Popconfirm>
        </Space>
      )}
      {documents.length === 0 && !isLoading ? (
        <Empty description="No ground-truth documents yet">
          <Button type="primary" loading={seedMutation.isPending} onClick={() => seedMutation.mutate()}>
            Seed from L1_Feedback_Skill/*.md
          </Button>
        </Empty>
      ) : (
        <Table
          rowKey="_id"
          loading={isLoading}
          dataSource={documents}
          columns={columns}
          pagination={false}
        />
      )}
      <L1GroundTruthCompareModal document={compareDoc} onClose={() => setCompareDoc(null)} />
      <L1GroundTruthContentModal document={viewDoc} onClose={() => setViewDoc(null)} />
    </>
  )
}
