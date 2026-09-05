import { PictureOutlined } from '@ant-design/icons'
import { Alert, Button, Card, message, Col, Empty, Flex, Image, Pagination, Row, Spin, Tag, Typography } from 'antd'
import { Select } from '../common/Select.jsx'
import { useState } from 'react'
import { fetchExampleImages } from '../../api/exampleImageApi.js'
import { useExampleImageTags, useExampleImages } from '../../hooks/useExampleImages.js'
import { fetchAllPages } from '../../utils/fetchAllPages.js'
import {
  EXAMPLE_IMAGE_TYPES,
  EXAMPLE_IMAGE_TYPE_LABELS,
  joinFilterValues,
} from '../../utils/exampleImageConstants.js'

const { Text } = Typography
const PAGE_SIZE_OPTIONS = [50, 100, 500]
const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0]
const SELECT_ALL_FETCH_PAGE_SIZE = 100

function getPreviewUrl(image) {
  return image?.thumbPath?.url || image?.imagePath?.url
}

function SelectableExampleImageCard({ image, selected, onToggle }) {
  const previewUrl = getPreviewUrl(image.image)

  return (
    <Card
      className={`example-image-card example-image-card--selectable ${
        selected ? 'example-image-card--selected' : ''
      }`}
      styles={{ body: { padding: 0 } }}
      hoverable
      onClick={() => onToggle(image)}
    >
      <div className="example-image-card__media">
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt={image.originalFileName || 'Example image'}
            preview={false}
            rootClassName="example-image-card__image"
          />
        ) : (
          <div className="example-image-card__placeholder">
            <PictureOutlined />
          </div>
        )}
      </div>

      <div className="example-image-card__meta">
        <Flex justify="space-between" align="center" gap={8}>
          <Tag color={image.type === 'good' ? 'success' : 'error'} style={{ margin: 0 }}>
            {EXAMPLE_IMAGE_TYPE_LABELS[image.type] ?? image.type}
          </Tag>
          {selected ? (
            <Tag color="processing" style={{ margin: 0 }}>
              Selected
            </Tag>
          ) : null}
        </Flex>
        <Text
          type="secondary"
          className="example-image-card__filename"
          ellipsis={{ tooltip: image.originalFileName }}
        >
          {image.originalFileName || '—'}
        </Text>
        {image.tags?.length > 0 ? (
          <Flex wrap gap={4} className="example-image-card__tags">
            {image.tags.slice(0, 3).map((tag) => (
              <Tag key={tag} style={{ margin: 0 }}>
                {tag}
              </Tag>
            ))}
            {image.tags.length > 3 ? (
              <Tag style={{ margin: 0 }}>+{image.tags.length - 3}</Tag>
            ) : null}
          </Flex>
        ) : null}
      </div>
    </Card>
  )
}

export function SelectableExampleImagesGrid({
  client,
  selectedIds,
  onToggle,
  onSelectMany,
  onClearSelection,
}) {
  const [typeFilter, setTypeFilter] = useState([])
  const [tagsFilter, setTagsFilter] = useState([])
  const [pageNum, setPageNum] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [selectingAll, setSelectingAll] = useState(false)

  const { data: tagOptions = [] } = useExampleImageTags(client || undefined)

  const { data, isLoading, isFetching, isError, error } = useExampleImages({
    client,
    type: joinFilterValues(typeFilter),
    tags: joinFilterValues(tagsFilter),
    pageNum,
    pageSize,
  })

  const images = data?.data ?? []
  const pagination = data?.pagination ?? {
    total: 0,
    pageNum: 1,
    pageSize,
    totalPages: 0,
  }

  const selectedOnPage = images.filter((image) => selectedIds.has(image._id)).length
  const showLoading = isLoading && images.length === 0

  function handleTypeFilterChange(values) {
    setTypeFilter(values)
    setPageNum(1)
  }

  function handleTagsFilterChange(values) {
    setTagsFilter(values)
    setPageNum(1)
  }

  function handlePageChange(page, nextPageSize) {
    setPageNum(page)
    if (nextPageSize !== pageSize) {
      setPageSize(nextPageSize)
      setPageNum(1)
    }
  }

  async function handleSelectAll() {
    if (!onSelectMany || pagination.total === 0) {
      return
    }

    setSelectingAll(true)
    try {
      const allImages = await fetchAllPages(
        (params) =>
          fetchExampleImages({
            client,
            type: joinFilterValues(typeFilter),
            tags: joinFilterValues(tagsFilter),
            ...params,
          }),
        { pageSize: SELECT_ALL_FETCH_PAGE_SIZE }
      )
      onSelectMany(allImages)
      message.success(`Selected ${allImages.length} example image(s)`)
    } catch (err) {
      message.error(err?.message || 'Failed to select all example images')
    } finally {
      setSelectingAll(false)
    }
  }

  if (!client) {
    return <Alert type="warning" message="Select a client on the first step." showIcon />
  }

  return (
    <Flex vertical gap="middle" className="example-images-grid input-set-examples-picker">
      <Flex wrap="wrap" gap="middle" align="flex-end">
        <Select
          mode="multiple"
          allowClear
          placeholder="Types"
          value={typeFilter}
          onChange={handleTypeFilterChange}
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
          onChange={handleTagsFilterChange}
          style={{ minWidth: 200 }}
          maxTagCount="responsive"
          options={tagOptions.map((tag) => ({ value: tag, label: tag }))}
        />
      </Flex>

      <Flex wrap="wrap" gap="middle" align="center" className="example-images-grid__selection-bar">
        <Text type="secondary">
          Client: <strong>{client}</strong>
        </Text>
        <Text type="secondary">{selectedIds.size} selected</Text>
        {onSelectMany ? (
          <Button
            size="small"
            loading={selectingAll}
            disabled={pagination.total === 0}
            onClick={handleSelectAll}
          >
            Select all{pagination.total > 0 ? ` (${pagination.total})` : ''}
          </Button>
        ) : null}
        {selectedIds.size > 0 && onClearSelection ? (
          <button type="button" className="input-set-examples-picker__clear" onClick={onClearSelection}>
            Clear all
          </button>
        ) : null}
        {images.length > 0 ? (
          <Text type="secondary">
            {selectedOnPage} selected on this page
          </Text>
        ) : null}
      </Flex>

      {isError ? <Alert type="error" message={error.message} showIcon /> : null}

      <div className="example-images-grid__body input-set-examples-picker__body">
        {showLoading ? (
          <Flex align="center" justify="center" style={{ minHeight: 240 }}>
            <Spin size="large" />
          </Flex>
        ) : images.length === 0 ? (
          <Empty description="No example images found" style={{ margin: '48px 0' }} />
        ) : (
          <Row gutter={[16, 16]} className={isFetching ? 'example-images-grid--fetching' : ''}>
            {images.map((image) => (
              <Col key={image._id} xs={12} sm={8} md={6} lg={6} xl={4}>
                <SelectableExampleImageCard
                  image={image}
                  selected={selectedIds.has(image._id)}
                  onToggle={(img) => onToggle(img, !selectedIds.has(img._id))}
                />
              </Col>
            ))}
          </Row>
        )}
      </div>

      {pagination.total > 0 ? (
        <Flex justify="center" className="example-images-grid__pagination">
          <Pagination
            current={pagination.pageNum}
            pageSize={pageSize}
            total={pagination.total}
            showSizeChanger
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onChange={handlePageChange}
            showTotal={(total, [start, end]) =>
              total === 0 ? null : `${start}-${end} of ${total}`
            }
          />
        </Flex>
      ) : null}
    </Flex>
  )
}
