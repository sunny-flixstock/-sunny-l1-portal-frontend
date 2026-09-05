import { Alert, Empty, Flex, Modal, Spin, Switch, Tabs, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { Select } from '../common/Select.jsx'
import { LABELS } from '../../constants/brandAiStylistLabels.js'
import { useAllClients } from '../../hooks/useClients.js'
import { useAllFrameworkGroups } from '../../hooks/useFrameworkGroups.js'
import {
  useFrameworkVersionDomainDescriptions,
  useFrameworkVersions,
} from '../../hooks/useFrameworkVersions.js'
import {
  diffDomainDescriptionContents,
  formatVersionCompareOptionLabel,
} from '../../utils/frameworkVersionCompare.js'
import { formatFrameworkGroupLabel } from '../../utils/frameworkVersionForm.js'

const { Text } = Typography

const LINE_STYLES = {
  equal: {
    background: 'transparent',
    color: 'rgba(0, 0, 0, 0.65)',
  },
  remove: {
    background: 'rgba(255, 77, 79, 0.12)',
    color: '#a8071a',
  },
  add: {
    background: 'rgba(82, 196, 26, 0.12)',
    color: '#135200',
  },
}

const LINE_PREFIX = {
  equal: ' ',
  remove: '-',
  add: '+',
}

function sortVersions(versions) {
  return [...versions].sort((a, b) => {
    const versionDiff = Number(b.version) - Number(a.version)
    if (versionDiff !== 0) return versionDiff
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}

function DomainContentDiff({ domainDiff, onlyChanges }) {
  const lines = onlyChanges
    ? domainDiff.lines.filter((line) => line.type !== 'equal')
    : domainDiff.lines

  if (domainDiff.leftMissing && domainDiff.rightMissing) {
    return <Empty description="No file for this domain in either version" />
  }

  if (!domainDiff.changed) {
    return <Text type="secondary">Files are identical</Text>
  }

  if (lines.length === 0) {
    return <Empty description="No differing lines to show" />
  }

  return (
    <pre
      style={{
        margin: 0,
        padding: 12,
        maxHeight: 480,
        overflow: 'auto',
        border: '1px solid #f0f0f0',
        borderRadius: 8,
        background: '#fafafa',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        fontSize: 12,
        lineHeight: 1.5,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {lines.map((line, index) => (
        <div
          key={`${line.type}-${line.leftLine ?? 'x'}-${line.rightLine ?? 'x'}-${index}`}
          style={{
            ...LINE_STYLES[line.type],
            padding: '0 8px',
            borderRadius: 2,
          }}
        >
          <Text code style={{ marginRight: 8, opacity: 0.55, fontSize: 11 }}>
            {LINE_PREFIX[line.type]}
          </Text>
          {line.text || ' '}
        </div>
      ))}
    </pre>
  )
}

export function FrameworkVersionCompareModal({
  onClose,
  initialClient = '',
  initialGroupId = '',
}) {
  const [client, setClient] = useState(initialClient || undefined)
  const [groupId, setGroupId] = useState(initialGroupId || undefined)
  const [leftId, setLeftId] = useState(undefined)
  const [rightId, setRightId] = useState(undefined)
  const [onlyChanges, setOnlyChanges] = useState(true)

  const { data: clients = [] } = useAllClients()
  const { data: groups = [] } = useAllFrameworkGroups({ client: client ?? '' })

  const { data: versionsData, isLoading: versionsLoading } = useFrameworkVersions({
    client: client ?? '',
    frameworkGroupId: groupId ?? '',
    pageSize: 100,
    enabled: Boolean(client && groupId),
  })

  const versions = useMemo(() => sortVersions(versionsData?.data ?? []), [versionsData?.data])

  const canCompare = Boolean(leftId && rightId && leftId !== rightId)

  const {
    data: leftData,
    isLoading: leftLoading,
    isError: leftError,
    error: leftErr,
  } = useFrameworkVersionDomainDescriptions(leftId, canCompare)

  const {
    data: rightData,
    isLoading: rightLoading,
    isError: rightError,
    error: rightErr,
  } = useFrameworkVersionDomainDescriptions(rightId, canCompare)

  const leftVersion = versions.find((entry) => entry._id === leftId)
  const rightVersion = versions.find((entry) => entry._id === rightId)

  const domainDiffs = useMemo(() => {
    if (!leftData || !rightData) return []
    return diffDomainDescriptionContents(leftData.descriptions, rightData.descriptions)
  }, [leftData, rightData])

  const changedDomainCount = domainDiffs.filter((row) => row.changed).length
  const contentLoading = canCompare && (leftLoading || rightLoading)
  const contentError = leftError || rightError

  const versionOptions = versions.map((entry) => ({
    value: entry._id,
    label: formatVersionCompareOptionLabel(entry),
  }))

  function handleClientChange(value) {
    setClient(value)
    setGroupId(undefined)
    setLeftId(undefined)
    setRightId(undefined)
  }

  function handleGroupChange(value) {
    setGroupId(value)
    setLeftId(undefined)
    setRightId(undefined)
  }

  const tabItems = domainDiffs.map((domainDiff) => ({
    key: domainDiff.domain,
    label: domainDiff.changed
      ? `${domainDiff.label} (${domainDiff.changeCount})`
      : domainDiff.label,
    children: <DomainContentDiff domainDiff={domainDiff} onlyChanges={onlyChanges} />,
  }))

  return (
    <Modal
      title={`Compare ${LABELS.stylistVersions.toLowerCase()}`}
      open
      onCancel={onClose}
      footer={null}
      width={1100}
      destroyOnHidden
    >
      <Flex vertical gap="middle">
        <Flex wrap="wrap" gap="middle" align="flex-end">
          <div style={{ minWidth: 160, flex: 1 }}>
            <Text type="secondary">Client</Text>
            <Select
              placeholder="Select client"
              value={client}
              onChange={handleClientChange}
              style={{ width: '100%', marginTop: 4 }}
              options={clients.map((entry) => ({
                value: entry.code,
                label: entry.code,
              }))}
              aria-label="Client"
            />
          </div>
          <div style={{ minWidth: 220, flex: 1 }}>
            <Text type="secondary">{LABELS.stylistGroup}</Text>
            <Select
              placeholder={`Select ${LABELS.stylistGroup.toLowerCase()}`}
              value={groupId}
              onChange={handleGroupChange}
              disabled={!client}
              style={{ width: '100%', marginTop: 4 }}
              options={groups.map((group) => ({
                value: group._id,
                label: formatFrameworkGroupLabel(group),
              }))}
              aria-label={LABELS.stylistGroup}
            />
          </div>
        </Flex>

        <Flex wrap="wrap" gap="middle" align="flex-end">
          <div style={{ minWidth: 260, flex: 1 }}>
            <Text type="secondary">Version A</Text>
            <Select
              placeholder="Select version"
              value={leftId}
              onChange={setLeftId}
              disabled={!groupId}
              loading={versionsLoading}
              style={{ width: '100%', marginTop: 4 }}
              options={versionOptions.map((option) => ({
                ...option,
                disabled: option.value === rightId,
              }))}
              aria-label="Version A"
            />
          </div>
          <div style={{ minWidth: 260, flex: 1 }}>
            <Text type="secondary">Version B</Text>
            <Select
              placeholder="Select version"
              value={rightId}
              onChange={setRightId}
              disabled={!groupId}
              loading={versionsLoading}
              style={{ width: '100%', marginTop: 4 }}
              options={versionOptions.map((option) => ({
                ...option,
                disabled: option.value === leftId,
              }))}
              aria-label="Version B"
            />
          </div>
        </Flex>

        {canCompare && (leftVersion || rightVersion) ? (
          <Text type="secondary">
            Comparing generated stylist files
            {leftVersion ? ` · A: ${formatVersionCompareOptionLabel(leftVersion)}` : ''}
            {rightVersion ? ` · B: ${formatVersionCompareOptionLabel(rightVersion)}` : ''}
          </Text>
        ) : null}

        {!client || !groupId ? (
          <Empty
            description={`Pick a client and ${LABELS.stylistGroup.toLowerCase()} to compare versions`}
          />
        ) : versions.length < 2 ? (
          <Alert
            type="info"
            showIcon
            message={`Need at least two versions in this ${LABELS.stylistGroup.toLowerCase()} to compare`}
          />
        ) : !canCompare ? (
          <Empty description="Select two different versions" />
        ) : contentLoading ? (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <Spin />
          </div>
        ) : contentError ? (
          <Alert
            type="error"
            showIcon
            message={leftErr?.message || rightErr?.message || 'Failed to load stylist files'}
          />
        ) : domainDiffs.length === 0 ? (
          <Empty description="No generated stylist files found for these versions" />
        ) : (
          <>
            <Flex justify="space-between" align="center" wrap="wrap" gap="middle">
              <Text type="secondary">
                {changedDomainCount === 0
                  ? 'All stylist files match'
                  : `${changedDomainCount} of ${domainDiffs.length} file${domainDiffs.length === 1 ? '' : 's'} differ`}
              </Text>
              <Flex align="center" gap="small">
                <Text type="secondary">Only changed lines</Text>
                <Switch checked={onlyChanges} onChange={setOnlyChanges} />
              </Flex>
            </Flex>

            <Tabs
              key={`${leftId}-${rightId}`}
              items={tabItems}
              defaultActiveKey={
                domainDiffs.find((row) => row.changed)?.domain ?? domainDiffs[0]?.domain
              }
            />
          </>
        )}
      </Flex>
    </Modal>
  )
}
