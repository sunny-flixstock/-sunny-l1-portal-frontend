import { EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { Alert, Button, Flex, Input, Table, Tag } from 'antd'
import { Select } from '../common/Select.jsx'
import { useEffect, useState } from 'react'
import { useAllBaseAngles } from '../../hooks/useBaseAngles.js'
import { useAllClients } from '../../hooks/useClients.js'
import { useClientAngles } from '../../hooks/useClientAngles.js'
import { ClientAngleGenerateModal } from './ClientAngleGenerateModal.jsx'
import { ViewClientAngleDrawer } from './ViewClientAngleDrawer.jsx'

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300
export function ClientAnglesTable() {
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [clientFilter, setClientFilter] = useState('')
  const [baseAngleFilter, setBaseAngleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [pageNum, setPageNum] = useState(1)
  const [generateOpen, setGenerateOpen] = useState(false)
  const [viewId, setViewId] = useState(null)

  const { data: clients = [] } = useAllClients()
  const { data: baseAngles = [] } = useAllBaseAngles({ status: 'active' })

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(searchInput.trim())
      setPageNum(1)
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [searchInput])

  const { data, isLoading, isFetching, isError, error } = useClientAngles({
    q: searchQuery,
    client: clientFilter,
    baseAngleSeriesKey: baseAngleFilter,
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
      title: 'Client',
      dataIndex: 'client',
      key: 'client',
      width: 120,
      render: (value) => <Tag>{value}</Tag>,
    },
    {
      title: 'Base angle',
      dataIndex: 'baseAngleSeriesKey',
      key: 'baseAngleSeriesKey',
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
      title: 'Generated',
      key: 'generatedAt',
      width: 180,
      render: (_, row) =>
        row.generationMeta?.generatedAt
          ? new Date(row.generationMeta.generatedAt).toLocaleString()
          : '—',
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
            placeholder="Search client angles…"
            allowClear
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            style={{ width: 240 }}
          />
          <Select
            allowClear
            placeholder="Client"
            value={clientFilter || undefined}
            onChange={(value) => {
              setClientFilter(value ?? '')
              setPageNum(1)
            }}
            style={{ width: 160 }}
            options={clients.map((client) => ({
              value: client.code,
              label: client.code,
            }))}
          />
          <Select
            allowClear
            placeholder="Base angle"
            value={baseAngleFilter || undefined}
            onChange={(value) => {
              setBaseAngleFilter(value ?? '')
              setPageNum(1)
            }}
            style={{ width: 200 }}
            options={baseAngles.map((angle) => ({
              value: angle.seriesKey,
              label: angle.name,
            }))}
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
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setGenerateOpen(true)}>
          Generate client angle
        </Button>
      </Flex>

      {isError && (
        <Alert
          type="error"
          message={error?.message ?? 'Failed to load client angles'}
          showIcon
        />
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

      {generateOpen && (
        <ClientAngleGenerateModal
          onClose={() => setGenerateOpen(false)}
          onGenerated={() => setGenerateOpen(false)}
        />
      )}

      <ViewClientAngleDrawer
        angleId={viewId}
        onClose={() => setViewId(null)}
        onVersionCreated={setViewId}
      />
    </>
  )
}
