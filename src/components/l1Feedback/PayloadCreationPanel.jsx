import { useRef, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  List,
  Progress,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd'
import {
  CheckCircleOutlined,
  DownloadOutlined,
  EyeOutlined,
  ExportOutlined,
  FileZipOutlined,
  InboxOutlined,
} from '@ant-design/icons'
import { useSearchParams } from 'react-router-dom'
import {
  useCreateL1PayloadSession,
  useL1PayloadSession,
  useL1PayloadSessionFiles,
  useDownloadL1PayloadSessionZip,
} from '../../hooks/useL1PayloadSession.js'

const { Text, Paragraph } = Typography
const { Dragger } = Upload

/** Reads the raw folder of <skuId>.json configs (no feedback embedded) +
 * one feedback PPT/DOC, stages them into a dated, feedback-merged folder
 * server-side, and shows live progress -- the automated counterpart to the
 * `.claude/skills/l1-feedback` day-folder convention, but reachable from
 * the portal instead of only a local agent run. Never auto-submits
 * anywhere: the result is a review table you inspect, then either
 * download or hand off to "SKU config upload" yourself. */
export function PayloadCreationPanel({ onSendToSkuUpload, onVerifyFeedback }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const sessionId = searchParams.get('payloadSessionId')
  const setSessionId = (id) => {
    const next = new URLSearchParams(searchParams)
    if (id) next.set('payloadSessionId', id)
    else next.delete('payloadSessionId')
    setSearchParams(next)
  }

  const [pendingFiles, setPendingFiles] = useState([])
  const [feedbackDoc, setFeedbackDoc] = useState(null)
  const dirInputRef = useRef(null)
  const createSession = useCreateL1PayloadSession()
  const { data: session } = useL1PayloadSession(sessionId)
  const { data: files = [] } = useL1PayloadSessionFiles(sessionId, session?.status === 'completed')
  const downloadZip = useDownloadL1PayloadSessionZip()

  function handleFilesPicked(fileList) {
    const jsonFiles = Array.from(fileList).filter((f) => f.name.toLowerCase().endsWith('.json'))
    if (!jsonFiles.length) {
      message.warning('No .json files found in that selection')
      return
    }
    setPendingFiles(jsonFiles)
  }

  function handleDocPicked(file) {
    const lower = file.name.toLowerCase()
    if (!lower.endsWith('.pptx') && !lower.endsWith('.docx')) {
      message.error('Feedback doc must be a .pptx or .docx file')
      return false
    }
    setFeedbackDoc(file)
    return false // never let antd auto-upload
  }

  async function handleCreate() {
    if (!pendingFiles.length) {
      message.warning('Add a folder of raw <skuId>.json configs first')
      return
    }
    if (!feedbackDoc) {
      message.warning('Add the feedback PPT/DOC first')
      return
    }
    try {
      const response = await createSession.mutateAsync({ files: pendingFiles, feedbackDoc })
      setSessionId(response.data._id)
    } catch (err) {
      message.error(err.message || 'Failed to create payload session')
    }
  }

  const total = session?.totalSkus || 0
  const done = (session?.matchedCount ?? 0) + (session?.unmatchedCount ?? 0)
  const percent = total ? Math.round((done / total) * 100) : 0

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {!sessionId && (
        <>
          <Card size="small" title="1. Raw SKU configs (no feedback yet)">
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
            {pendingFiles.length > 0 && (
              <Paragraph style={{ marginTop: 12, marginBottom: 0 }}>
                <Text strong>{pendingFiles.length}</Text> file(s) ready.
              </Paragraph>
            )}
          </Card>

          <Card size="small" title="2. Feedback PPT/DOC (SKU ID → angle → variant → feedback)">
            <Upload.Dragger multiple={false} showUploadList={feedbackDoc ? [{ name: feedbackDoc.name }] : false} beforeUpload={handleDocPicked}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Drag &amp; drop the feedback .pptx or .docx here, or click to browse</p>
            </Upload.Dragger>
          </Card>

          <Button
            type="primary"
            loading={createSession.isPending}
            disabled={!pendingFiles.length || !feedbackDoc}
            onClick={handleCreate}
          >
            Create payload
          </Button>
        </>
      )}

      {session && session.status === 'processing' && (
        <Card size="small">
          <Space align="center" style={{ marginBottom: 8 }}>
            <Spin size="small" />
            <Text strong>Building input_payload/{session.date}…</Text>
          </Space>
          <Progress percent={percent} status="active" />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {done} of {total || '?'} SKU(s) processed
            {session.events?.length ? ` — ${session.events[session.events.length - 1].type}` : ''}
          </Text>
        </Card>
      )}

      {session && session.status !== 'processing' && (
        <Card
          size="small"
          title={
            <Space>
              {session.status === 'completed' ? (
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
              ) : null}
              <span>
                input_payload/{session.date} — {session.status}
              </span>
            </Space>
          }
          extra={
            <Space>
              <Button size="small" icon={<DownloadOutlined />} loading={downloadZip.isPending} onClick={() => downloadZip.mutate(sessionId)}>
                Download ZIP
              </Button>
              <Button size="small" icon={<EyeOutlined />} onClick={() => onVerifyFeedback?.(sessionId)}>
                Verify Feedback
              </Button>
              <Button
                size="small"
                type="primary"
                icon={<ExportOutlined />}
                onClick={() => onSendToSkuUpload?.(sessionId)}
              >
                Send to SKU config upload
              </Button>
            </Space>
          }
        >
          <Paragraph>
            <Tag color="green">{session.matchedCount} matched</Tag>
            <Tag color="orange">{session.unmatchedCount} unmatched</Tag>
            {session.errors?.length > 0 && <Tag color="red">{session.errors.length} error(s)</Tag>}
          </Paragraph>
          {session.errors?.length > 0 && (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 12 }}
              message="Some files could not be processed"
              description={
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {session.errors.map((e, i) => (
                    <li key={i}>
                      {e.skuId ? <Tag>{e.skuId}</Tag> : null} {e.message}
                    </li>
                  ))}
                </ul>
              }
            />
          )}
          <Table
            size="small"
            rowKey="_id"
            dataSource={files}
            pagination={false}
            columns={[
              { title: 'SKU', dataIndex: 'skuId', key: 'skuId' },
              {
                title: 'Feedback merged',
                dataIndex: 'matchedFeedbackCount',
                key: 'matchedFeedbackCount',
                render: (count) => (
                  <Tag color={count > 0 ? 'green' : 'default'}>{count} item(s)</Tag>
                ),
              },
              {
                title: 'Warnings',
                dataIndex: 'warnings',
                key: 'warnings',
                render: (warnings) =>
                  warnings?.length ? (
                    <List
                      size="small"
                      dataSource={warnings}
                      renderItem={(w) => (
                        <List.Item style={{ padding: '2px 0', border: 'none', fontSize: 12 }}>{w}</List.Item>
                      )}
                    />
                  ) : (
                    <Text type="secondary">—</Text>
                  ),
              },
            ]}
          />
          <Button style={{ marginTop: 12 }} icon={<FileZipOutlined />} onClick={() => setSessionId(null)}>
            Start a new payload
          </Button>
        </Card>
      )}
    </Space>
  )
}
