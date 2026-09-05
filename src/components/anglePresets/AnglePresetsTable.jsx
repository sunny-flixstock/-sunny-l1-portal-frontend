import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { Alert, Button, Flex, Input, Popconfirm, Table, Tag } from 'antd'
import { Select } from '../common/Select.jsx'
import { useEffect, useState } from 'react'
import { useAllClients } from '../../hooks/useClients.js'
import { useAnglePresets, useDeleteAnglePreset } from '../../hooks/useAnglePresets.js'
import { AnglePresetCreateModal } from './AnglePresetCreateModal.jsx'
import { ViewAnglePresetDrawer } from './ViewAnglePresetDrawer.jsx'

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300
const SHOW_ANGLE_PRESET_EDIT = false
function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

export function AnglePresetsTable() {
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [clientFilter, setClientFilter] = useState('')
  const [pageNum, setPageNum] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [viewId, setViewId] = useState(null)

  const { data: clients = [] } = useAllClients()

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(searchInput.trim())
      setPageNum(1)
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [searchInput])

  const { data, isLoading, isFetching, isError, error } = useAnglePresets({
    client: clientFilter,
    q: searchQuery,
    pageNum,
    pageSize: PAGE_SIZE,
  })

  const deleteMutation = useDeleteAnglePreset()

  const presets = data?.data ?? []
  const pagination = data?.pagination ?? {
    total: 0,
    pageNum: 1,
    pageSize: PAGE_SIZE,
    totalPages: 0,
  }

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
      title: 'Angles',
      key: 'angleCount',
      width: 90,
      render: (_, row) => row.entries?.length ?? 0,
    },
    {
      title: 'Outputs',
      key: 'outputCount',
      width: 90,
      render: (_, row) =>
        row.entries?.reduce((sum, entry) => sum + (entry.imageSpecs?.length ?? 0), 0) ?? 0,
    },
    {
      title: 'Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 160,
      render: formatDate,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      align: 'center',
      render: (_, row) => (
        <Flex gap="small" justify="center">
          <Button
            type="text"
            icon={<EyeOutlined />}
            aria-label={`View ${row.name}`}
            title="View"
            onClick={() => setViewId(row._id)}
          />
          {SHOW_ANGLE_PRESET_EDIT && (
            <Button
              type="text"
              icon={<EditOutlined />}
              aria-label={`Edit ${row.name}`}
              title="Edit"
              onClick={() => setEditId(row._id)}
            />
          )}
          <Popconfirm
            title="Delete preset?"
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
    <Flex vertical gap="middle">
      <Flex wrap="wrap" gap="middle" align="flex-end">
        <Input.Search
          allowClear
          placeholder="Search presets…"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          style={{ width: 280 }}
          aria-label="Search angle presets"
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
          New preset
        </Button>
      </Flex>

      {isError && <Alert type="error" message={error.message} showIcon />}

      <Table
        rowKey="_id"
        columns={columns}
        dataSource={presets}
        loading={isLoading || isFetching}
        locale={{ emptyText: 'No angle presets yet' }}
        pagination={{
          current: pagination.pageNum,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: false,
          onChange: (page) => setPageNum(page),
          showTotal: (total, [start, end]) =>
            total === 0 ? 'No results' : `Showing ${start}-${end} of ${total}`,
        }}
        scroll={{ x: true }}
        size="middle"
      />

      {createOpen && (
        <AnglePresetCreateModal onClose={() => setCreateOpen(false)} />
      )}
      {editId && (
        <AnglePresetCreateModal
          presetId={editId}
          onClose={() => setEditId(null)}
        />
      )}
      <ViewAnglePresetDrawer
        presetId={viewId}
        onClose={() => setViewId(null)}
        onEdit={(id) => {
          setViewId(null)
          setEditId(id)
        }}
      />
    </Flex>
  )
}
