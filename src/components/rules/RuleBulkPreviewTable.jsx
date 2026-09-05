import { DeleteOutlined } from '@ant-design/icons'
import { Button, Input, Table, Tag, Typography } from 'antd'
import { Select } from '../common/Select.jsx'
import {
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
import { revalidateImportRows } from '../../utils/ruleBulkXlsx.js'

const { Text } = Typography

function updateRow(rows, rowId, patch) {
  const next = rows.map((row) => {
    if (row.id !== rowId) {
      return row
    }
    const values = { ...row.values, ...patch }
    return {
      ...row,
      values,
    }
  })
  return revalidateImportRows(next)
}

export function RuleBulkPreviewTable({ rows, onChange }) {
  function handleFieldChange(rowId, field, value) {
    onChange(updateRow(rows, rowId, { [field]: value }))
  }

  function handleRemove(rowId) {
    onChange(rows.filter((row) => row.id !== rowId))
  }

  const columns = [
    {
      title: 'Row',
      dataIndex: 'rowNumber',
      width: 56,
      fixed: 'left',
    },
    {
      title: 'Client',
      dataIndex: ['values', 'client'],
      width: 110,
      render: (_, row) => (
        <Input
          size="small"
          value={row.values.client}
          onChange={(event) => handleFieldChange(row.id, 'client', event.target.value)}
        />
      ),
    },
    {
      title: 'Domain',
      width: 160,
      render: (_, row) => (
        <Select
          size="small"
          style={{ width: '100%' }}
          placeholder="Domain"
          value={row.values.domain || undefined}
          status={!row.values.domain && row.errors.length ? 'error' : undefined}
          options={toSelectOptions(DOMAINS, DOMAIN_LABELS)}
          onChange={(value) => handleFieldChange(row.id, 'domain', value)}
        />
      ),
    },
    {
      title: 'Polarity',
      width: 150,
      render: (_, row) => (
        <Select
          size="small"
          style={{ width: '100%' }}
          placeholder="Polarity"
          value={row.values.polarity || undefined}
          status={!row.values.polarity && row.errors.length ? 'error' : undefined}
          options={toSelectOptions(RULE_POLARITIES, RULE_POLARITY_LABELS)}
          onChange={(value) => handleFieldChange(row.id, 'polarity', value)}
        />
      ),
    },
    {
      title: 'Priority',
      width: 120,
      render: (_, row) => (
        <Select
          size="small"
          style={{ width: '100%' }}
          placeholder="Priority"
          value={row.values.priority || undefined}
          status={!row.values.priority && row.errors.length ? 'error' : undefined}
          options={toSelectOptions(RULE_PRIORITIES, RULE_PRIORITY_LABELS)}
          onChange={(value) => handleFieldChange(row.id, 'priority', value)}
        />
      ),
    },
    {
      title: 'Source',
      width: 150,
      render: (_, row) => (
        <Select
          size="small"
          style={{ width: '100%' }}
          placeholder="Source"
          value={row.values.source || undefined}
          status={!row.values.source && row.errors.length ? 'error' : undefined}
          options={toSelectOptions(RULE_SOURCES, RULE_SOURCE_LABELS)}
          onChange={(value) => handleFieldChange(row.id, 'source', value)}
        />
      ),
    },
    {
      title: 'Rule text',
      width: 280,
      render: (_, row) => (
        <Input.TextArea
          size="small"
          autoSize={{ minRows: 1, maxRows: 4 }}
          value={row.values.ruleText}
          status={!row.values.ruleText && row.errors.length ? 'error' : undefined}
          onChange={(event) => handleFieldChange(row.id, 'ruleText', event.target.value)}
        />
      ),
    },
    {
      title: 'Tags',
      width: 180,
      render: (_, row) => (
        <Input
          size="small"
          placeholder="comma-separated"
          value={row.values.tags}
          onChange={(event) => handleFieldChange(row.id, 'tags', event.target.value)}
        />
      ),
    },
    {
      title: 'Created by',
      width: 120,
      render: (_, row) => (
        <Input
          size="small"
          value={row.values.createdBy}
          onChange={(event) => handleFieldChange(row.id, 'createdBy', event.target.value)}
        />
      ),
    },
    {
      title: 'Status',
      width: 200,
      fixed: 'right',
      render: (_, row) =>
        row.isValid ? (
          <Tag color="success">Valid</Tag>
        ) : (
          <Text type="danger" style={{ fontSize: 12 }}>
            {row.errors.join('; ')}
          </Text>
        ),
    },
    {
      title: '',
      key: 'actions',
      width: 48,
      fixed: 'right',
      render: (_, row) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          aria-label="Remove row"
          onClick={() => handleRemove(row.id)}
        />
      ),
    },
  ]

  return (
    <Table
      className="rules-bulk-preview-table"
      rowKey="id"
      size="small"
      columns={columns}
      dataSource={rows}
      pagination={false}
      scroll={{ x: 1580, y: 360 }}
    />
  )
}
