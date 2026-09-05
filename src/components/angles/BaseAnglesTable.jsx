import { EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { Alert, Button, Flex, Input, Table, Tag } from 'antd'
import { Select } from '../common/Select.jsx'
import { useEffect, useState } from 'react'
import { useBaseAngles } from '../../hooks/useBaseAngles.js'
import { BaseAngleCreateModal } from './BaseAngleCreateModal.jsx'
import { ViewBaseAngleDrawer } from './ViewBaseAngleDrawer.jsx'

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300

export function BaseAnglesTable() {
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [pageNum, setPageNum] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [viewId, setViewId] = useState(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(searchInput.trim())
      setPageNum(1)
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [searchInput])

  const { data, isLoading, isFetching, isError, error } = useBaseAngles({
    q: searchQuery,
    status: statusFilter,
    pageNum,
    pageSize: PAGE_SIZE,
  })

  const angles = data?.data ?? []
  const pagination = data?.pagination ?? {
    total: 0,
    pageNum: 1,
    pageSize: PAGE_SIZE,
    totalPages: 0,
  }

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Series key',
      dataIndex: 'seriesKey',
      key: 'seriesKey',
      render: (value) => <Tag>{value}</Tag>,
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
      width: 90,
      render: (value) => `v${value}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'default'}>{status}</Tag>
      ),
    },
    {
      title: 'Samples',
      key: 'samples',
      width: 90,
      render: (_, row) => row.sampleImages?.length ?? 0,
    },
    {
      title: 'Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (value) => (value ? new Date(value).toLocaleString() : '—'),
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_, row) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => setViewId(row._id)}
        >
          View
        </Button>
      ),
    },
  ]

  return (
    <>
      <Flex justify="space-between" align="center" wrap gap="middle" style={{ marginBottom: 16 }}>
        <Flex gap="middle" wrap>
          <Input.Search
            placeholder="Search base angles…"
            allowClear
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            style={{ width: 260 }}
          />
          <Select
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value)
              setPageNum(1)
            }}
            style={{ width: 140 }}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'archived', label: 'Archived' },
              { value: 'all', label: 'All' },
            ]}
          />
        </Flex>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          Create base angle
        </Button>
      </Flex>

      {isError && (
        <Alert type="error" message={error?.message ?? 'Failed to load base angles'} showIcon />
      )}

      <Table
        rowKey="_id"
        columns={columns}
        dataSource={angles}
        loading={isLoading || isFetching}
        pagination={{
          current: pagination.pageNum,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: false,
          onChange: (page) => setPageNum(page),
        }}
      />

      {createOpen && (
        <BaseAngleCreateModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => setCreateOpen(false)}
        />
      )}

      <ViewBaseAngleDrawer
        angleId={viewId}
        onClose={() => setViewId(null)}
        onVersionCreated={setViewId}
      />
    </>
  )
}
