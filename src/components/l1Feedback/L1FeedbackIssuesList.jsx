import { useState } from 'react'
import { Button, Card, Empty, Flex, Image, Input, Popconfirm, Space, Tag, Typography } from 'antd'
import { CheckOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons'
import { useL1FeedbackIssues, useSubmitL1FeedbackIssueDecision } from '../../hooks/useL1FeedbackIssues.js'
import { CandidateBlock } from './CandidateBlock.jsx'

const { Text, Paragraph } = Typography

function IssueCard({ issue }) {
  const submitDecision = useSubmitL1FeedbackIssueDecision()
  const [customText, setCustomText] = useState('')
  const [showCustom, setShowCustom] = useState(false)

  function decide(decision, extra = {}) {
    submitDecision.mutate({
      skuId: issue.skuId,
      clientAngleId: issue.clientAngleId,
      variantIndex: issue.variantIndex,
      decision,
      ...extra,
    })
  }

  return (
    <Card
      size="small"
      title={
        <Space wrap>
          <Tag color="blue">{issue.skuId}</Tag>
          <Tag>{issue.angleName}</Tag>
          <Tag>variant {issue.variantIndex}</Tag>
          {issue.depth > 0 && <Tag color="purple">reopen #{issue.depth}</Tag>}
        </Space>
      }
      style={{ marginBottom: 16 }}
    >
      <Flex gap="middle" align="flex-start" wrap="wrap" style={{ marginBottom: 12 }}>
        {issue.imageUrl && (
          <Image
            src={issue.imageUrl}
            alt="Faulty render"
            width={160}
            style={{ borderRadius: 8, border: '1px solid #f0f0f0' }}
          />
        )}
        <div style={{ flex: 1, minWidth: 240 }}>
          <Paragraph style={{ marginBottom: 8 }}>
            <Text strong>Feedback: </Text>
            {issue.feedback.text}
          </Paragraph>
          {issue.imageUrl && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              This is the actual faulty render RCA visually inspected alongside the feedback and ground truth.
            </Text>
          )}
        </div>
      </Flex>
      <Paragraph>
        <Text strong>Inferred error: </Text>
        {issue.feedback.inferredError}
      </Paragraph>
      <Paragraph>
        <Text strong>Inferred fix: </Text>
        {issue.feedback.inferredFix}
      </Paragraph>
      <Paragraph>
        <Text strong>Concerned file: </Text>
        {issue.concernedFile} <Text type="secondary">({issue.concernedLocation})</Text>
      </Paragraph>

      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <CandidateBlock label="Candidate 0" candidate={issue.candidates.candidate_0} />
        <CandidateBlock label="Candidate 1" candidate={issue.candidates.candidate_1} />
      </Space>

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
    </Card>
  )
}

export function L1FeedbackIssuesList() {
  const { data: issues = [], isLoading } = useL1FeedbackIssues()

  if (!isLoading && issues.length === 0) {
    return <Empty description="No open issues awaiting a decision" />
  }

  return (
    <div>
      {issues.map((issue) => (
        <IssueCard key={`${issue.skuId}-${issue.clientAngleId}-${issue.variantIndex}-${issue.depth}`} issue={issue} />
      ))}
    </div>
  )
}
