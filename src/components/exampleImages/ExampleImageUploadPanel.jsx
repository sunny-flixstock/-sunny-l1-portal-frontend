import { InboxOutlined } from '@ant-design/icons'
import { Alert, Button, Flex, Progress, Table, Tag, Typography, Upload, message } from 'antd'
import { Select } from '../common/Select.jsx'
import { useState } from 'react'
import { useAllClients } from '../../hooks/useClients.js'
import { useBatchUpdateExampleImages } from '../../hooks/useExampleImages.js'
import {
  ALLOWED_IMAGE_ACCEPT,
  ALLOWED_IMAGE_FORMAT_LABEL,
  allowedImageRejectMessage,
} from '../../utils/allowedImageFormats.js'
import {
  EXAMPLE_IMAGE_TYPES,
  EXAMPLE_IMAGE_TYPE_LABELS,
  UPLOAD_STATUS,
  UPLOAD_STATUS_LABELS,
} from '../../utils/exampleImageConstants.js'
import { runExampleImageUploadPipeline, isExampleImageFile } from '../../utils/exampleImageUploadPipeline.js'
import { RecentUploadReviewModal } from './RecentUploadReviewModal.jsx'

const { Dragger } = Upload
const { Text } = Typography
export function ExampleImageUploadPanel({ onUploadComplete }) {
  const [client, setClient] = useState(undefined)
  const [defaultType, setDefaultType] = useState('good')
  const [defaultTags, setDefaultTags] = useState([])
  const [queue, setQueue] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [reviewImages, setReviewImages] = useState([])
  const [reviewOpen, setReviewOpen] = useState(false)

  const { data: clients = [] } = useAllClients()
  const batchUpdate = useBatchUpdateExampleImages()

  const canUpload = Boolean(client) && queue.length > 0 && !isUploading

  async function handleStartUpload() {
    if (!canUpload) {
      return
    }

    setIsUploading(true)

    try {
      const files = queue.map((item) => item.file)

      const { items, uploaded } = await runExampleImageUploadPipeline({
        client,
        type: defaultType,
        tags: defaultTags,
        files,
        onItemUpdate: (nextItems) => {
          setQueue((current) =>
            current.map((row, index) => {
              const entry = nextItems[index]
              if (!entry) {
                return row
              }
              return {
                ...row,
                status: entry.status,
                progress: entry.progress,
                error: entry.error,
              }
            }),
          )
        },
      })

      const failed = items.filter((item) => item.status === UPLOAD_STATUS.ERROR)
      if (uploaded.length > 0) {
        setReviewImages(uploaded)
        setReviewOpen(true)
        onUploadComplete?.()
      }

      if (failed.length > 0 && uploaded.length === 0) {
        return
      }

      if (failed.length === 0) {
        setQueue([])
      }
    } finally {
      setIsUploading(false)
    }
  }

  async function handleReviewSave(updates) {
    await batchUpdate.mutateAsync(updates)
  }

  const progressColumns = [
    {
      title: 'File',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: 'Status',
      key: 'status',
      width: 160,
      render: (_, row) => (
        <Tag
          color={
            row.status === UPLOAD_STATUS.ERROR
              ? 'error'
              : row.status === UPLOAD_STATUS.DONE
                ? 'success'
                : 'processing'
          }
        >
          {UPLOAD_STATUS_LABELS[row.status] ?? row.status}
        </Tag>
      ),
    },
    {
      title: 'Progress',
      key: 'progress',
      width: 180,
      render: (_, row) => (
        <Progress
          percent={row.progress ?? 0}
          size="small"
          status={row.status === UPLOAD_STATUS.ERROR ? 'exception' : undefined}
        />
      ),
    },
    {
      title: 'Error',
      dataIndex: 'error',
      key: 'error',
      ellipsis: true,
      render: (value) => value || '—',
    },
  ]

  return (
    <>
      <Flex vertical gap="middle">
        <Flex wrap="wrap" gap="middle" align="flex-end">
          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
              Client
            </Text>
            <Select
              showSearch
              placeholder="Select client"
              value={client}
              onChange={setClient}
              style={{ width: 200 }}
              options={clients.map((entry) => ({
                value: entry.code,
                label: entry.code,
              }))}
              disabled={isUploading}
            />
          </div>
          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
              Default type
            </Text>
            <Select
              value={defaultType}
              onChange={setDefaultType}
              style={{ width: 140 }}
              disabled={isUploading}
              options={EXAMPLE_IMAGE_TYPES.map((value) => ({
                value,
                label: EXAMPLE_IMAGE_TYPE_LABELS[value],
              }))}
            />
          </div>
          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
              Default tags
            </Text>
            <Select
              mode="tags"
              value={defaultTags}
              onChange={setDefaultTags}
              placeholder="Optional tags"
              style={{ minWidth: 220 }}
              tokenSeparators={[',']}
              disabled={isUploading}
            />
          </div>
        </Flex>

        <Dragger
          multiple
          accept={ALLOWED_IMAGE_ACCEPT}
          disabled={isUploading}
          beforeUpload={(file) => {
            if (!isExampleImageFile(file)) {
              message.error(allowedImageRejectMessage(file.name))
              return Upload.LIST_IGNORE
            }
            setQueue((current) => {
              if (current.length >= 50) {
                return current
              }
              return [
                ...current,
                {
                  uid: `${file.uid}-${file.name}`,
                  name: file.name,
                  file,
                  status: UPLOAD_STATUS.QUEUED,
                  progress: 0,
                  error: null,
                },
              ]
            })
            return false
          }}
          showUploadList={false}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Click or drag images to upload</p>
          <p className="ant-upload-hint">
            {ALLOWED_IMAGE_FORMAT_LABEL} only. Images upload one at a time (2 concurrent) for stability. Max 50 per batch.
          </p>
        </Dragger>

        {queue.length > 0 && (
          <>
            <Flex justify="space-between" align="center">
              <Text>{queue.length} file(s) queued</Text>
              <Flex gap="small">
                <Button onClick={() => setQueue([])} disabled={isUploading}>
                  Clear queue
                </Button>
                <Button type="primary" onClick={handleStartUpload} loading={isUploading} disabled={!canUpload}>
                  Upload all
                </Button>
              </Flex>
            </Flex>
            <Table
              rowKey="uid"
              size="small"
              pagination={false}
              columns={progressColumns}
              dataSource={queue}
              scroll={{ y: 200 }}
            />
          </>
        )}

        {!client && queue.length > 0 && (
          <Alert type="warning" showIcon message="Select a client before uploading." />
        )}
      </Flex>

      <RecentUploadReviewModal
        open={reviewOpen}
        images={reviewImages}
        onClose={() => {
          setReviewOpen(false)
          setReviewImages([])
        }}
        onSave={handleReviewSave}
      />
    </>
  )
}
