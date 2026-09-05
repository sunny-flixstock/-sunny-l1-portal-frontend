import {
  DeleteOutlined,
  EditOutlined,
  PictureOutlined,
} from '@ant-design/icons'
import { Alert, Button, Card, Checkbox, Col, Empty, Flex, Image, Pagination, Popconfirm, Popover, Row, Spin, Tag, Typography } from 'antd'
import { Select } from '../common/Select.jsx'
import { useEffect, useMemo, useState } from 'react'
import { useAllClients } from '../../hooks/useClients.js'
import {
  useBatchUpdateExampleImages,
  useDeleteExampleImage,
  useExampleImageTags,
  useExampleImages,
  useUpdateExampleImage,
} from '../../hooks/useExampleImages.js'
import {
  EXAMPLE_IMAGE_TYPES,
  EXAMPLE_IMAGE_TYPE_LABELS,
  joinFilterValues,
} from '../../utils/exampleImageConstants.js'
import { BulkTagsModal } from './BulkTagsModal.jsx'

const { Text } = Typography
const PAGE_SIZE = 24

function getPreviewUrl(image) {
  return image?.thumbPath?.url || image?.imagePath?.url
}

function tagsEqual(a, b) {
  const left = [...(a ?? [])].sort().join('\0')
  const right = [...(b ?? [])].sort().join('\0')
  return left === right
}

function ExampleImageCard({
  image,
  selected,
  onSelect,
  onDelete,
  isDeleting,
  tagSuggestions,
  onSaveTags,
  isSavingTags,
}) {
  const previewUrl = getPreviewUrl(image.image)
  const [draftTags, setDraftTags] = useState(image.tags ?? [])
  const [tagsOpen, setTagsOpen] = useState(false)

  useEffect(() => {
    if (!tagsOpen) {
      setDraftTags(image.tags ?? [])
    }
  }, [image.tags, tagsOpen])

  const isDirty = !tagsEqual(draftTags, image.tags)

  function handleSaveTags() {
    onSaveTags(image._id, draftTags, () => {
      setTagsOpen(false)
    })
  }

  const tagsEditor = (
    <Flex vertical gap="small" style={{ width: 280 }}>
      <Select
        mode="tags"
        value={draftTags}
        onChange={setDraftTags}
        placeholder="Add tags"
        style={{ width: '100%' }}
        tokenSeparators={[',']}
        options={tagSuggestions.map((tag) => ({ value: tag, label: tag }))}
      />
      <Flex justify="flex-end" gap="small">
        <Button
          size="small"
          onClick={() => {
            setDraftTags(image.tags ?? [])
            setTagsOpen(false)
          }}
        >
          Cancel
        </Button>
        <Button
          type="primary"
          size="small"
          disabled={!isDirty}
          loading={isSavingTags}
          onClick={handleSaveTags}
        >
          Save
        </Button>
      </Flex>
    </Flex>
  )

  return (
    <Card
      className={`example-image-card ${selected ? 'example-image-card--selected' : ''}`}
      styles={{ body: { padding: 0 } }}
      hoverable
    >
      <div className="example-image-card__media">
        <Checkbox
          className="example-image-card__select"
          checked={selected}
          onChange={(event) => onSelect(image._id, event.target.checked)}
          onClick={(event) => event.stopPropagation()}
        />
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt={image.originalFileName || 'Example image'}
            preview
            rootClassName="example-image-card__image"
          />
        ) : (
          <div className="example-image-card__placeholder">
            <PictureOutlined />
          </div>
        )}
        <Popconfirm
          title="Delete example image?"
          okText="Delete"
          okButtonProps={{ danger: true }}
          onConfirm={() => onDelete(image._id)}
        >
          <button
            type="button"
            className="example-image-card__delete"
            aria-label="Delete example image"
            disabled={isDeleting}
          >
            <DeleteOutlined />
          </button>
        </Popconfirm>
      </div>

      <div className="example-image-card__meta">
        <Flex justify="space-between" align="center" gap={8}>
          <Text strong ellipsis style={{ flex: 1 }}>
            {image.client}
          </Text>
          <Tag color={image.type === 'good' ? 'success' : 'error'} style={{ margin: 0 }}>
            {EXAMPLE_IMAGE_TYPE_LABELS[image.type] ?? image.type}
          </Tag>
        </Flex>

        <Flex align="center" justify="space-between" gap={8} className="example-image-card__tags-row">
          <Flex wrap gap={4} className="example-image-card__tags" style={{ flex: 1, minWidth: 0 }}>
            {image.tags?.length > 0 ? (
              image.tags.map((tag) => (
                <Tag key={tag} style={{ margin: 0 }}>
                  {tag}
                </Tag>
              ))
            ) : (
              <Text type="secondary" style={{ fontSize: 12 }}>
                No tags
              </Text>
            )}
          </Flex>
          <Popover
            title="Edit tags"
            trigger="click"
            open={tagsOpen}
            onOpenChange={setTagsOpen}
            content={tagsEditor}
            destroyOnHidden
          >
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              aria-label="Edit tags"
              onClick={(event) => event.stopPropagation()}
            />
          </Popover>
        </Flex>

        <Text
          type="secondary"
          className="example-image-card__filename"
          ellipsis={{ tooltip: image.originalFileName }}
        >
          {image.originalFileName || '—'}
        </Text>
      </div>
    </Card>
  )
}

