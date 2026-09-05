import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { Alert, Button, Flex, Input, Popconfirm, Table, Tag } from 'antd'
import { Select } from '../common/Select.jsx'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useArchiveSystemInstruction,
  useSystemInstructions,
} from '../../hooks/useSystemInstructions.js'
import {
  INSTRUCTION_TYPE_LABELS,
  instructionDetailPath,
} from '../../utils/systemInstructionConstants.js'
import { RenameInstructionModal } from './RenameInstructionModal.jsx'
import { SystemInstructionCreateModal } from './SystemInstructionCreateModal.jsx'

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300

export function SystemInstructionsTable({ instructionType }) {
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [pageNum, setPageNum] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState(null)

  const instructionTypeLabel =
    INSTRUCTION_TYPE_LABELS[instructionType] ?? instructionType

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(searchInput.trim())
      setPageNum(1)
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  const { data, isLoading, isFetching, isError, error } = useSystemInstructions({
    instructionType,
    status: statusFilter || undefined,
    q: searchQuery,
    pageNum,
    pageSize: PAGE_SIZE,
  })

  const archiveMutation = useArchiveSystemInstruction()

  const instructions = data?.data ?? []
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
      render: (name, row) => (
        <Button
          type="link"
          style={{ padding: 0, height: 'auto', textAlign: 'left' }}
          onClick={() => navigate(instructionDetailPath(instructionType, row._id))}
        >
          {name}
        </Button>
      ),
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
      width: 88,
    },
    {
      title: 'Purpose',
      dataIndex: 'purpose',
      key: 'purpose',
      ellipsis: true,
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
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (value) =>
        value ? new Date(value).toLocaleDateString() : '—',
    },
    {
      title: '',
      key: 'actions',
      width: 140,
      render: (_, row) => (
        <Flex gap="small" justify="flex-end">
          <Button
            type="text"
            icon={<EyeOutlined />}
            aria-label="View instruction"
            onClick={() =>
              navigate(instructionDetailPath(instructionType, row._id))
            }
          />
          {row.status === 'active' && (
            <>
              <Button
                type="text"
                icon={<EditOutlined />}
                aria-label="Rename instruction"
                onClick={() => setRenameTarget(row)}
              />
              <Popconfirm
                title="Archive instruction?"
                description="Content stays immutable; this marks the version as archived."
                okText="Archive"
                onConfirm={() => archiveMutation.mutate(row._id)}
              >
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  aria-label="Archive instruction"
                  loading={archiveMutation.isPending}
                />
              </Popconfirm>
            </>
          )}
        </Flex>
      ),
    },
  ]

  return (
    <Flex vertical gap="middle" style={{ flex: 1, minHeight: 0 }}>
      <Flex wrap="wrap" gap="middle" align="flex-end">
        <Input.Search
          allowClear
          placeholder="Search name or purpose…"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          style={{ width: 240 }}
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
            { value: '', label: 'All statuses' },
          ]}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateOpen(true)}
          style={{ marginLeft: 'auto' }}
        >
          New instruction
        </Button>
      </Flex>

      {isError && <Alert type="error" message={error.message} showIcon />}

      <Table
        rowKey="_id"
        columns={columns}
        dataSource={instructions}
        loading={isLoading || isFetching}
        locale={{ emptyText: 'No instructions found' }}
        pagination={{
          current: pagination.pageNum,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: false,
          onChange: (page) => setPageNum(page),
        }}
        scroll={{ y: 'calc(100vh - 320px)' }}
        size="middle"
      />

      {createOpen && (
        <SystemInstructionCreateModal
          instructionType={instructionType}
          instructionTypeLabel={instructionTypeLabel}
          onClose={() => setCreateOpen(false)}
        />
      )}

      {renameTarget && (
        <RenameInstructionModal
          instruction={renameTarget}
          onClose={() => setRenameTarget(null)}
        />
      )}
    </Flex>
  )
}
