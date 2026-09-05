import { FolderOpenOutlined, InboxOutlined } from '@ant-design/icons'
import { Alert, Button, Flex, Progress, Typography, message } from 'antd'
import { Select } from '../common/Select.jsx'
import { useEffect, useRef, useState } from 'react'
import { useAllClients } from '../../hooks/useClients.js'
import {
  ALLOWED_IMAGE_ACCEPT,
  allowedImageRejectMessage,
} from '../../utils/allowedImageFormats.js'
import {
  EXAMPLE_IMAGE_TYPES,
  EXAMPLE_IMAGE_TYPE_LABELS,
} from '../../utils/exampleImageConstants.js'
import {
  isExampleImageFile,
  runBulkExampleImageUploadPipeline,
} from '../../utils/exampleImageUploadPipeline.js'

const { Text, Paragraph } = Typography
const MAX_FAILURES_SHOWN = 30

function collectImageFiles(fileList) {
  return Array.from(fileList).filter(isExampleImageFile)
}

export function BulkExampleImageUploadPanel({ onUploadComplete }) {
  const [client, setClient] = useState(undefined)
  const [defaultType, setDefaultType] = useState('good')
  const [defaultTags, setDefaultTags] = useState([])
  const [pendingFiles, setPendingFiles] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(null)
  const [result, setResult] = useState(null)

  const fileInputRef = useRef(null)
  const folderInputRef = useRef(null)
  const cancelRef = useRef(false)

  const { data: clients = [] } = useAllClients()

  const canStart = Boolean(client) && pendingFiles.length > 0 && !isUploading

  useEffect(() => {
    if (!isUploading) {
      return undefined
    }

    function handleBeforeUnload(event) {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isUploading])

  function handleFilesSelected(fileList) {
    const all = Array.from(fileList)
    const images = collectImageFiles(fileList)
    if (images.length === 0) {
      if (all.length > 0) {
        message.error(allowedImageRejectMessage(all[0].name))
      }
      return
    }
    setPendingFiles(images)
    setResult(null)
    setProgress(null)
  }

  function handlePickFiles() {
    fileInputRef.current?.click()
  }

  function handlePickFolder() {
    folderInputRef.current?.click()
  }

  async function handleStartUpload() {
    if (!canStart) {
      return
    }

    cancelRef.current = false
    setIsUploading(true)
    setResult(null)
    setProgress({
      succeeded: 0,
      failed: 0,
      total: pendingFiles.length,
      batchIndex: 0,
      batchCount: 0,
      currentFileName: null,
    })

    try {
      const summary = await runBulkExampleImageUploadPipeline({
        client,
        type: defaultType,
        tags: defaultTags,
        files: pendingFiles,
        shouldCancel: () => cancelRef.current,
        onProgress: (next) => {
          setProgress({
            succeeded: next.succeeded,
            failed: next.failed,
            total: next.total,
            batchIndex: next.batchIndex ?? 0,
            batchCount: next.batchCount ?? 0,
            currentFileName: next.currentFileName ?? null,
          })
        },
      })

      setResult(summary)

      if (summary.succeeded > 0) {
        onUploadComplete?.()
      }

      if (!summary.cancelled && summary.failed === 0) {
        setPendingFiles([])
      }
    } finally {
      setIsUploading(false)
      cancelRef.current = false
    }
  }

  function handleCancel() {
    cancelRef.current = true
  }

  const percent =
    progress && progress.total > 0
      ? Math.round(((progress.succeeded + progress.failed) / progress.total) * 100)
      : 0

  const failuresToShow = result?.failures?.slice(0, MAX_FAILURES_SHOWN) ?? []

  return (
    <Flex vertical gap="middle">
      <Alert
        type="info"
        showIcon
        message="Bulk upload"
        description="Upload hundreds or thousands of images with aggregate progress only — no per-file preview or thumbnail wait. Keep this browser tab open until finished. Thumbnails generate in the background."
      />

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

      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_IMAGE_ACCEPT}
        multiple
        hidden
        disabled={isUploading}
        onChange={(event) => {
          handleFilesSelected(event.target.files)
          event.target.value = ''
        }}
      />
      <input
        ref={folderInputRef}
        type="file"
        accept={ALLOWED_IMAGE_ACCEPT}
        hidden
        disabled={isUploading}
        webkitdirectory=""
        multiple
        onChange={(event) => {
          handleFilesSelected(event.target.files)
          event.target.value = ''
        }}
      />

      <Flex gap="middle" wrap="wrap">
        <Button icon={<InboxOutlined />} onClick={handlePickFiles} disabled={isUploading}>
          Select files
        </Button>
        <Button icon={<FolderOpenOutlined />} onClick={handlePickFolder} disabled={isUploading}>
          Select folder
        </Button>
      </Flex>

      {pendingFiles.length > 0 && (
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          {pendingFiles.length.toLocaleString()} image(s) ready
          {isUploading && progress?.batchCount
            ? ` · batch ${progress.batchIndex} of ${progress.batchCount}`
            : ''}
          {progress?.currentFileName ? ` · ${progress.currentFileName}` : ''}
        </Paragraph>
      )}

      {isUploading && progress && (
        <Progress percent={percent} status="active" />
      )}

      {isUploading && progress && (
        <Text>
          {progress.succeeded.toLocaleString()} succeeded · {progress.failed.toLocaleString()} failed ·{' '}
          {progress.total.toLocaleString()} total
        </Text>
      )}

      {result && (
        <Alert
          type={result.cancelled ? 'warning' : result.failed > 0 ? 'warning' : 'success'}
          showIcon
          message={
            result.cancelled
              ? 'Upload cancelled'
              : result.failed > 0
                ? 'Upload finished with errors'
                : 'Upload complete'
          }
          description={
            <>
              {result.succeeded.toLocaleString()} uploaded
              {result.failed > 0 ? `, ${result.failed.toLocaleString()} failed` : ''}
              {result.skipped > 0 ? `, ${result.skipped.toLocaleString()} non-image files skipped` : ''}
              {result.cancelled ? ' (stopped between batches)' : ''}
              . Thumbnails will appear in the grid as they are generated.
            </>
          }
        />
      )}

      {failuresToShow.length > 0 && (
        <div>
          <Text type="secondary">Recent failures</Text>
          <ul style={{ margin: '8px 0 0', paddingLeft: 20, maxHeight: 160, overflow: 'auto' }}>
            {failuresToShow.map((entry) => (
              <li key={entry.name}>
                <Text code>{entry.name}</Text> — {entry.error}
              </li>
            ))}
          </ul>
          {(result?.failures?.length ?? 0) > MAX_FAILURES_SHOWN && (
            <Text type="secondary">
              …and {(result.failures.length - MAX_FAILURES_SHOWN).toLocaleString()} more
            </Text>
          )}
        </div>
      )}

      <Flex gap="small">
        {pendingFiles.length > 0 && (
          <Button onClick={() => setPendingFiles([])} disabled={isUploading}>
            Clear selection
          </Button>
        )}
        {isUploading ? (
          <Button danger onClick={handleCancel}>
            Cancel after current batch
          </Button>
        ) : (
          <Button type="primary" onClick={handleStartUpload} disabled={!canStart}>
            Start bulk upload
          </Button>
        )}
      </Flex>

      {!client && pendingFiles.length > 0 && (
        <Alert type="warning" showIcon message="Select a client before uploading." />
      )}
    </Flex>
  )
}
