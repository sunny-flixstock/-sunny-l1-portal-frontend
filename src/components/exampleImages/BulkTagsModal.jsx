import { Alert, Modal, Radio, Typography } from 'antd'
import { Select } from '../common/Select.jsx'
import { useState } from 'react'

const { Text } = Typography

export const BULK_TAG_MODES = {
  REPLACE: 'replace',
  ADD: 'add',
  REMOVE: 'remove',
}

function applyBulkTags(images, mode, tags) {
  const normalizedTags = [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))]

  return images.map((image) => {
    const current = [...(image.tags ?? [])]
    let next = current

    if (mode === BULK_TAG_MODES.REPLACE) {
      next = normalizedTags
    } else if (mode === BULK_TAG_MODES.ADD) {
      next = [...new Set([...current, ...normalizedTags])]
    } else if (mode === BULK_TAG_MODES.REMOVE) {
      const removeSet = new Set(normalizedTags)
      next = current.filter((tag) => !removeSet.has(tag))
    }

    return {
      id: image._id,
      tags: next,
    }
  })
}

export function BulkTagsModal({
  open,
  selectedImages,
  tagSuggestions,
  onClose,
  onApply,
  isSaving,
}) {
  const [mode, setMode] = useState(BULK_TAG_MODES.ADD)
  const [tags, setTags] = useState([])

  function handleClose() {
    setMode(BULK_TAG_MODES.ADD)
    setTags([])
    onClose()
  }

  function handleApply() {
    if (mode !== BULK_TAG_MODES.REPLACE && tags.length === 0) {
      return
    }
    if (mode === BULK_TAG_MODES.REPLACE && tags.length === 0) {
      onApply(applyBulkTags(selectedImages, mode, []))
      handleClose()
      return
    }
    if (tags.length === 0) {
      return
    }
    onApply(applyBulkTags(selectedImages, mode, tags))
    handleClose()
  }

  const modeHelp = {
    [BULK_TAG_MODES.REPLACE]: 'Replace all tags on each selected image with the tags below.',
    [BULK_TAG_MODES.ADD]: 'Add these tags to each selected image (existing tags are kept).',
    [BULK_TAG_MODES.REMOVE]: 'Remove these tags from each selected image.',
  }

  return (
    <Modal
      title={`Edit tags (${selectedImages.length} selected)`}
      open={open}
      onCancel={handleClose}
      onOk={handleApply}
      okText="Apply to selected"
      confirmLoading={isSaving}
      destroyOnHidden
    >
      <Radio.Group
        value={mode}
        onChange={(event) => setMode(event.target.value)}
        style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}
      >
        <Radio value={BULK_TAG_MODES.ADD}>Add tags</Radio>
        <Radio value={BULK_TAG_MODES.REMOVE}>Remove tags</Radio>
        <Radio value={BULK_TAG_MODES.REPLACE}>Replace all tags</Radio>
      </Radio.Group>

      <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
        {modeHelp[mode]}
      </Text>

      <Select
        mode="tags"
        value={tags}
        onChange={setTags}
        placeholder={mode === BULK_TAG_MODES.REPLACE ? 'Tags (leave empty to clear all)' : 'Tags'}
        style={{ width: '100%' }}
        tokenSeparators={[',']}
        options={tagSuggestions.map((tag) => ({ value: tag, label: tag }))}
      />

      {mode === BULK_TAG_MODES.REPLACE && (
        <Alert
          type="warning"
          showIcon
          style={{ marginTop: 12 }}
          message="Replace clears existing tags on every selected image."
        />
      )}
    </Modal>
  )
}
