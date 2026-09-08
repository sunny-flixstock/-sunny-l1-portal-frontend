import { useEffect, useRef, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Input,
  InputNumber,
  List,
  Progress,
  Space,
  Spin,
  Tag,
  Typography,
  Upload,
  message,
  notification,
} from 'antd'
import { InboxOutlined, MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useCreateL1FeedbackBatch, useL1FeedbackBatch } from '../../hooks/useL1FeedbackBatches.js'
import { l1FeedbackIssueKeys } from '../../hooks/useL1FeedbackIssues.js'
import { fetchL1PayloadSessionFilesWithContent } from '../../api/l1PayloadSessionApi.js'

const { Text, Paragraph } = Typography
const { Dragger } = Upload

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

/** `feedbackByFile` is keyed by file name -> [{ clientAngleId, variantIndex,
 * feedbackText }], for configs whose feedback wasn't already embedded in
 * the uploaded JSON -- the caller names exactly which angle/variant each
 * comment is about, no inference attempted. */
async function filesToConfigs(fileList, feedbackByFile) {
  const jsonFiles = fileList.filter((f) => f.name.toLowerCase().endsWith('.json'))
  const configs = []
  for (const file of jsonFiles) {
    const text = await readFileAsText(file)
    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      throw new Error(`${file.name} is not valid JSON`)
    }
    const skuId = file.name.replace(/\.json$/i, '')
    const entries = (feedbackByFile[file.name] || []).filter(
      (e) => e.clientAngleId?.trim() && e.variantIndex != null && e.feedbackText?.trim()
    )
    configs.push({
      skuId,
      config: parsed,
      ...(entries.length ? { feedbackEntries: entries } : {}),
    })
  }
  return configs
}

function BatchProgress({ batch }) {
  const done = (batch.diagnosedSkuIds?.length ?? 0) + (batch.rejectedSkuIds?.length ?? 0)
  const total = batch.totalSkus || 1
  const percent = Math.round((done / total) * 100)
  const pendingCount = total - done - (batch.errors?.length ?? 0)

  return (
    <Card size="small">
      <Space align="center" style={{ marginBottom: 8 }}>
        <Spin size="small" />
        <Text strong>Processing batch {batch._id}…</Text>
      </Space>
      <Progress percent={percent} status="active" />
      <Space wrap>
        <Tag color="green">{batch.diagnosedSkuIds?.length ?? 0} diagnosed</Tag>
        <Tag color="blue">{batch.rejectedSkuIds?.length ?? 0} rejected</Tag>
        <Tag color="red">{batch.errors?.length ?? 0} errored</Tag>
        <Tag>{Math.max(pendingCount, 0)} pending</Tag>
      </Space>
    </Card>
  )
}

/** Optional per-file feedback annotations for configs that don't already
 * carry embedded feedback.text -- the user names the exact angle/variant
 * each comment is about. */
function FeedbackAnnotations({ fileName, entries, onChange }) {
  const [expanded, setExpanded] = useState(false)

  function addRow() {
    onChange([...entries, { clientAngleId: '', variantIndex: null, feedbackText: '' }])
    setExpanded(true)
  }

  function updateRow(index, patch) {
    onChange(entries.map((e, i) => (i === index ? { ...e, ...patch } : e)))
  }

  function removeRow(index) {
    onChange(entries.filter((_, i) => i !== index))
  }

  if (!expanded && entries.length === 0) {
    return (
      <Button size="small" type="link" icon={<PlusOutlined />} onClick={addRow} style={{ paddingLeft: 0 }}>
        Add feedback (if not already in the file)
      </Button>
    )
  }

  return (
    <Space direction="vertical" size="small" style={{ width: '100%', marginTop: 8 }}>
      <Text type="secondary" style={{ fontSize: 12 }}>
        Name the exact clientAngleId + variantIndex this feedback is about — {fileName}
      </Text>
      {entries.map((entry, index) => (
        <Space key={index} align="start">
          <Input
            placeholder="clientAngleId"
            size="small"
            style={{ width: 160 }}
            value={entry.clientAngleId}
            onChange={(e) => updateRow(index, { clientAngleId: e.target.value })}
          />
          <InputNumber
            placeholder="variantIndex"
            size="small"
            min={0}
            style={{ width: 100 }}
            value={entry.variantIndex}
            onChange={(v) => updateRow(index, { variantIndex: v })}
          />
          <Input
            placeholder="Feedback text"
            size="small"
            style={{ width: 280 }}
            value={entry.feedbackText}
            onChange={(e) => updateRow(index, { feedbackText: e.target.value })}
          />
          <Button size="small" type="text" danger icon={<MinusCircleOutlined />} onClick={() => removeRow(index)} />
        </Space>
      ))}
      <Button size="small" type="link" icon={<PlusOutlined />} onClick={addRow} style={{ paddingLeft: 0 }}>
        Add another
      </Button>
    </Space>
  )
}

