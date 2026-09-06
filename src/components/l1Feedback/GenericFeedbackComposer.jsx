import { useRef, useState } from 'react'
import { Button, Card, Divider, Input, Space, Tag, Typography, message } from 'antd'
import { CloseCircleFilled, FileZipOutlined, PictureOutlined, SendOutlined } from '@ant-design/icons'
import { useSubmitL1GenericFeedback, useSubmitL1GenericFeedbackZip } from '../../hooks/useL1GenericFeedback.js'

const { TextArea } = Input
const { Text } = Typography

let nextLocalId = 0

function AttachmentGroup({ title, hint, color, items, onRemove }) {
  if (!items.length) return null
  return (
    <div>
      <Text type="secondary" style={{ fontSize: 12 }}>
        {title} ({items.length}) {hint}
      </Text>
      <div>
        <Space wrap size="small" style={{ marginTop: 4 }}>
          {items.map((a) => (
            <div key={a.id} style={{ position: 'relative' }}>
              <img
                src={a.previewUrl}
                alt={`${title} preview`}
                style={{
                  width: 72,
                  height: 72,
                  objectFit: 'cover',
                  borderRadius: 6,
                  border: `2px solid ${color}`,
                }}
              />
              <CloseCircleFilled
                onClick={() => onRemove(a.id)}
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
      </div>
    </div>
  )
}

export function GenericFeedbackComposer() {
  const [text, setText] = useState('')
  const [badImages, setBadImages] = useState([]) // [{ id, file, previewUrl }]
  const [goodImages, setGoodImages] = useState([])
  const [zipFile, setZipFile] = useState(null)
  const submit = useSubmitL1GenericFeedback()
  const submitZip = useSubmitL1GenericFeedbackZip()
  const badInputRef = useRef(null)
  const goodInputRef = useRef(null)
  const badFolderInputRef = useRef(null)
  const goodFolderInputRef = useRef(null)
  const zipInputRef = useRef(null)

  const hasImages = badImages.length > 0 || goodImages.length > 0

  // Every image in a group goes into the same vision-model call, so a
  // very large folder would be slow/expensive -- warn (not block) past a
  // sane bulk-example size, since a handful-to-a-dozen is exactly the
  // intended use.
  const SOFT_IMAGE_CAP = 15

  function addFiles(fileList, setGroup, groupLabel) {
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'))
    if (!files.length) return
    setZipFile(null)
    setGroup((prev) => {
      const next = [...prev, ...files.map((file) => ({ id: nextLocalId++, file, previewUrl: URL.createObjectURL(file) }))]
      if (prev.length <= SOFT_IMAGE_CAP && next.length > SOFT_IMAGE_CAP) {
        message.warning(`${next.length} ${groupLabel} images attached — that's a lot for one diagnosis call; consider trimming to the clearest examples.`)
      }
      return next
    })
  }

  function removeFrom(setGroup, id) {
    setGroup((prev) => {
      const target = prev.find((a) => a.id === id)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((a) => a.id !== id)
    })
  }

  function handleZipSelected(file) {
    if (!file) return
    ;[...badImages, ...goodImages].forEach((a) => URL.revokeObjectURL(a.previewUrl))
    setBadImages([])
    setGoodImages([])
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
      // Pasting is the "I just saw a bad render, grab it" workflow --
      // defaults to the Bad examples group. Good examples are always
      // explicit (click "Add good example(s)").
      addFiles(imageFiles, setBadImages, 'bad')
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
      const files = [
        ...badImages.map((a) => ({ file: a.file, label: 'bad' })),
        ...goodImages.map((a) => ({ file: a.file, label: 'good' })),
      ]
      await submit.mutateAsync({ text: text.trim(), files })
      ;[...badImages, ...goodImages].forEach((a) => URL.revokeObjectURL(a.previewUrl))
      setBadImages([])
      setGoodImages([])
    }
    setText('')
  }

  return (
    <Card size="small">
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Text type="secondary">
          Describe a framework-level requirement or problem in your own words — no need to know which
          file it belongs in. Paste (Ctrl/Cmd+V) or attach bad/good example images — attach both in
          bulk for a before/after comparison (e.g. "these show the ratio too low, these show it
          correct") — or attach a generation-bundle ZIP for richer diagnosis against the real prompt
          that was used.
        </Text>

        <AttachmentGroup
          title="Bad examples"
          hint="(show the problem)"
          color="#ff4d4f"
          items={badImages}
          onRemove={(id) => removeFrom(setBadImages, id)}
        />
        <AttachmentGroup
          title="Good examples"
          hint="(show the desired result)"
          color="#52c41a"
          items={goodImages}
          onRemove={(id) => removeFrom(setGoodImages, id)}
        />

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
          placeholder='e.g. "Body pixel ratio to face pixel ratio must always be 7.5." — paste a bad-example image with Ctrl/Cmd+V if you have one'
          autoSize={{ minRows: 3, maxRows: 8 }}
        />

        <Space wrap align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space direction="vertical" size={4}>
            <Space wrap align="center">
              <Button
                icon={<PictureOutlined style={{ color: '#ff4d4f' }} />}
                disabled={Boolean(zipFile)}
                onClick={() => badInputRef.current?.click()}
              >
                Add bad example(s)
              </Button>
              <a onClick={(e) => { e.preventDefault(); badFolderInputRef.current?.click() }}>or choose a folder</a>
              <Divider type="vertical" />
              <Button
                icon={<PictureOutlined style={{ color: '#52c41a' }} />}
                disabled={Boolean(zipFile)}
                onClick={() => goodInputRef.current?.click()}
              >
                Add good example(s)
              </Button>
              <a onClick={(e) => { e.preventDefault(); goodFolderInputRef.current?.click() }}>or choose a folder</a>
              <Divider type="vertical" />
              <Button icon={<FileZipOutlined />} disabled={hasImages} onClick={() => zipInputRef.current?.click()}>
                Attach ZIP bundle
              </Button>
            </Space>
          </Space>
          <input
            ref={badInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              addFiles(e.target.files, setBadImages, 'bad')
              e.target.value = ''
            }}
          />
          <input
            ref={badFolderInputRef}
            type="file"
            webkitdirectory=""
            directory=""
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              addFiles(e.target.files, setBadImages, 'bad')
              e.target.value = ''
            }}
          />
          <input
            ref={goodInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              addFiles(e.target.files, setGoodImages, 'good')
              e.target.value = ''
            }}
          />
          <input
            ref={goodFolderInputRef}
            type="file"
            webkitdirectory=""
            directory=""
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              addFiles(e.target.files, setGoodImages, 'good')
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
