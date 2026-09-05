import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, Descriptions, Empty, Row, Col, Table, Tag, Timeline, Typography, Spin } from 'antd'
import { useL1FeedbackBatches, useL1FeedbackBatchDetail } from '../../hooks/useL1FeedbackBatches.js'
import { useL1GenericFeedbackList, useL1GenericFeedback } from '../../hooks/useL1GenericFeedback.js'
import { RequestCard } from './GenericFeedbackList.jsx'

const { Text, Paragraph } = Typography

function batchSummary(batch) {
  return `${batch.diagnosedSkuIds?.length ?? 0}/${batch.totalSkus ?? 0} diagnosed, ${batch.rejectedSkuIds?.length ?? 0} rejected, ${batch.errors?.length ?? 0} error(s)`
}

function SkuBatchDetail({ id }) {
  const { data, isLoading } = useL1FeedbackBatchDetail(id)
  if (isLoading) return <Spin />
  if (!data) return <Empty description="Session not found" />
  const { batch, traces, versions } = data

  return (
    <Card size="small" title={`Session ${batch._id}`}>
      <Descriptions size="small" column={2} bordered style={{ marginBottom: 16 }}>
        <Descriptions.Item label="Status">
          <Tag color={batch.status === 'failed' ? 'red' : batch.status === 'processing' ? 'gold' : 'green'}>
            {batch.status}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Created">{new Date(batch.createdAt).toLocaleString()}</Descriptions.Item>
        <Descriptions.Item label="Uploaded files">{batch.uploadedFiles?.length ?? 0}</Descriptions.Item>
        <Descriptions.Item label="Created by">{batch.createdBy || '—'}</Descriptions.Item>
      </Descriptions>

      <Row gutter={16}>
        <Col span={12}>
          <Typography.Title level={5}>Event timeline</Typography.Title>
          <Timeline
            items={(batch.events || []).map((e) => ({
              children: (
                <>
                  <Text strong>{e.type}</Text> — <Text type="secondary">{new Date(e.at).toLocaleString()}</Text>
                  {e.meta && (
                    <Paragraph type="secondary" style={{ marginBottom: 0, fontSize: 12 }}>
                      {JSON.stringify(e.meta)}
                    </Paragraph>
                  )}
                </>
              ),
            }))}
          />
        </Col>
        <Col span={12}>
          <Typography.Title level={5}>SKU traces ({traces.length})</Typography.Title>
          <Table
            size="small"
            rowKey="_id"
            pagination={false}
            dataSource={traces}
            columns={[
              { title: 'SKU', dataIndex: '_id' },
              { title: 'Gender', dataIndex: 'gender' },
              {
                title: 'Angles',
                render: (_, t) => t.data?.gtom_L1_output?.length ?? 0,
              },
            ]}
          />
          <Typography.Title level={5} style={{ marginTop: 16 }}>
            Ground-truth versions created ({versions.length})
          </Typography.Title>
          <Table
            size="small"
            rowKey="_id"
            pagination={false}
            dataSource={versions}
            columns={[
              { title: 'Version', render: (_, v) => `v${v.versionNumber}` },
              { title: 'Applied fixes', render: (_, v) => v.appliedFixes?.length ?? 0 },
              { title: 'Created', render: (_, v) => new Date(v.createdAt).toLocaleString() },
            ]}
          />
        </Col>
      </Row>
    </Card>
  )
}

function GenericFeedbackDetail({ id }) {
  const { data, isLoading } = useL1GenericFeedback(id)
  if (isLoading) return <Spin />
  if (!data) return <Empty description="Session not found" />
  return <RequestCard request={data} />
}

export function BatchSessionHistory() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedId = searchParams.get('session')
  const selectedType = searchParams.get('sessionType')

  const { data: batches = [], isLoading: batchesLoading } = useL1FeedbackBatches()
  const { data: genericRequests = [], isLoading: genericLoading } = useL1GenericFeedbackList()

  const rows = useMemo(() => {
    const batchRows = batches.map((b) => ({
      id: b._id,
      type: 'sku_batch',
      typeLabel: 'SKU batch',
      createdAt: b.createdAt,
      status: b.status,
      summary: batchSummary(b),
    }))
    const genericRows = genericRequests.map((r) => ({
      id: r._id,
      type: 'generic_feedback',
      typeLabel: 'Generic feedback',
      createdAt: r.createdAt,
      status: r.status,
      summary: r.text.length > 80 ? `${r.text.slice(0, 80)}…` : r.text,
    }))
    return [...batchRows, ...genericRows].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [batches, genericRequests])

  function selectRow(row) {
    // Merge onto the existing params (preserving `tab=history`) instead of
    // replacing them outright -- a bare setSearchParams({session, ...})
    // would drop `tab`, snapping the page back to its default Upload tab.
    const next = new URLSearchParams(searchParams)
    next.set('session', row.id)
    next.set('sessionType', row.type)
    setSearchParams(next)
  }

  const columns = [
    { title: 'Type', dataIndex: 'typeLabel', render: (v) => <Tag>{v}</Tag> },
    { title: 'Created', dataIndex: 'createdAt', render: (v) => new Date(v).toLocaleString() },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (v) => <Tag color={v === 'failed' ? 'red' : v === 'processing' ? 'gold' : 'green'}>{v}</Tag>,
    },
    { title: 'Summary', dataIndex: 'summary' },
  ]

  return (
    <Row gutter={16}>
      <Col span={selectedId ? 10 : 24}>
        <Table
          size="small"
          rowKey="id"
          loading={batchesLoading || genericLoading}
          dataSource={rows}
          columns={columns}
          onRow={(row) => ({ onClick: () => selectRow(row), style: { cursor: 'pointer' } })}
          rowClassName={(row) => (row.id === selectedId ? 'ant-table-row-selected' : '')}
          pagination={{ pageSize: 10 }}
        />
      </Col>
      {selectedId && (
        <Col span={14}>
          {selectedType === 'generic_feedback' ? (
            <GenericFeedbackDetail id={selectedId} />
          ) : (
            <SkuBatchDetail id={selectedId} />
          )}
        </Col>
      )}
    </Row>
  )
}
