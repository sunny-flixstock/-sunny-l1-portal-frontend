import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  PlusOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import { Alert, Button, Flex, Input, Popconfirm, Table, Tag, Typography } from 'antd'
import { Select } from '../common/Select.jsx'
import { useEffect, useState } from 'react'
import { useAllClients } from '../../hooks/useClients.js'
import { useDeleteRule, useRuleTags, useRules } from '../../hooks/useRules.js'
import {
  joinFilterValues,
  RULE_POLARITIES,
  RULE_POLARITY_LABELS,
  RULE_PRIORITIES,
  RULE_PRIORITY_LABELS,
  RULE_SOURCES,
  RULE_SOURCE_LABELS,
  DOMAINS,
  DOMAIN_LABELS,
  toSelectOptions,
} from '../../utils/ruleConstants.js'
import { RuleBulkDownloadModal } from './RuleBulkDownloadModal.jsx'
import { RuleBulkImportModal } from './RuleBulkImportModal.jsx'
import { RuleModal } from './RuleModal.jsx'

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300
const priorityColors = {
  low: 'default',
  medium: 'blue',
  high: 'orange',
  critical: 'red',
}

export function RulesTable() {
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [clientFilter, setClientFilter] = useState('')
  const [domainFilter, setDomainFilter] = useState([])
  const [polarityFilter, setPolarityFilter] = useState([])
  const [priorityFilter, setPriorityFilter] = useState([])
  const [sourceFilter, setSourceFilter] = useState([])
  const [tagsFilter, setTagsFilter] = useState([])
  const [pageNum, setPageNum] = useState(1)
  const [modalMode, setModalMode] = useState(null)
  const [bulkDownloadOpen, setBulkDownloadOpen] = useState(false)
  const [bulkImportOpen, setBulkImportOpen] = useState(false)

  const { data: clients = [] } = useAllClients()
  const { data: tagOptions = [] } = useRuleTags(clientFilter || undefined)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(searchInput.trim())
      setPageNum(1)
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [searchInput])

  const resetPage = () => setPageNum(1)

  const { data, isLoading, isFetching, isError, error } = useRules({
    q: searchQuery,
    client: clientFilter,
    ruleType: joinFilterValues(domainFilter),
    polarity: joinFilterValues(polarityFilter),
    priority: joinFilterValues(priorityFilter),
    source: joinFilterValues(sourceFilter),
    tags: joinFilterValues(tagsFilter),
    pageNum,
    pageSize: PAGE_SIZE,
  })

  const deleteMutation = useDeleteRule()

  const rules = data?.data ?? []
  const pagination = data?.pagination ?? {
    total: 0,
    pageNum: 1,
    pageSize: PAGE_SIZE,
    totalPages: 0,
  }

  const columns = [
    {
      title: 'Rule',
      dataIndex: 'ruleText',
      key: 'ruleText',
      render: (text) => <div className="rules-table__rule-text">{text}</div>,
    },
    {
      title: 'Details',
      key: 'details',
      width: 280,
      className: 'rules-table__meta',
      render: (_, rule) => (
        <div className="rules-table__meta">
          <Flex wrap gap={4} className="rules-table__meta-tags">
            <Tag>{rule.client}</Tag>
            <Tag color="processing">{DOMAIN_LABELS[rule.ruleType] ?? rule.ruleType}</Tag>
            <Tag>{RULE_POLARITY_LABELS[rule.polarity] ?? rule.polarity}</Tag>
            <Tag color={priorityColors[rule.priority]}>
              {RULE_PRIORITY_LABELS[rule.priority] ?? rule.priority}
            </Tag>
            <Tag color="default">{RULE_SOURCE_LABELS[rule.source] ?? rule.source}</Tag>
            {(rule.tags ?? []).map((tag) => (
              <Tag key={tag} color="cyan">
                {tag}
              </Tag>
            ))}
          </Flex>
          {rule.createdBy ? (
            <Typography.Text type="secondary" className="rules-table__created-by">
              Created by {rule.createdBy}
            </Typography.Text>
          ) : null}
        </div>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 72,
      align: 'center',
      className: 'rules-table__actions-col',
      render: (_, rule) => (
        <Flex gap="small" justify="center">
          <Button
            type="text"
            icon={<EditOutlined />}
            aria-label="Edit rule"
            onClick={() => setModalMode({ type: 'edit', id: rule._id })}
          />
          <Popconfirm
            title="Delete rule?"
            description="This cannot be undone."
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => deleteMutation.mutate(rule._id)}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              aria-label="Delete rule"
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
          placeholder="Search rule text…"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          style={{ width: 220 }}
          aria-label="Search rules"
        />
        <Select
          allowClear
          placeholder="All clients"
          value={clientFilter || undefined}
          onChange={(value) => {
            setClientFilter(value ?? '')
            resetPage()
          }}
          style={{ width: 160 }}
          options={clients.map((client) => ({
            value: client.code,
            label: client.code,
          }))}
          aria-label="Client filter"
        />
        <Select
          mode="multiple"
          allowClear
          placeholder="Domains"
          value={domainFilter}
          onChange={(value) => {
            setDomainFilter(value)
            resetPage()
          }}
          style={{ minWidth: 160 }}
          maxTagCount="responsive"
          options={toSelectOptions(DOMAINS, DOMAIN_LABELS)}
          aria-label="Domain filter"
        />
        <Select
          mode="multiple"
          allowClear
          placeholder="Polarities"
          value={polarityFilter}
          onChange={(value) => {
            setPolarityFilter(value)
            resetPage()
          }}
          style={{ minWidth: 150 }}
          maxTagCount="responsive"
          options={toSelectOptions(RULE_POLARITIES, RULE_POLARITY_LABELS)}
          aria-label="Polarity filter"
        />
        <Select
          mode="multiple"
          allowClear
          placeholder="Priorities"
          value={priorityFilter}
          onChange={(value) => {
            setPriorityFilter(value)
            resetPage()
          }}
          style={{ minWidth: 140 }}
          maxTagCount="responsive"
          options={toSelectOptions(RULE_PRIORITIES, RULE_PRIORITY_LABELS)}
          aria-label="Priority filter"
        />
        <Select
          mode="multiple"
          allowClear
          placeholder="Sources"
          value={sourceFilter}
          onChange={(value) => {
            setSourceFilter(value)
            resetPage()
          }}
          style={{ minWidth: 150 }}
          maxTagCount="responsive"
          options={toSelectOptions(RULE_SOURCES, RULE_SOURCE_LABELS)}
          aria-label="Source filter"
        />
        <Select
          mode="multiple"
          allowClear
          placeholder="Tags"
          value={tagsFilter}
          onChange={(value) => {
            setTagsFilter(value)
            resetPage()
          }}
          style={{ minWidth: 150 }}
          maxTagCount="responsive"
          options={tagOptions.map((tag) => ({ value: tag, label: tag }))}
          aria-label="Tags filter"
        />
        <Flex gap="small" style={{ marginLeft: 'auto' }} wrap="wrap">
          <Button
            icon={<DownloadOutlined />}
            onClick={() => setBulkDownloadOpen(true)}
          >
            Download template
          </Button>
          <Button
            icon={<UploadOutlined />}
            onClick={() => setBulkImportOpen(true)}
          >
            Import from Excel
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalMode({ type: 'create' })}
          >
            New rule
          </Button>
        </Flex>
      </Flex>

      {isError && <Alert type="error" message={error.message} showIcon />}

      <Table
        className="rules-table"
        rowKey="_id"
        columns={columns}
        dataSource={rules}
        loading={isLoading || isFetching}
        locale={{ emptyText: 'No rules found' }}
        rowClassName={(_, index) =>
          index % 2 === 1 ? 'rules-table-row--striped' : ''
        }
        pagination={{
          current: pagination.pageNum,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: false,
          onChange: (page) => setPageNum(page),
          showTotal: (total, [start, end]) =>
            total === 0 ? 'No results' : `Showing ${start}-${end} of ${total}`,
        }}
        scroll={{ y: 'calc(100vh - 360px)' }}
        tableLayout="fixed"
        size="middle"
      />

      {modalMode?.type === 'create' && (
        <RuleModal onClose={() => setModalMode(null)} />
      )}
      {modalMode?.type === 'edit' && (
        <RuleModal ruleId={modalMode.id} onClose={() => setModalMode(null)} />
      )}
      {bulkDownloadOpen && (
        <RuleBulkDownloadModal onClose={() => setBulkDownloadOpen(false)} />
      )}
      {bulkImportOpen && (
        <RuleBulkImportModal onClose={() => setBulkImportOpen(false)} />
      )}
    </Flex>
  )
}
