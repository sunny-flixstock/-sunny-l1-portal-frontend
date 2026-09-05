import { DeleteOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { Alert, Button, Flex, Input, Popconfirm, Table, Tag, Typography, message } from 'antd'
import { Select } from '../common/Select.jsx'
import { useEffect, useState } from 'react'
import { useAllClients } from '../../hooks/useClients.js'
import {
  useAngleTechnicalSpecifications,
  useDeleteAngleTechnicalSpecification,
} from '../../hooks/useAngleTechnicalSpecifications.js'
import { formatDimensions, formatFileSpec } from '../../utils/angleTechnicalSpecConstants.js'
import { AngleTechnicalSpecCreateModal } from './AngleTechnicalSpecCreateModal.jsx'
import { AngleTechnicalSpecViewModal } from './AngleTechnicalSpecViewModal.jsx'

const { Text } = Typography
const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300
function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

export function AngleTechnicalSpecTable() {
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [clientFilter, setClientFilter] = useState('')
  const [pageNum, setPageNum] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [viewId, setViewId] = useState(null)

  const { data: clients = [] } = useAllClients()

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(searchInput.trim())
      setPageNum(1)
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [searchInput])

  const { data, isLoading, isFetching, isError, error } = useAngleTechnicalSpecifications({
    client: clientFilter,
    q: searchQuery,
    pageNum,
    pageSize: PAGE_SIZE,
  })

  const deleteMutation = useDeleteAngleTechnicalSpecification()

  const specs = data?.data ?? []
  const pagination = data?.pagination ?? {
    total: 0,
    pageNum: 1,
    pageSize: PAGE_SIZE,
    totalPages: 0,
  }

  useEffect(() => {
    if (isError) {
      message.error(error?.message || 'Failed to load angle technical specifications')
    }
  }, [isError, error])

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Client',
      dataIndex: 'client',
      key: 'client',
      width: 120,
      render: (value) => <Tag>{value}</Tag>,
    },
    {
      title: 'Dimensions',
      key: 'dimensions',
      render: (_, row) => formatDimensions(row.dimensions),
    },
    {
      title: 'Background',
      key: 'background',
      width: 100,
      render: (_, row) => (
        <Flex align="center" gap={8}>
          <span
            style={{
              width: 16,
              height: 16,
              borderRadius: 4,
              background: row.background?.color ?? '#FFFFFF',
              border: '1px solid #d9d9d9',
            }}
          />
          <Text code style={{ fontSize: 12 }}>
            {row.background?.color ?? '#FFFFFF'}
          </Text>
        </Flex>
      ),
    },
    {
      title: 'File spec',
      key: 'fileSpecifications',
      render: (_, row) => formatFileSpec(row.fileSpecifications),
    },
    {
      title: 'Spec hash',
      dataIndex: 'specHash',
      key: 'specHash',
      render: (hash) => (
        <Text code copyable={{ text: hash }} style={{ fontSize: 12 }}>
          {hash.slice(0, 8)}…
        </Text>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: formatDate,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      align: 'center',
      render: (_, row) => (
        <Flex gap="small" justify="center">
          <Button
            type="text"
            icon={<EyeOutlined />}
            aria-label={`View ${row.name}`}
            title="View details"
            onClick={() => setViewId(row._id)}
          />
          <Popconfirm
            title="Delete specification?"
            description={`Delete "${row.name}"?`}
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => deleteMutation.mutate(row._id)}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              aria-label={`Delete ${row.name}`}
              title="Delete"
              loading={deleteMutation.isPending}
            />
          </Popconfirm>
        </Flex>
      ),
    },
  ]

  return (
    <Flex vertical gap="middle" style={{ flex: 1, minHeight: 0 }}>
      <Flex wrap="wrap" gap="middle" align="flex-end">
        <Input.Search
          allowClear
          placeholder="Name or hash…"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          style={{ width: 280 }}
          aria-label="Search specifications"
        />
        <Select
          allowClear
          placeholder="All clients"
          value={clientFilter || undefined}
          onChange={(value) => {
            setClientFilter(value ?? '')
            setPageNum(1)
          }}
          options={clients.map((client) => ({
            value: client.code,
            label: client.code,
          }))}
          style={{ width: 180 }}
          aria-label="Filter by client"
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateOpen(true)}
          style={{ marginLeft: 'auto' }}
        >
          New specification
        </Button>
      </Flex>

      {isError && <Alert type="error" message={error.message} showIcon />}

      <Table
        rowKey="_id"
        columns={columns}
        dataSource={specs}
        loading={isLoading || isFetching}
        locale={{ emptyText: 'No angle technical specifications yet' }}
        pagination={{
          current: pagination.pageNum,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: false,
          onChange: (page) => setPageNum(page),
          showTotal: (total, [start, end]) =>
            total === 0 ? 'No results' : `Showing ${start}-${end} of ${total}`,
        }}
        scroll={{ x: true, y: 'calc(100vh - 320px)' }}
        size="middle"
      />

      {createOpen && (
        <AngleTechnicalSpecCreateModal onClose={() => setCreateOpen(false)} />
      )}
      {viewId && (
        <AngleTechnicalSpecViewModal specId={viewId} onClose={() => setViewId(null)} />
      )}
    </Flex>
  )
}
