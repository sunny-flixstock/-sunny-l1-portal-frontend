import { DeleteOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { Alert, Button, Flex, Input, Popconfirm, Table, Typography, message } from 'antd'
import { useEffect, useState } from 'react'
import {
  useDeleteFrameworkVocab,
  useFrameworkVocabs,
} from '../../hooks/useFrameworkVocab.js'
import { LABELS } from '../../constants/brandAiStylistLabels.js'
import { FrameworkVocabUploadModal } from './FrameworkVocabUploadModal.jsx'
import { FrameworkVocabViewModal } from './FrameworkVocabViewModal.jsx'

const { Text } = Typography
const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

export function FrameworkVocabTable() {
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [pageNum, setPageNum] = useState(1)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [viewId, setViewId] = useState(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(searchInput.trim())
      setPageNum(1)
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [searchInput])

  const { data, isLoading, isFetching, isError, error } = useFrameworkVocabs({
    q: searchQuery,
    pageNum,
    pageSize: PAGE_SIZE,
  })

  const deleteMutation = useDeleteFrameworkVocab()

  const vocabs = data?.data ?? []
  const pagination = data?.pagination ?? {
    total: 0,
    pageNum: 1,
    pageSize: PAGE_SIZE,
    totalPages: 0,
  }

  useEffect(() => {
    if (isError) {
      message.error(error?.message || `Failed to load ${LABELS.stylistVocab.toLowerCase()}`)
    }
  }, [isError, error])

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Content hash',
      dataIndex: 'contentHash',
      key: 'contentHash',
      render: (hash) => (
        <Text code copyable={{ text: hash }} style={{ fontSize: 12 }}>
          {hash}
        </Text>
      ),
    },
    {
      title: 'Uploaded',
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
            title="View JSON"
            onClick={() => setViewId(row._id)}
          />
          <Popconfirm
            title={`Delete ${LABELS.stylistVocab.toLowerCase()}?`}
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
          aria-label={`Search ${LABELS.stylistVocab.toLowerCase()}`}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setUploadOpen(true)}
          style={{ marginLeft: 'auto' }}
        >
          Upload vocab
        </Button>
      </Flex>

      {isError && <Alert type="error" message={error.message} showIcon />}

      <Table
        rowKey="_id"
        columns={columns}
        dataSource={vocabs}
        loading={isLoading || isFetching}
        locale={{ emptyText: `No ${LABELS.stylistVocab.toLowerCase()} uploaded yet` }}
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

      {uploadOpen && (
        <FrameworkVocabUploadModal onClose={() => setUploadOpen(false)} />
      )}
      {viewId && (
        <FrameworkVocabViewModal vocabId={viewId} onClose={() => setViewId(null)} />
      )}
    </Flex>
  )
}
