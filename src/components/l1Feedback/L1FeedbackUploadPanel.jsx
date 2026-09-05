import { useEffect, useRef, useState } from 'react'
import { Alert, Button, Card, List, Progress, Space, Spin, Tag, Typography, Upload, message, notification } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import { useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useCreateL1FeedbackBatch, useL1FeedbackBatch } from '../../hooks/useL1FeedbackBatches.js'
import { l1FeedbackIssueKeys } from '../../hooks/useL1FeedbackIssues.js'

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

async function filesToConfigs(fileList) {
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
    configs.push({ skuId, config: parsed })
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

export function L1FeedbackUploadPanel() {
  const [pendingFiles, setPendingFiles] = useState([])
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
    setBatchId(null)
  }

  async function handleProcess() {
    try {
      const configs = await filesToConfigs(pendingFiles)
      const response = await createBatch.mutateAsync(configs)
      setBatchId(response.data._id)
    } catch (err) {
      message.error(err.message || 'Failed to build upload payload')
    }
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
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
            renderItem={(f) => <List.Item>{f.name}</List.Item>}
            style={{ maxHeight: 200, overflow: 'auto' }}
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
