import { Alert, Button, DatePicker, Flex, Image, Input, Radio, Table, Tag, Typography, message } from 'antd'
import { Select } from '../common/Select.jsx'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useSkus } from '../../hooks/useSkus.js'
import { SkuDetailDrawer } from './SkuDetailDrawer.jsx'
import { ASSET_TYPES } from '../../utils/supportingItemsUploadPipeline.js'
import { getPreviewUrl } from './skuImageUtils.js'

const { Text } = Typography
const { RangePicker } = DatePicker
const SEARCH_DEBOUNCE_MS = 300
const PAGE_SIZE_OPTIONS = [10, 20, 50]

const DEFAULT_FILTERS = {
  assetType: ASSET_TYPES.CLIENT,
  barcodeInput: '',
  barcode: '',
  dateRange: null,
  embeddingDone: '',
  pageSize: 20,
  pageNum: 1,
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

export function SkuListTable({ clientName }) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [detailSkuId, setDetailSkuId] = useState(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        barcode: prev.barcodeInput.trim(),
        pageNum: 1,
      }))
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [filters.barcodeInput])

  useEffect(() => {
    setFilters(DEFAULT_FILTERS)
    setDetailSkuId(null)
  }, [clientName])

  useEffect(() => {
    setDetailSkuId(null)
  }, [filters.assetType])

  const queryParams = {
    clientName,
    assetType: filters.assetType,
    pageNum: filters.pageNum,
    pageSize: filters.pageSize,
    includeShouldNotProduce: true,
    ...(filters.barcode ? { barcode: filters.barcode } : {}),
    ...(filters.embeddingDone ? { embeddingDone: filters.embeddingDone } : {}),
    ...(filters.dateRange?.[0]
      ? { createdAfter: filters.dateRange[0].format('YYYY-MM-DD') }
      : {}),
    ...(filters.dateRange?.[1]
      ? { createdBefore: filters.dateRange[1].format('YYYY-MM-DD') }
      : {}),
  }

  const { data, isLoading, isFetching, isError, error } = useSkus(queryParams, Boolean(clientName))

  useEffect(() => {
    if (isError) {
      message.error(error?.message || 'Failed to load SKUs')
    }
  }, [isError, error])

  const skus = data?.data ?? []
  const pagination = data?.pagination ?? {
    total: 0,
    pageNum: 1,
    pageSize: filters.pageSize,
    totalPages: 0,
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS)
  }

  function updateFilter(key, value) {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      pageNum: key === 'pageNum' ? value : 1,
    }))
  }

  const columns = [
    {
      title: 'Preview',
      key: 'preview',
      width: 72,
      render: (_, row) => {
        const url = getPreviewUrl(row.assets?.[0]?.image ?? row.displayAsset?.image)
        return url ? (
          <Image
            src={url}
            alt={row.barcode}
            width={48}
            height={48}
            style={{ objectFit: 'cover', borderRadius: 4 }}
            preview={false}
          />
        ) : (
          <Text type="secondary">—</Text>
        )
      },
    },
    {
      title: 'Barcode',
      dataIndex: 'barcode',
      key: 'barcode',
    },
    {
      title: 'Should Not Produce',
      dataIndex: 'shouldNotProduce',
      key: 'shouldNotProduce',
      width: 140,
      render: (value) => (
        <Tag color={value ? 'red' : 'default'}>{value ? 'Yes' : 'No'}</Tag>
      ),
    },
    {
      title: 'Embedding done',
      dataIndex: 'embeddingDone',
      key: 'embeddingDone',
      width: 130,
      render: (value) => (
        <Tag color={value ? 'green' : 'default'}>{value ? 'Yes' : 'No'}</Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: formatDate,
    },
    {
      title: 'Assets',
      key: 'assetCount',
      width: 80,
      render: (_, row) => row.assets?.length ?? 0,
    },
  ]

  if (!clientName) {
    return null
  }

  return (
    <Flex vertical style={{ flex: 1, minHeight: 0 }}>
      <Radio.Group
        value={filters.assetType}
        onChange={(event) => updateFilter('assetType', event.target.value)}
        optionType="button"
        buttonStyle="solid"
        style={{ marginBottom: 16, flexShrink: 0 }}
        options={[
          { value: ASSET_TYPES.CLIENT, label: 'Client assets' },
          { value: ASSET_TYPES.INTERNAL, label: 'Internal assets' },
        ]}
      />

      <Flex wrap gap={12} align="center" style={{ marginBottom: 16, flexShrink: 0 }}>
        <Input
          allowClear
          placeholder="Filter by barcode"
          value={filters.barcodeInput}
          onChange={(event) => updateFilter('barcodeInput', event.target.value)}
          style={{ width: 220 }}
          aria-label="Barcode filter"
        />
        <RangePicker
          value={filters.dateRange}
          onChange={(value) => updateFilter('dateRange', value)}
          disabledDate={(current) => current && current > dayjs().endOf('day')}
          aria-label="Created date range"
        />
        <Select
          placeholder="Embedding done"
          value={filters.embeddingDone || undefined}
          onChange={(value) => updateFilter('embeddingDone', value ?? '')}
          style={{ width: 160 }}
          allowClear
          options={[
            { value: 'true', label: 'Yes' },
            { value: 'false', label: 'No' },
          ]}
          aria-label="Embedding done filter"
        />
        <Select
          value={filters.pageSize}
          onChange={(value) => updateFilter('pageSize', value)}
          style={{ width: 100 }}
          options={PAGE_SIZE_OPTIONS.map((size) => ({ value: size, label: `${size} / page` }))}
          aria-label="Page size"
        />
        <Button onClick={resetFilters}>Reset filters</Button>
      </Flex>

      {isError && (
        <Alert
          type="error"
          showIcon
          message={error?.message || 'Failed to load SKUs'}
          style={{ marginBottom: 16, flexShrink: 0 }}
        />
      )}

      <Table
        rowKey="_id"
        columns={columns}
        dataSource={skus}
        loading={isLoading || isFetching}
        scroll={{ x: true, y: 'calc(100vh - 380px)' }}
        onRow={(record) => ({
          onClick: () => setDetailSkuId(record._id),
          style: { cursor: 'pointer' },
        })}
        pagination={{
          current: pagination.pageNum,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: false,
          showTotal: (total) => `${total} SKUs`,
          onChange: (page) => updateFilter('pageNum', page),
        }}
      />

      {detailSkuId && (
        <SkuDetailDrawer
          skuId={detailSkuId}
          clientName={clientName}
          assetType={filters.assetType}
          onClose={() => setDetailSkuId(null)}
        />
      )}
    </Flex>
  )
}
