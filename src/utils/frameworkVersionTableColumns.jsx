import { Space, Tag } from 'antd'
import { LABELS } from '../constants/brandAiStylistLabels.js'
import { formatFrameworkGroupLabel } from './frameworkVersionForm.js'
import {
  FRAMEWORK_VERSION_STATUS_COLORS,
  FRAMEWORK_VERSION_STATUS_LABELS,
} from './frameworkVersionConstants.js'

export function formatFrameworkVersionDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

export function renderFrameworkVersionStatus(status, activeProductionFrameworkVersionId, versionId) {
  const isLive =
    activeProductionFrameworkVersionId &&
    versionId &&
    String(activeProductionFrameworkVersionId) === String(versionId)

  return (
    <Space size="small">
      <Tag color={FRAMEWORK_VERSION_STATUS_COLORS[status] ?? 'default'}>
        {FRAMEWORK_VERSION_STATUS_LABELS[status] ?? status ?? '—'}
      </Tag>
      {isLive && <Tag color="success">Live</Tag>}
    </Space>
  )
}

export function buildFrameworkVersionFullColumns({ renderActions }) {
  return [
    { title: 'Version', dataIndex: 'version', key: 'version', width: 90 },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Client', dataIndex: 'client', key: 'client', width: 120 },
    {
      title: LABELS.stylistGroup,
      key: 'frameworkGroup',
      render: (_, row) => formatFrameworkGroupLabel(row.frameworkGroup),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status, row) =>
        renderFrameworkVersionStatus(
          status,
          row.frameworkGroup?.activeProductionFrameworkVersionId,
          row._id,
        ),
    },
    {
      title: 'Input set',
      key: 'inputSet',
      render: (_, row) => row.inputSetSummary?.name ?? '—',
    },
    {
      title: LABELS.stylistVocab,
      key: 'frameworkVocab',
      render: (_, row) => row.frameworkVocabSummary?.name ?? '—',
    },
    {
      title: 'Category registry',
      key: 'categoryRegistry',
      render: (_, row) => row.categoryRegistrySummary?.name ?? '—',
    },
    {
      title: 'Domains',
      key: 'domains',
      render: (_, row) => row.domains?.join(', ') ?? '—',
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: formatFrameworkVersionDate,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 320,
      fixed: 'right',
      render: (_, row) => renderActions(row),
    },
  ]
}

export function buildFrameworkVersionNestedColumns({
  activeProductionFrameworkVersionId,
  renderActions,
}) {
  return [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status, row) =>
        renderFrameworkVersionStatus(status, activeProductionFrameworkVersionId, row._id),
    },
    {
      title: LABELS.stylistVocab,
      key: 'frameworkVocab',
      render: (_, row) => row.frameworkVocabSummary?.name ?? '—',
    },
    {
      title: 'Category registry',
      key: 'categoryRegistry',
      render: (_, row) => row.categoryRegistrySummary?.name ?? '—',
    },
    {
      title: 'Domains',
      key: 'domains',
      render: (_, row) => row.domains?.join(', ') ?? '—',
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: formatFrameworkVersionDate,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 320,
      fixed: 'right',
      render: (_, row) => renderActions(row),
    },
  ]
}
