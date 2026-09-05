import { DiffOutlined, PlusOutlined } from '@ant-design/icons'
import { Alert, Button, Flex, Input, message, Table } from 'antd'
import { Select } from '../common/Select.jsx'
import { useEffect, useMemo, useState } from 'react'
import { useAllClients } from '../../hooks/useClients.js'
import { useAllFrameworkGroups } from '../../hooks/useFrameworkGroups.js'
import { useFrameworkVersions } from '../../hooks/useFrameworkVersions.js'
import { LABELS } from '../../constants/brandAiStylistLabels.js'
import { formatFrameworkGroupLabel } from '../../utils/frameworkVersionForm.js'
import {
  FRAMEWORK_VERSION_STATUSES,
  FRAMEWORK_VERSION_STATUS_LABELS,
} from '../../utils/frameworkVersionConstants.js'
import { buildFrameworkVersionFullColumns } from '../../utils/frameworkVersionTableColumns.jsx'
import { FrameworkVersionActions } from './FrameworkVersionActions.jsx'
import { FrameworkVersionCompareModal } from './FrameworkVersionCompareModal.jsx'
import { FrameworkVersionDescriptionsModal } from './FrameworkVersionDescriptionsModal.jsx'
import { FrameworkVersionModal } from './FrameworkVersionModal.jsx'

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300

export function FrameworkVersionsTable() {
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [clientFilter, setClientFilter] = useState('')
  const [groupFilter, setGroupFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pageNum, setPageNum] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [startingId, setStartingId] = useState(null)
  const [descriptionsVersion, setDescriptionsVersion] = useState(null)
  const [archivingId, setArchivingId] = useState(null)
  const [makingLiveId, setMakingLiveId] = useState(null)
  const [demotingId, setDemotingId] = useState(null)

  const { data: clients = [] } = useAllClients()
  const { data: groups = [] } = useAllFrameworkGroups({ client: clientFilter })

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(searchInput.trim())
      setPageNum(1)
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [searchInput])

  const { data, isLoading, isFetching, isError, error } = useFrameworkVersions({
    q: searchQuery,
    client: clientFilter,
    frameworkGroupId: groupFilter,
    status: statusFilter,
    pageNum,
    pageSize: PAGE_SIZE,
  })

  const versions = data?.data ?? []
  const pagination = data?.pagination ?? {
    total: 0,
    pageNum: 1,
    pageSize: PAGE_SIZE,
    totalPages: 0,
  }

  useEffect(() => {
    if (isError) {
      message.error(error?.message || `Failed to load ${LABELS.stylistVersions.toLowerCase()}`)
    }
  }, [isError, error])

  const columns = useMemo(
    () =>
      buildFrameworkVersionFullColumns({
        renderActions: (row) => (
          <FrameworkVersionActions
            version={row}
            onViewDescriptions={setDescriptionsVersion}
            startingId={startingId}
            setStartingId={setStartingId}
            archivingId={archivingId}
            setArchivingId={setArchivingId}
            makingLiveId={makingLiveId}
            setMakingLiveId={setMakingLiveId}
            demotingId={demotingId}
            setDemotingId={setDemotingId}
          />
        ),
      }),
    [startingId, archivingId, makingLiveId, demotingId],
  )

  return (
    <Flex vertical gap="middle" style={{ flex: 1, minHeight: 0 }}>
      <Flex wrap="wrap" gap="middle" align="flex-end">
        <Input.Search
          allowClear
          placeholder="Name, version, or client…"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          style={{ width: 260 }}
          aria-label="Search"
        />
        <Select
          allowClear
          placeholder="All clients"
          value={clientFilter || undefined}
          onChange={(value) => {
            setClientFilter(value ?? '')
            setGroupFilter('')
            setPageNum(1)
          }}
          style={{ width: 180 }}
          options={clients.map((client) => ({
            value: client.code,
            label: client.code,
          }))}
          aria-label="Client filter"
        />
        <Select
          allowClear
          placeholder="All groups"
          value={groupFilter || undefined}
          onChange={(value) => {
            setGroupFilter(value ?? '')
            setPageNum(1)
          }}
          style={{ width: 220 }}
          disabled={!clientFilter && groups.length === 0}
          options={groups.map((group) => ({
            value: group._id,
            label: formatFrameworkGroupLabel(group),
          }))}
          aria-label={`${LABELS.stylistGroup} filter`}
        />
        <Select
          allowClear
          placeholder="All statuses"
          value={statusFilter || undefined}
          onChange={(value) => {
            setStatusFilter(value ?? '')
            setPageNum(1)
          }}
          style={{ width: 160 }}
          options={FRAMEWORK_VERSION_STATUSES.map((status) => ({
            value: status,
            label: FRAMEWORK_VERSION_STATUS_LABELS[status],
          }))}
          aria-label="Status filter"
        />
        <Flex gap="small" style={{ marginLeft: 'auto' }}>
          <Button icon={<DiffOutlined />} onClick={() => setCompareOpen(true)}>
            Compare
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            New version
          </Button>
        </Flex>
      </Flex>

      {isError && <Alert type="error" message={error.message} showIcon />}

      <Table
        rowKey="_id"
        columns={columns}
        dataSource={versions}
        loading={isLoading || isFetching}
        locale={{ emptyText: `No ${LABELS.stylistVersions.toLowerCase()} found` }}
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

      {createOpen && <FrameworkVersionModal onClose={() => setCreateOpen(false)} />}

      {compareOpen && (
        <FrameworkVersionCompareModal
          initialClient={clientFilter}
          initialGroupId={groupFilter}
          onClose={() => setCompareOpen(false)}
        />
      )}

      {descriptionsVersion && (
        <FrameworkVersionDescriptionsModal
          version={descriptionsVersion}
          onClose={() => setDescriptionsVersion(null)}
        />
      )}
    </Flex>
  )
}
