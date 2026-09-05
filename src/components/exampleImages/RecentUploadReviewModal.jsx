import { PictureOutlined } from '@ant-design/icons'
import { Card, Col, Image, Modal, Row, Tag, Typography } from 'antd'
import { Select } from '../common/Select.jsx'
import { useEffect, useState } from 'react'
import {
  EXAMPLE_IMAGE_TYPES,
  EXAMPLE_IMAGE_TYPE_LABELS,
} from '../../utils/exampleImageConstants.js'

const { Text } = Typography

function getPreviewUrl(image) {
  return image?.thumbPath?.url || image?.imagePath?.url || undefined
}

export function RecentUploadReviewModal({ open, images, onClose, onSave }) {
  const [drafts, setDrafts] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open || !images?.length) {
      return
    }
    setDrafts(
      images.map((image) => ({
        id: image._id,
        type: image.type,
        tags: [...(image.tags ?? [])],
        originalFileName: image.originalFileName,
        previewUrl: getPreviewUrl(image.image),
      })),
    )
  }, [open, images])

  function updateDraft(id, patch) {
    setDrafts((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    )
  }

  async function handleSaveAndClose() {
    setSaving(true)
    try {
      await onSave(
        drafts.map((draft) => ({
          id: draft.id,
          type: draft.type,
          tags: draft.tags,
        })),
      )
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title="Review uploaded images"
      open={open}
      onCancel={onClose}
      onOk={handleSaveAndClose}
      okText="Save and close"
      confirmLoading={saving}
      width={960}
      destroyOnHidden
      styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        Update type and tags for each image, then save when you are done.
      </Text>
      <Row gutter={[16, 16]}>
        {drafts.map((draft) => (
          <Col key={draft.id} xs={24} sm={12} lg={8}>
            <Card size="small" style={{ height: '100%' }}>
              <div style={{ marginBottom: 12, textAlign: 'center', minHeight: 140 }}>
                {draft.previewUrl ? (
                  <Image
                    src={draft.previewUrl}
                    alt={draft.originalFileName || 'Example image'}
                    style={{ maxHeight: 140, objectFit: 'contain' }}
                  />
                ) : (
                  <PictureOutlined style={{ fontSize: 48, color: '#94a3b8' }} />
                )}
              </div>
              <Text
                type="secondary"
                ellipsis
                style={{ display: 'block', marginBottom: 8, fontSize: 12 }}
              >
                {draft.originalFileName || '—'}
              </Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Select
                  value={draft.type}
                  options={EXAMPLE_IMAGE_TYPES.map((value) => ({
                    value,
                    label: EXAMPLE_IMAGE_TYPE_LABELS[value],
                  }))}
                  onChange={(value) => updateDraft(draft.id, { type: value })}
                />
                <Select
                  mode="tags"
                  value={draft.tags}
                  placeholder="Add tags"
                  onChange={(tags) => updateDraft(draft.id, { tags })}
                  tokenSeparators={[',']}
                />
              </div>
            </Card>
          </Col>
        ))}
      </Row>
      {drafts.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <Tag color="blue">{drafts.length} image(s)</Tag>
        </div>
      )}
    </Modal>
  )
}
