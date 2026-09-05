import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { Alert, Button, Flex, Input, Popconfirm, Table, Tag, Typography } from 'antd'
import { Select } from '../common/Select.jsx'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LABELS } from '../../constants/brandAiStylistLabels.js'
import { useAllClients } from '../../hooks/useClients.js'
import { useArchiveInputSet, useInputSets } from '../../hooks/useInputSets.js'
import {
  INPUT_SET_STATUS_COLORS,
  INPUT_SET_STATUS_LABELS,
  INPUT_SET_STATUSES,
} from '../../utils/inputSetConstants.js'

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300
function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

export function InputSetsTable() {
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [clientFilter, setClientFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pageNum, setPageNum] = useState(1)

  const { data: clients = [] } = useAllClients()

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(searchInput.trim())
      setPageNum(1)
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [searchInput])

  const { data, isLoading, isFetching, isError, error } = useInputSets({
    q: searchQuery,
    client: clientFilter,
    status: statusFilter,
    pageNum,
    pageSize: PAGE_SIZE,
  })
  const archiveMutation = useArchiveInputSet()

  const inputSets = data?.data ?? []
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
      title: 'Client',
      dataIndex: 'client',
      key: 'client',
      width: 120,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={INPUT_SET_STATUS_COLORS[status] ?? 'default'}>
          {INPUT_SET_STATUS_LABELS[status] ?? status ?? '—'}
        </Tag>
      ),
    },
    {
      title: 'Created by',
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 160,
      render: (value) => value || '—',
    },
    {
      title: 'Created on',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 200,
      render: formatDate,
    },
    {
      title: '',
      key: 'actions',
      width: 200,
      render: (_, row) => (
        <Flex gap={4}>
          <Button
            type="text"
            icon={<EyeOutlined />}
            aria-label="View input set"
            onClick={(event) => {
              event.stopPropagation()
              navigate(`/input-sets/${row._id}`)
            }}
          />
          <Button
            type="text"
            icon={<CopyOutlined />}
            aria-label="Clone input set"
            onClick={(event) => {
              event.stopPropagation()
              navigate(`/input-sets/${row._id}/clone`)
            }}
          />
          {row.status === 'draft' ? (
            <Button
              type="text"
              icon={<EditOutlined />}
              aria-label="Edit input set"
              onClick={(event) => {
                event.stopPropagation()
                navigate(`/input-sets/${row._id}/edit`)
              }}
            />
          ) : null}
          {row.status !== 'archive' ? (
            <Popconfirm
              title="Archive input set?"
              description={`Archived input sets are hidden from ${LABELS.stylistVersion.toLowerCase()} creation.`}
              okText="Archive"
              onConfirm={() => archiveMutation.mutate(row._id)}
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                aria-label="Archive input set"
                loading={archiveMutation.isPending}
                onClick={(event) => event.stopPropagation()}
              />
            </Popconfirm>
          ) : null}
        </Flex>
      ),
    },
  ]

  return (
    <Flex vertical gap={16} style={{ minHeight: 0, flex: 1 }}>
      <Flex wrap gap={12} align="center" justify="space-between">
        <Flex wrap gap={12} align="center">
          <Input
            allowClear
            placeholder="Search name or client"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ width: 260 }}
          />
          <Select
            allowClear
            placeholder="Filter by client"
            value={clientFilter || undefined}
            onChange={(value) => {
              setClientFilter(value ?? '')
              setPageNum(1)
            }}
            style={{ width: 200 }}
            options={clients.map((c) => ({ value: c.code, label: c.code }))}
          />
          <Select
            allowClear
            placeholder="Status"
            value={statusFilter || undefined}
            onChange={(value) => {
              setStatusFilter(value ?? '')
              setPageNum(1)
            }}
            style={{ width: 140 }}
            options={INPUT_SET_STATUSES.map((value) => ({
              value,
              label: INPUT_SET_STATUS_LABELS[value],
            }))}
          />
        </Flex>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/input-sets/new')}>
          Create input set
        </Button>
      </Flex>

      {isError ? (
        <Alert type="error" message={error?.message || 'Failed to load input sets'} showIcon />
      ) : null}

      <Table
        rowKey="_id"
        columns={columns}
        dataSource={inputSets}
        loading={isLoading || isFetching}
        pagination={{
          current: pagination.pageNum,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: false,
          onChange: setPageNum,
        }}
        locale={{ emptyText: <Typography.Text type="secondary">No input sets yet</Typography.Text> }}
        onRow={(row) => ({
          onClick: () => navigate(`/input-sets/${row._id}`),
          style: { cursor: 'pointer' },
        })}
      />
    </Flex>
  )
}
