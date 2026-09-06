import { useRef, useState } from 'react'
import { Button, Card, Input, Space, Tag, Typography, message } from 'antd'
import { CloseCircleFilled, FileZipOutlined, PictureOutlined, SendOutlined } from '@ant-design/icons'
import { useSubmitL1GenericFeedback, useSubmitL1GenericFeedbackZip } from '../../hooks/useL1GenericFeedback.js'

const { TextArea } = Input
const { Text } = Typography

let nextLocalId = 0

export function GenericFeedbackComposer() {
  const [text, setText] = useState('')
  const [attachments, setAttachments] = useState([]) // [{ id, file, previewUrl }]
  const [zipFile, setZipFile] = useState(null)
  const submit = useSubmitL1GenericFeedback()
  const submitZip = useSubmitL1GenericFeedbackZip()
  const fileInputRef = useRef(null)
  const zipInputRef = useRef(null)

  function addFiles(fileList) {
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'))
    if (!files.length) return
    setZipFile(null)
    setAttachments((prev) => [
      ...prev,
      ...files.map((file) => ({ id: nextLocalId++, file, previewUrl: URL.createObjectURL(file) })),
    ])
  }

  function removeAttachment(id) {
    setAttachments((prev) => {
      const target = prev.find((a) => a.id === id)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((a) => a.id !== id)
    })
  }

  function handleZipSelected(file) {
    if (!file) return
    attachments.forEach((a) => URL.revokeObjectURL(a.previewUrl))
    setAttachments([])
    setZipFile(file)
  }

  function handlePaste(e) {
    const items = Array.from(e.clipboardData?.items || [])
    const imageFiles = items
      .filter((item) => item.type.startsWith('image/'))
      .map((item) => item.getAsFile())
      .filter(Boolean)
    if (imageFiles.length) {
      e.preventDefault()
      addFiles(imageFiles)
    }
  }

  const isPending = submit.isPending || submitZip.isPending

  async function handleSubmit() {
    if (!text.trim()) {
      message.warning('Describe the framework requirement or issue first')
      return
    }
    if (zipFile) {
      await submitZip.mutateAsync({ text: text.trim(), bundleFile: zipFile })
      setZipFile(null)
    } else {
      await submit.mutateAsync({ text: text.trim(), files: attachments.map((a) => a.file) })
      attachments.forEach((a) => URL.revokeObjectURL(a.previewUrl))
      setAttachments([])
    }
    setText('')
  }

  return (
    <Card size="small">
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Text type="secondary">
          Describe a framework-level requirement in your own words — no need to know which file it
          belongs in. Paste (Ctrl/Cmd+V) or attach example images, or attach a generation-bundle ZIP
          (metadata.json + output image) for richer diagnosis against the real prompt that was used.
        </Text>

        {attachments.length > 0 && (
          <Space wrap size="small">
            {attachments.map((a) => (
              <div key={a.id} style={{ position: 'relative' }}>
                <img
                  src={a.previewUrl}
                  alt="attachment preview"
                  style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 6, border: '1px solid #f0f0f0' }}
                />
                <CloseCircleFilled
                  onClick={() => removeAttachment(a.id)}
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    background: '#fff',
                    borderRadius: '50%',
                    color: '#ff4d4f',
                    fontSize: 16,
                    cursor: 'pointer',
                  }}
                />
              </div>
            ))}
          </Space>
        )}

        {zipFile && (
          <Tag
            icon={<FileZipOutlined />}
            closable
            onClose={() => setZipFile(null)}
            color="blue"
            style={{ width: 'fit-content' }}
          >
            {zipFile.name}
          </Tag>
        )}

        <TextArea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPaste={handlePaste}
          placeholder='e.g. "Body pixel ratio to face pixel ratio must always be 7.5." — paste an image with Ctrl/Cmd+V if you have one'
          autoSize={{ minRows: 3, maxRows: 8 }}
        />

        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Button icon={<PictureOutlined />} disabled={Boolean(zipFile)} onClick={() => fileInputRef.current?.click()}>
              Attach image(s)
            </Button>
            <Button
              icon={<FileZipOutlined />}
              disabled={attachments.length > 0}
              onClick={() => zipInputRef.current?.click()}
            >
              Attach ZIP bundle
            </Button>
          </Space>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              addFiles(e.target.files)
              e.target.value = ''
            }}
          />
          <input
            ref={zipInputRef}
            type="file"
            accept=".zip,application/zip"
            style={{ display: 'none' }}
            onChange={(e) => {
              handleZipSelected(e.target.files?.[0])
              e.target.value = ''
            }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            loading={isPending}
            disabled={!text.trim()}
            onClick={handleSubmit}
          >
            Submit feedback
          </Button>
        </Space>
      </Space>
    </Card>
  )
}