export function ExampleImagesGrid() {
  const [clientFilter, setClientFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState([])
  const [tagsFilter, setTagsFilter] = useState([])
  const [pageNum, setPageNum] = useState(1)
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [bulkModalOpen, setBulkModalOpen] = useState(false)
  const [savingTagId, setSavingTagId] = useState(null)

  const { data: clients = [] } = useAllClients()

  const { data: tagOptions = [] } = useExampleImageTags(clientFilter || undefined)

  const { data, isLoading, isFetching, isError, error } = useExampleImages({
    client: clientFilter,
    type: joinFilterValues(typeFilter),
    tags: joinFilterValues(tagsFilter),
    pageNum,
    pageSize: PAGE_SIZE,
  })

  const deleteMutation = useDeleteExampleImage()
  const updateMutation = useUpdateExampleImage()
  const batchUpdateMutation = useBatchUpdateExampleImages()

  const images = data?.data ?? []
  const pagination = data?.pagination ?? {
    total: 0,
    pageNum: 1,
    pageSize: PAGE_SIZE,
    totalPages: 0,
  }

  const selectedImages = useMemo(
    () => images.filter((image) => selectedIds.has(image._id)),
    [images, selectedIds],
  )

  const pageAllSelected =
    images.length > 0 && images.every((image) => selectedIds.has(image._id))
  const pageSomeSelected =
    images.some((image) => selectedIds.has(image._id)) && !pageAllSelected

  useEffect(() => {
    setPageNum(1)
    setSelectedIds(new Set())
  }, [clientFilter, typeFilter, tagsFilter])

  useEffect(() => {
    setSelectedIds(new Set())
  }, [pageNum])

  function handleSelect(id, checked) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (checked) {
        next.add(id)
      } else {
        next.delete(id)
      }
      return next
    })
  }

  function handleSelectAllOnPage(checked) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (checked) {
        images.forEach((image) => next.add(image._id))
      } else {
        images.forEach((image) => next.delete(image._id))
      }
      return next
    })
  }

  async function handleSaveTags(id, tags, onSuccess) {
    setSavingTagId(id)
    try {
      await updateMutation.mutateAsync({ id, body: { tags } })
      onSuccess?.()
    } finally {
      setSavingTagId(null)
    }
  }

  async function handleBulkApply(updates) {
    await batchUpdateMutation.mutateAsync(updates)
    setSelectedIds(new Set())
  }

  const showLoading = isLoading && images.length === 0

  return (
    <Flex vertical gap="middle" className="example-images-grid" style={{ flex: 1, minHeight: 0 }}>
      <Flex wrap="wrap" gap="middle" align="flex-end">
        <Select
          allowClear
          placeholder="All clients"
          value={clientFilter || undefined}
          onChange={(value) => setClientFilter(value ?? '')}
          style={{ width: 180 }}
          options={clients.map((client) => ({
            value: client.code,
            label: client.code,
          }))}
        />
        <Select
          mode="multiple"
          allowClear
          placeholder="Types"
          value={typeFilter}
          onChange={setTypeFilter}
          style={{ minWidth: 140 }}
          maxTagCount="responsive"
          options={EXAMPLE_IMAGE_TYPES.map((value) => ({
            value,
            label: EXAMPLE_IMAGE_TYPE_LABELS[value],
          }))}
        />
        <Select
          mode="multiple"
          allowClear
          placeholder="Tags"
          value={tagsFilter}
          onChange={setTagsFilter}
          style={{ minWidth: 200 }}
          maxTagCount="responsive"
          options={tagOptions.map((tag) => ({ value: tag, label: tag }))}
        />
      </Flex>

      {images.length > 0 && (
        <Flex
          wrap="wrap"
          gap="middle"
          align="center"
          className="example-images-grid__selection-bar"
        >
          <Checkbox
            checked={pageAllSelected}
            indeterminate={pageSomeSelected}
            onChange={(event) => handleSelectAllOnPage(event.target.checked)}
          >
            Select all on page
          </Checkbox>
          {selectedIds.size > 0 && (
            <>
              <Text type="secondary">{selectedIds.size} selected</Text>
              <Button type="primary" onClick={() => setBulkModalOpen(true)}>
                Edit tags in bulk
              </Button>
              <Button type="link" onClick={() => setSelectedIds(new Set())}>
                Clear selection
              </Button>
            </>
          )}
        </Flex>
      )}

      {isError && <Alert type="error" message={error.message} showIcon />}

      <div className="example-images-grid__body">
        {showLoading ? (
          <Flex align="center" justify="center" style={{ flex: 1, minHeight: 240 }}>
            <Spin size="large" />
          </Flex>
        ) : images.length === 0 ? (
          <Empty description="No example images found" style={{ margin: '48px 0' }} />
        ) : (
          <Row gutter={[16, 16]} className={isFetching ? 'example-images-grid--fetching' : ''}>
            {images.map((image) => (
              <Col key={image._id} xs={12} sm={8} md={6} lg={6} xl={4}>
                <ExampleImageCard
                  image={image}
                  selected={selectedIds.has(image._id)}
                  onSelect={handleSelect}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  isDeleting={deleteMutation.isPending}
                  tagSuggestions={tagOptions}
                  onSaveTags={handleSaveTags}
                  isSavingTags={savingTagId === image._id}
                />
              </Col>
            ))}
          </Row>
        )}
      </div>

      {pagination.total > 0 && (
        <Flex justify="center" className="example-images-grid__pagination">
          <Pagination
            current={pagination.pageNum}
            pageSize={pagination.pageSize}
            total={pagination.total}
            showSizeChanger={false}
            onChange={(page) => setPageNum(page)}
            showTotal={(total, [start, end]) =>
              total === 0 ? null : `${start}-${end} of ${total}`
            }
          />
        </Flex>
      )}

      <BulkTagsModal
        open={bulkModalOpen}
        selectedImages={selectedImages}
        tagSuggestions={tagOptions}
        onClose={() => setBulkModalOpen(false)}
        onApply={handleBulkApply}
        isSaving={batchUpdateMutation.isPending}
      />
    </Flex>
  )
}
