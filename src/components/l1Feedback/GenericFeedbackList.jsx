import { useState } from 'react'
import { Alert, Button, Card, Empty, Image, Input, Popconfirm, Space, Spin, Tag, Typography } from 'antd'
import { CheckOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons'
import { useL1GenericFeedbackList, useSubmitL1GenericFeedbackDecision } from '../../hooks/useL1GenericFeedback.js'
import { CandidateBlock } from './CandidateBlock.jsx'

const { Text, Paragraph } = Typography

function TargetCard({ requestId, target, targetIndex }) {
  const submitDecision = useSubmitL1GenericFeedbackDecision()
  const [customText, setCustomText] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const decided = target.decision?.status && target.decision.status !== 'pending'

  function decide(decision, extra = {}) {
    submitDecision.mutate({ id: requestId, targetIndex, decision, ...extra })
  }

  return (
    <Card
      size="small"
      title={
        <Space wrap>
          <Tag color="blue">{target.fileName}</Tag>
          {target.section && <Tag>{target.section}</Tag>}
          {decided && (
            <Tag color={target.decision.status === 'approved' ? 'green' : 'default'}>
              {target.decision.status}
              {target.decision.appliedVersionNumber ? ` — staging v${target.decision.appliedVersionNumber}` : ''}
            </Tag>
          )}
        </Space>
      }
      style={{ marginBottom: 12 }}
    >
      {target.isPreambleSuggestion && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          message={
            <Space>
              <Tag color="purple">Preamble suggestion</Tag>
              <Text>Code-level issue — approving records a suggestion for engineering, no framework document changes</Text>
            </Space>
          }
        />
      )}

      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <CandidateBlock label="Candidate 0" candidate={target.candidates.candidate_0} />
        <CandidateBlock label="Candidate 1" candidate={target.candidates.candidate_1} />
      </Space>

      {!decided && (
        <>
          <Space wrap style={{ marginTop: 16 }}>
            <Popconfirm title="Approve candidate 0?" onConfirm={() => decide('candidate_0')}>
              <Button icon={<CheckOutlined />} loading={submitDecision.isPending}>
                Approve candidate 0
              </Button>
            </Popconfirm>
            <Popconfirm title="Approve candidate 1?" onConfirm={() => decide('candidate_1')}>
              <Button icon={<CheckOutlined />} loading={submitDecision.isPending}>
                Approve candidate 1
              </Button>
            </Popconfirm>
            <Popconfirm title="Reject — leave open, no fix applied?" onConfirm={() => decide('reject')}>
              <Button danger icon={<CloseOutlined />} loading={submitDecision.isPending}>
                Reject
              </Button>
            </Popconfirm>
            <Button icon={<EditOutlined />} onClick={() => setShowCustom((v) => !v)}>
              Custom instruction
            </Button>
          </Space>

          {showCustom && (
            <Space.Compact style={{ width: '100%', marginTop: 12 }}>
              <Input
                placeholder="Describe the exact edit to apply instead"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
              />
              <Button
                type="primary"
                disabled={!customText.trim()}
                loading={submitDecision.isPending}
                onClick={() => decide('custom', { customInstruction: customText })}
              >
                Apply
              </Button>
            </Space.Compact>
          )}
        </>
      )}
    </Card>
  )
}

export function RequestCard({ request }) {
  return (
    <Card
      size="small"
      title={
        <Space wrap>
          <Tag color={request.status === 'failed' ? 'red' : request.status === 'processing' ? 'gold' : 'green'}>
            {request.status}
          </Tag>
          <Text type="secondary" style={{ fontWeight: 400 }}>
            {new Date(request.createdAt).toLocaleString()}
          </Text>
        </Space>
      }
      style={{ marginBottom: 16 }}
    >
      <Paragraph>
        <Text strong>Feedback: </Text>
        {request.text}
      </Paragraph>

      {request.images?.length > 0 && (
        <Space wrap style={{ marginBottom: 12 }}>
          {request.images.map((img, index) => (
            <Image key={index} src={img.url} alt="attachment" width={100} style={{ borderRadius: 6 }} />
          ))}
        </Space>
      )}

      {request.realPrompt && (
        <Paragraph type="secondary" style={{ marginBottom: 12 }}>
          <Text strong>Real prompt (from bundle): </Text>
          <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>{request.realPrompt}</Text>
        </Paragraph>
      )}

      {request.status === 'processing' && (
        <Space align="center">
          <Spin size="small" />
          <Text type="secondary">Analyzing feedback against the current framework…</Text>
        </Space>
      )}

      {request.status === 'failed' && (
        <Alert
          type="error"
          showIcon
          message="Diagnosis failed"
          description={request.errors?.map((e) => e.message).join('; ') || 'Unknown error'}
        />
      )}

      {request.status === 'diagnosed' && (
        <>
          {request.diagnosis?.summary && (
            <Paragraph type="secondary" style={{ marginBottom: 12 }}>
              <Tag>{request.diagnosis.scope}</Tag> {request.diagnosis.summary}
            </Paragraph>
          )}
          {request.diagnosis?.targets?.length ? (
            request.diagnosis.targets.map((target, index) => (
              <TargetCard key={index} requestId={request._id} target={target} targetIndex={index} />
            ))
          ) : (
            <Empty description="No framework file was identified as relevant" />
          )}
        </>
      )}
    </Card>
  )
}

export function GenericFeedbackList() {
  const { data: requests = [], isLoading } = useL1GenericFeedbackList()

  if (!isLoading && requests.length === 0) {
    return <Empty description="No generic feedback submitted yet" />
  }

  return (
    <div>
      {requests.map((request) => (
        <RequestCard key={request._id} request={request} />
      ))}
    </div>
  )
}
