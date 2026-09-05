import { PlusOutlined, SettingOutlined } from '@ant-design/icons'
import { Alert, Button, Flex, Input, Table } from 'antd'
import { useEffect, useState } from 'react'
import { useClients } from '../../hooks/useClients.js'
import { ClientCreateModal } from './ClientCreateModal.jsx'
import { CsvConfigModal } from './CsvConfigModal.jsx'

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300

export function ClientsTable() {
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [pageNum, setPageNum] = useState(1)
  const [selectedClientCode, setSelectedClientCode] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(searchInput.trim())
      setPageNum(1)
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [searchInput])

  const { data, isLoading, isFetching, isError, error } = useClients({
    q: searchQuery,
    pageNum,
    pageSize: PAGE_SIZE,
  })

  const clients = data?.data ?? []
  const pagination = data?.pagination ?? {
    total: 0,
    pageNum: 1,
    pageSize: PAGE_SIZE,
    totalPages: 0,
  }

  const columns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: 'Display name',
      dataIndex: 'displayName',
      key: 'displayName',
      render: (name) => name || '—',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_, client) => (
        <Button
          type="text"
          icon={<SettingOutlined />}
          aria-label={`Settings for ${client.code}`}
          title="Settings"
          onClick={() => setSelectedClientCode(client.code)}
        />
      ),
    },
  ]

  return (
    <Flex vertical gap="middle" style={{ flex: 1, minHeight: 0 }}>
      <Flex wrap="wrap" gap="middle" align="flex-end">
        <Input.Search
          allowClear
          placeholder="Filter client code…"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          style={{ maxWidth: 320 }}
          aria-label="Search by code"
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setShowCreateModal(true)}
          style={{ marginLeft: 'auto' }}
        >
          Add client
        </Button>
      </Flex>

      {isError && (
        <Alert type="error" message={error.message} showIcon />
      )}

      <Table
        rowKey="code"
        columns={columns}
        dataSource={clients}
        loading={isLoading || isFetching}
        locale={{ emptyText: 'No clients found' }}
        pagination={{
          current: pagination.pageNum,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: false,
          onChange: (page) => setPageNum(page),
          showTotal: (total, [start, end]) =>
            total === 0 ? 'No results' : `Showing ${start}-${end} of ${total}`,
        }}
        scroll={{ y: 'calc(100vh - 280px)' }}
        size="middle"
      />

      {showCreateModal && (
        <ClientCreateModal onClose={() => setShowCreateModal(false)} />
      )}

      {selectedClientCode && (
        <CsvConfigModal
          clientCode={selectedClientCode}
          onClose={() => setSelectedClientCode(null)}
        />
      )}
    </Flex>
  )
}
