import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { Alert, Button, Flex, Input, message, Popconfirm, Table } from 'antd'
import { Select } from '../common/Select.jsx'
import { useEffect, useState } from 'react'
import { useAllClients } from '../../hooks/useClients.js'
import {
  useDeleteFrameworkGroup,
  useFrameworkGroups,
} from '../../hooks/useFrameworkGroups.js'
import { LABELS } from '../../constants/brandAiStylistLabels.js'
import { formatConstraint } from '../../utils/frameworkGroupForm.js'
import { FrameworkGroupModal } from './FrameworkGroupModal.jsx'
import { FrameworkGroupVersionsPanel } from './FrameworkGroupVersionsPanel.jsx'

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300

export function FrameworkGroupsTable() {
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [clientFilter, setClientFilter] = useState('')
  const [pageNum, setPageNum] = useState(1)
  const [modalMode, setModalMode] = useState(null)
  const [expandedRowKeys, setExpandedRowKeys] = useState([])

  const { data: clients = [] } = useAllClients()

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(searchInput.trim())
      setPageNum(1)
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [searchInput])

  const { data, isLoading, isFetching, isError, error } = useFrameworkGroups({
    q: searchQuery,
    client: clientFilter,
    pageNum,
    pageSize: PAGE_SIZE,
  })

  const deleteMutation = useDeleteFrameworkGroup()

  const groups = data?.data ?? []
  const pagination = data?.pagination ?? {
    total: 0,
    pageNum: 1,
    pageSize: PAGE_SIZE,
    totalPages: 0,
  }

  useEffect(() => {
    if (isError) {
      message.error(error?.message || `Failed to load ${LABELS.stylistGroups.toLowerCase()}`)
    }
  }, [isError, error])

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name', render: (name) => name || '—' },
    { title: 'Client', dataIndex: 'client', key: 'client' },
    {
      title: 'Gender',
      key: 'gender',
      render: (_, group) => formatConstraint(group.gender),
    },
    {
      title: 'Season',
      key: 'season',
      render: (_, group) => formatConstraint(group.season),
    },
    {
      title: 'Category',
      key: 'category',
      render: (_, group) => formatConstraint(group.category),
    },
    { title: 'Specificity', dataIndex: 'specificity', key: 'specificity' },
    { title: 'Priority', dataIndex: 'priority', key: 'priority' },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      align: 'center',
      render: (_, group) => {
        const label = group.name || group.client
        return (
          <Flex gap="small" justify="center">
            <Button
              type="text"
              icon={<EditOutlined />}
              aria-label={`Edit ${label}`}
              title="Edit"
              onClick={() => setModalMode({ type: 'edit', id: group._id })}
            />
            <Popconfirm
              title={`Delete ${LABELS.stylistGroup.toLowerCase()}?`}
              description={`Delete "${label}"?`}
              okText="Delete"
              okButtonProps={{ danger: true }}
              onConfirm={() => deleteMutation.mutate(group._id)}
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                aria-label={`Delete ${label}`}
                title="Delete"
                loading={deleteMutation.isPending}
              />
            </Popconfirm>
          </Flex>
        )
      },
    },
  ]

  return (
    <Flex vertical gap="middle" style={{ flex: 1, minHeight: 0 }}>
      <Flex wrap="wrap" gap="middle" align="flex-end">
        <Input.Search
          allowClear
          placeholder="Name or client…"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          style={{ width: 240 }}
          aria-label="Search"
        />
        <Select
          allowClear
          placeholder="All clients"
          value={clientFilter || undefined}
          onChange={(value) => {
            setClientFilter(value ?? '')
            setPageNum(1)
          }}
          style={{ width: 200 }}
          options={clients.map((client) => ({
            value: client.code,
            label: client.code,
          }))}
          aria-label="Client filter"
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalMode({ type: 'create' })}
          style={{ marginLeft: 'auto' }}
        >
          New group
        </Button>
      </Flex>

      {isError && (
        <Alert type="error" message={error.message} showIcon />
      )}

      <Table
        rowKey="_id"
        columns={columns}
        dataSource={groups}
        loading={isLoading || isFetching}
        locale={{ emptyText: `No ${LABELS.stylistGroups.toLowerCase()} found` }}
        expandable={{
          expandedRowKeys,
          onExpandedRowsChange: setExpandedRowKeys,
          expandedRowRender: (group) => (
            <FrameworkGroupVersionsPanel
              group={group}
              enabled={expandedRowKeys.includes(group._id)}
            />
          ),
        }}
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

      {modalMode?.type === 'create' && (
        <FrameworkGroupModal onClose={() => setModalMode(null)} />
      )}
      {modalMode?.type === 'edit' && (
        <FrameworkGroupModal groupId={modalMode.id} onClose={() => setModalMode(null)} />
      )}
    </Flex>
  )
}