export function L1FeedbackUploadPanel() {
  const [pendingFiles, setPendingFiles] = useState([])
  const [feedbackByFile, setFeedbackByFile] = useState({}) // { [fileName]: [{clientAngleId, variantIndex, feedbackText}] }
  // Backed by the URL, not just component state, so a refresh mid-processing
  // (or reopening the tab later) doesn't lose track of the in-flight batch --
  // part of making every session recoverable, not just visible while mounted.
  const [searchParams, setSearchParams] = useSearchParams()
  const batchId = searchParams.get('batchId')
  const setBatchId = (id) => {
    const next = new URLSearchParams(searchParams)
    if (id) next.set('batchId', id)
    else next.delete('batchId')
    setSearchParams(next)
  }
  const createBatch = useCreateL1FeedbackBatch()
  const { data: batch } = useL1FeedbackBatch(batchId)
  const queryClient = useQueryClient()
  const dirInputRef = useRef(null)
  const notifiedRef = useRef(new Set())
  const importingPayloadSessionId = searchParams.get('fromPayloadSession')

  // One-shot handoff from the Payload Creation tab: fromPayloadSession names
  // a session whose already feedback-merged files should load here exactly
  // as if freshly dropped, so you can still inspect/tweak before clicking
  // Process -- never auto-submitted. Cleared immediately after loading so a
  // later refresh of this tab doesn't keep re-importing it. The param's own
  // presence (rather than a separate state flag) is what drives the loading
  // indicator below, so nothing sets state synchronously inside the effect.
  useEffect(() => {
    if (!importingPayloadSessionId) return
    fetchL1PayloadSessionFilesWithContent(importingPayloadSessionId)
      .then(({ data: files }) => {
        const asFiles = files.map((f) => new File([f.content], `${f.skuId}.json`, { type: 'application/json' }))
        setPendingFiles(asFiles)
        setFeedbackByFile({})
        message.success(`Loaded ${asFiles.length} file(s) from the payload session`)
      })
      .catch((err) => message.error(err.message || 'Failed to load payload session files'))
      .finally(() => {
        const next = new URLSearchParams(searchParams)
        next.delete('fromPayloadSession')
        setSearchParams(next)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importingPayloadSessionId])

  // Fire a completion notification exactly once per batch, the moment it
  // leaves 'processing' -- works even if the person has switched tabs
  // within this page, since polling keeps running as long as it's mounted.
  useEffect(() => {
    if (!batch || batch.status === 'processing' || notifiedRef.current.has(batch._id)) {
      return
    }
    notifiedRef.current.add(batch._id)
    queryClient.invalidateQueries({ queryKey: l1FeedbackIssueKeys.all })

    const diagnosedCount = batch.diagnosedSkuIds?.length ?? 0
    const rejectedCount = batch.rejectedSkuIds?.length ?? 0
    const errorCount = batch.errors?.length ?? 0

    notification[batch.status === 'failed' ? 'warning' : 'success']({
      message: batch.status === 'failed' ? 'Batch finished with errors' : 'Batch processing complete',
      description: `${diagnosedCount} diagnosed, ${rejectedCount} rejected, ${errorCount} error(s). Head to HITL Review to see open issues.`,
      placement: 'topRight',
      duration: 0,
    })
  }, [batch, queryClient])

  function handleFilesPicked(fileList) {
    const files = Array.from(fileList).filter((f) => f.name.toLowerCase().endsWith('.json'))
    if (!files.length) {
      message.warning('No .json files found in that selection')
      return
    }
    setPendingFiles(files)
    setFeedbackByFile({})
    setBatchId(null)
  }

  async function handleProcess() {
    try {
      const configs = await filesToConfigs(pendingFiles, feedbackByFile)
      const response = await createBatch.mutateAsync(configs)
      setBatchId(response.data._id)
    } catch (err) {
      message.error(err.message || 'Failed to build upload payload')
    }
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {importingPayloadSessionId && (
        <Alert type="info" showIcon icon={<Spin size="small" />} message="Loading files from the payload session…" />
      )}
      <Card size="small">
        <Dragger
          multiple
          showUploadList={false}
          beforeUpload={() => false}
          onChange={(info) => handleFilesPicked(info.fileList.map((f) => f.originFileObj))}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Drag &amp; drop &lt;skuId&gt;.json files here, or click to browse</p>
          <p className="ant-upload-hint">
            Or pick a whole folder —{' '}
            <a
              onClick={(e) => {
                e.preventDefault()
                dirInputRef.current?.click()
              }}
            >
              choose folder
            </a>
          </p>
        </Dragger>
        <input
          ref={dirInputRef}
          type="file"
          webkitdirectory=""
          directory=""
          multiple
          style={{ display: 'none' }}
          onChange={(e) => handleFilesPicked(e.target.files)}
        />
      </Card>

      {pendingFiles.length > 0 && !batchId && (
        <Card size="small" title={`${pendingFiles.length} file(s) ready`}>
          <List
            size="small"
            dataSource={pendingFiles}
            renderItem={(f) => (
              <List.Item style={{ display: 'block' }}>
                <Text>{f.name}</Text>
                <FeedbackAnnotations
                  fileName={f.name}
                  entries={feedbackByFile[f.name] || []}
                  onChange={(entries) => setFeedbackByFile((prev) => ({ ...prev, [f.name]: entries }))}
                />
              </List.Item>
            )}
            style={{ maxHeight: 360, overflow: 'auto' }}
          />
          <Button type="primary" loading={createBatch.isPending} onClick={handleProcess} style={{ marginTop: 12 }}>
            Process batch
          </Button>
        </Card>
      )}

      {batch && batch.status === 'processing' && <BatchProgress batch={batch} />}

      {batch && batch.status !== 'processing' && (
        <Card size="small" title={`Batch ${batch._id} — ${batch.status}`}>
          <Paragraph>
            <Text strong>SKUs diagnosed:</Text>{' '}
            {batch.diagnosedSkuIds?.length ? batch.diagnosedSkuIds.join(', ') : 'none'}
          </Paragraph>
          {batch.rejectedSkuIds?.length > 0 && (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 12 }}
              message={`${batch.rejectedSkuIds.length} SKU(s) rejected — no feedback found, not processed`}
              description={batch.rejectedSkuIds.join(', ')}
            />
          )}
          {batch.errors?.length > 0 && (
            <Alert
              type="warning"
              showIcon
              message={`${batch.errors.length} issue(s)`}
              description={
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {batch.errors.map((e, i) => (
                    <li key={i}>
                      <Tag>{e.skuId}</Tag> {e.message}
                    </li>
                  ))}
                </ul>
              }
            />
          )}
          {batch.status === 'diagnosed' && batch.diagnosedSkuIds?.length > 0 && (
            <Paragraph style={{ marginTop: 12 }}>
              Diagnosis complete — head to the <Text strong>HITL Review</Text> tab.
            </Paragraph>
          )}
        </Card>
      )}
    </Space>
  )
}
