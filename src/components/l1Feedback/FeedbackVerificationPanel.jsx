import { useEffect, useState } from 'react'
import { Alert, Button, Card, Empty, Image, Select, Space, Spin, Tag, Typography, message } from 'antd'
import { CopyOutlined, DownloadOutlined, FilePptOutlined } from '@ant-design/icons'
import { useSearchParams } from 'react-router-dom'
import { useL1PayloadSessions, useL1PayloadFeedbackItems } from '../../hooks/useL1PayloadSession.js'
import { useDownloadL1PayloadFeedbackDeck } from '../../hooks/useL1FeedbackDeck.js'

const { Text, Paragraph } = Typography

/** Fetches the actual image bytes directly from the CDN (no backend proxy
 * -- confirmed the host sends Access-Control-Allow-Origin: *, so this works
 * from the browser) so Copy/Download operate on the exact original file,
 * never a resized/recompressed copy. */
async function fetchImageBlob(url) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Could not fetch image (HTTP ${response.status})`)
  }
  return response.blob()
}

async function copyImageToClipboard(url) {
  const blob = await fetchImageBlob(url)
  if (!navigator.clipboard?.write) {
    throw new Error('This browser does not support copying images to the clipboard')
  }
  // Clipboard images must be png -- re-encode via canvas if the source is a jpg.
  const item =
    blob.type === 'image/png'
      ? new ClipboardItem({ [blob.type]: blob })
      : await new Promise((resolve, reject) => {
          const img = new window.Image()
          img.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = img.naturalWidth
            canvas.height = img.naturalHeight
            canvas.getContext('2d').drawImage(img, 0, 0)
            canvas.toBlob((pngBlob) => {
              if (!pngBlob) return reject(new Error('Failed to convert image for clipboard'))
              resolve(new ClipboardItem({ 'image/png': pngBlob }))
            })
          }
          img.onerror = () => reject(new Error('Failed to load image for clipboard conversion'))
          img.src = URL.createObjectURL(blob)
        })
  await navigator.clipboard.write([item])
}

async function downloadImage(url, filename) {
  const blob = await fetchImageBlob(url)
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(objectUrl)
}

function FeedbackItemCard({ item, index }) {
  const [copying, setCopying] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const filenameForImage = item.imageUrl ? item.imageUrl.split('/').pop().split('?')[0] : `${item.skuId}.jpg`

  async function handleCopy() {
    setCopying(true)
    try {
      await copyImageToClipboard(item.imageUrl)
      message.success('Image copied to clipboard')
    } catch (err) {
      message.error(err.message || 'Failed to copy image')
    } finally {
      setCopying(false)
    }
  }

  async function handleDownload() {
    setDownloading(true)
    try {
      await downloadImage(item.imageUrl, filenameForImage)
    } catch (err) {
      message.error(err.message || 'Failed to download image')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Card
      size="small"
      style={{ marginBottom: 16 }}
      title={
        <Space wrap>
          <Text strong>Feedback #{String(index + 1).padStart(3, '0')}</Text>
          <Tag color="blue">SKU: {item.skuId}</Tag>
          <Tag>Angle: {item.angleName ?? '—'}</Tag>
          <Tag color="purple">Variant: V{item.variantIndex + 1}</Tag>
          {item.matchConfidence === 'low' && <Tag color="gold">low-confidence match</Tag>}
        </Space>
      }
    >
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 320px', textAlign: 'center', background: '#fafafa', borderRadius: 8, padding: 8 }}>
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={`SKU ${item.skuId} — ${item.angleName} V${item.variantIndex + 1}`}
              style={{ maxWidth: '100%', maxHeight: 420, objectFit: 'contain' }}
              // No width/height forcing beyond fitting the card -- clicking
              // opens antd's preview overlay at the image's real native
              // resolution, nothing resized/recompressed server-side.
            />
          ) : (
            <Empty description="No image URL found for this variant" />
          )}
        </div>
        <div style={{ flex: '1 1 280px' }}>
          <Text strong style={{ fontSize: 12, color: '#8c8c8c', letterSpacing: 0.5 }}>
            FEEDBACK
          </Text>
          <Paragraph style={{ marginTop: 4 }}>&ldquo;{item.feedbackText}&rdquo;</Paragraph>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Source: QC feedback doc
          </Text>
        </div>
      </div>

      <Space wrap style={{ marginTop: 16 }}>
        <Button icon={<CopyOutlined />} loading={copying} disabled={!item.imageUrl} onClick={handleCopy}>
          Copy Image
        </Button>
        <Button icon={<DownloadOutlined />} loading={downloading} disabled={!item.imageUrl} onClick={handleDownload}>
          Download Image
        </Button>
      </Space>
    </Card>
  )
}

/** Read-only feedback review, deliberately upstream of RCA and decoupled
 * from it entirely (see L1FeedbackPage.jsx): for every feedback item
 * Payload Creation extracted and merged, fetches the real image it was
 * mapped to (straight from the CDN, no server-side resizing) and shows it
 * next to the feedback text, so you can see which image got which feedback
 * and what kinds of feedback are coming in, at a glance. Purely a personal
 * visibility/analysis tool -- nothing here writes back to any config or
 * feeds SKU config upload/RCA. */
export function FeedbackVerificationPanel() {
  const [searchParams, setSearchParams] = useSearchParams()
  const sessionId = searchParams.get('verifySessionId')

  const { data: sessions = [], isLoading: sessionsLoading } = useL1PayloadSessions()
  const { data: items = [], isLoading: itemsLoading } = useL1PayloadFeedbackItems(sessionId)
  const downloadDeck = useDownloadL1PayloadFeedbackDeck()

  // Default to the most recently created session once the list loads, if
  // none is already selected via URL.
  useEffect(() => {
    if (!sessionId && sessions.length) {
      const next = new URLSearchParams(searchParams)
      next.set('verifySessionId', sessions[0]._id)
      setSearchParams(next)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, sessions])

  function handleSessionChange(id) {
    const next = new URLSearchParams(searchParams)
    next.set('verifySessionId', id)
    setSearchParams(next)
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message="See which image each piece of feedback belongs to, and what kind of feedback is coming in — this has no effect on SKU config upload or RCA."
      />

      <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
        <Select
          style={{ minWidth: 320 }}
          loading={sessionsLoading}
          placeholder="Choose a payload session"
          value={sessionId ?? undefined}
          onChange={handleSessionChange}
          options={sessions.map((s) => ({
            value: s._id,
            label: `${s.date} — ${s.sourceDocName ?? 'session'} (${s.matchedCount ?? 0} matched)`,
          }))}
        />
        {items.length > 0 && (
          <Button
            icon={<FilePptOutlined />}
            loading={downloadDeck.isPending}
            onClick={() => downloadDeck.mutate(sessionId)}
          >
            Download Feedback Deck
          </Button>
        )}
      </Space>

      {!sessionId && !sessionsLoading && (
        <Empty description="No payload sessions yet — create one in the Payload Creation tab first" />
      )}

      {sessionId && itemsLoading && (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <Spin />
        </div>
      )}

      {sessionId && !itemsLoading && items.length === 0 && (
        <Empty description="This session has no merged feedback items" />
      )}

      {items.map((item, index) => (
        <FeedbackItemCard key={`${item.skuId}-${item.itemIndex}`} item={item} index={index} />
      ))}
    </Space>
  )
}
