import { useState } from 'react'
import { Alert, Button, Card, DatePicker, Progress, Radio, Space, Spin, Tag, Typography } from 'antd'
import { PlayCircleOutlined, DownloadOutlined } from '@ant-design/icons'
import { useRunBztSportsAutoBatch, useL1FeedbackBatch } from '../../hooks/useL1FeedbackBatches.js'
import { useDownloadL1PayloadFeedbackDeck } from '../../hooks/useL1FeedbackDeck.js'

const { Title, Text, Paragraph } = Typography
const { RangePicker } = DatePicker

const WINDOW_PRESETS = [
  { key: '24h', label: 'Last 24 hours', windowHours: 24 },
  { key: '48h', label: 'Last 48 hours', windowHours: 48 },
  { key: '7d', label: 'Last 7 days', windowHours: 24 * 7 },
  { key: 'custom', label: 'Custom range' },
]

// Mirrors L1FeedbackUploadPanel's private BatchProgress rendering pattern
// (Card + Spin + Progress + stat Tags) so a running auto-run batch looks
// the same here as it does on the main L1 Feedback batch tab.
const PHASE_LABELS = {
  ingesting: 'Ingesting fetched configs',
  diagnosing_skus: 'Diagnosing SKUs one by one (SKU-level RCA)',
  batch_rca: 'Clustering issues across the batch (batch-level RCA)',
  reconciling: 'Deduplicating + conflict-checking (merging batch-level and SKU-level results)',
}

function AutoRunBatchProgress({ batchId }) {
  const { data: batch } = useL1FeedbackBatch(batchId)
  if (!batch) return null

  if (batch.status !== 'processing') {
    return (
      <Card size="small" style={{ marginTop: 16 }}>
        <Text strong>Batch {batch._id} — {batch.status}</Text>
        <Space wrap style={{ marginTop: 8 }}>
          <Tag color="green">{batch.diagnosedSkuIds?.length ?? 0} diagnosed</Tag>
          <Tag color="red">{batch.rejectedSkuIds?.length ?? 0} rejected</Tag>
          {batch.errors?.length > 0 && <Tag color="volcano">{batch.errors.length} errored</Tag>}
        </Space>
        {batch.status === 'diagnosed' && (
          <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
            Reconciled issues are ready for HITL review.
          </Paragraph>
        )}
      </Card>
    )
  }

  const done = (batch.diagnosedSkuIds?.length ?? 0) + (batch.rejectedSkuIds?.length ?? 0)
  const total = batch.totalSkus || 1
  const percent = Math.round((done / total) * 100)

  return (
    <Card size="small" style={{ marginTop: 16 }}>
      <Space align="center">
        <Spin size="small" />
        <Text strong>Processing batch {batch._id}…</Text>
      </Space>
      {batch.currentPhase && (
        <Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 8 }}>
          {PHASE_LABELS[batch.currentPhase] || batch.currentPhase}
          {batch.currentPhase === 'diagnosing_skus' && batch.currentlyProcessingSkuId && (
            <> — sending SKU <code>{batch.currentlyProcessingSkuId}</code></>
          )}
        </Paragraph>
      )}
      <Progress percent={percent} status="active" />
    </Card>
  )
}

/** One-click BZT Sports feedback pipeline: pick a time window, fetch
 * reworked SKUs from Phoenix, and run them straight through the same
 * SKU-RCA -> batch-RCA -> dedup/conflict-check pipeline the manual batch
 * upload uses. The deck email is best-effort -- shown here regardless of
 * outcome, with a manual download fallback via the existing feedback-deck
 * route. */
export function BztSportsAutoRunCard() {
  const [preset, setPreset] = useState('24h')
  const [customRange, setCustomRange] = useState(null)
  const [result, setResult] = useState(null)

  const runAutoBatch = useRunBztSportsAutoBatch()
  const downloadDeck = useDownloadL1PayloadFeedbackDeck()

  const handleRun = () => {
    const activePreset = WINDOW_PRESETS.find((p) => p.key === preset)
    const window =
      preset === 'custom' && customRange
        ? { startTime: customRange[0].toISOString(), endTime: customRange[1].toISOString() }
        : { windowHours: activePreset.windowHours }

    runAutoBatch.mutate(window, {
      onSuccess: ({ data }) => setResult(data),
    })
  }

  const canRun = preset !== 'custom' || (customRange && customRange.length === 2)

  return (
    <Card>
      <Title level={4} style={{ marginTop: 0 }}>
        BZT Sports feedback run
      </Title>
      <Paragraph type="secondary">
        Fetches every BZT Sports SKU/angle/variant flagged for rework (variant regenerate, image
        regenerate, manual prompt update) in the chosen window, emails the feedback deck, and runs
        it through SKU-level RCA → batch-level RCA → dedup/conflict-check.
      </Paragraph>

      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Radio.Group value={preset} onChange={(e) => setPreset(e.target.value)}>
          <Space direction="vertical">
            {WINDOW_PRESETS.map((p) => (
              <Radio key={p.key} value={p.key}>
                {p.label}
              </Radio>
            ))}
          </Space>
        </Radio.Group>

        {preset === 'custom' && (
          <RangePicker showTime value={customRange} onChange={setCustomRange} />
        )}

        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          loading={runAutoBatch.isPending}
          disabled={!canRun}
          onClick={handleRun}
        >
          Run feedback
        </Button>

        {result && (
          <Alert
            type={result.batchId ? 'success' : 'info'}
            showIcon
            message={
              result.batchId
                ? `${result.skuCount} SKU(s) fetched — deck ready below${result.deckEmailed ? ' (also emailed)' : ''}`
                : result.message
            }
            action={
              result.sessionId && (
                <Button
                  size="small"
                  icon={<DownloadOutlined />}
                  loading={downloadDeck.isPending}
                  onClick={() => downloadDeck.mutate(result.sessionId)}
                >
                  Download deck
                </Button>
              )
            }
          />
        )}

        {result?.batchId && <AutoRunBatchProgress batchId={result.batchId} />}
      </Space>
    </Card>
  )
}
