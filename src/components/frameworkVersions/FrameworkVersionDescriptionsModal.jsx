import { EditOutlined } from '@ant-design/icons'
import { Alert, Button, Flex, Modal, Select, Spin, Tabs, Typography } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import {
  useFrameworkVersionDomainDescriptions,
  useFrameworkVersions,
} from '../../hooks/useFrameworkVersions.js'
import { AngleDefinitionViewer } from '../angles/AngleDefinitionViewer.jsx'
import { DOMAIN_LABELS } from '../../utils/domainConstants.js'
import { FRAMEWORK_VERSION_STATUS_LABELS } from '../../utils/frameworkVersionConstants.js'
import { EditFrameworkDomainDescriptionModal } from './EditFrameworkDomainDescriptionModal.jsx'

const { Text } = Typography

function domainTabLabel(domain) {
  return DOMAIN_LABELS[domain] ?? domain
}

function formatVersionOptionLabel(entry) {
  const status = FRAMEWORK_VERSION_STATUS_LABELS[entry.status] ?? entry.status
  const isLive =
    entry.frameworkGroup?.activeProductionFrameworkVersionId &&
    String(entry.frameworkGroup.activeProductionFrameworkVersionId) === String(entry._id)
  const liveSuffix = isLive ? ' · Live' : ''
  return `v${entry.version} — ${entry.name} (${status})${liveSuffix}`
}

export function FrameworkVersionDescriptionsModal({ version, onClose }) {
  const [selectedVersionId, setSelectedVersionId] = useState(version._id)
  const [editingDomain, setEditingDomain] = useState(null)

  useEffect(() => {
    setSelectedVersionId(version._id)
    setEditingDomain(null)
  }, [version._id])

  const { data: versionsData, isLoading: versionsLoading } = useFrameworkVersions({
    frameworkGroupId: version.frameworkGroupId,
    pageSize: 100,
    enabled: Boolean(version.frameworkGroupId),
  })

  const sortedVersions = useMemo(() => {
    const siblings = versionsData?.data ?? []
    return [...siblings].sort((a, b) => {
      const versionDiff = Number(b.version) - Number(a.version)
      if (versionDiff !== 0) {
        return versionDiff
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [versionsData?.data])

  const showVersionPicker = Boolean(version.frameworkGroupId) && sortedVersions.length > 1
  const canEdit = selectedVersionId === version._id

  const { data, isLoading, isError, error } = useFrameworkVersionDomainDescriptions(
    selectedVersionId,
    Boolean(selectedVersionId),
  )

  const descriptions = data?.descriptions ?? []
  const displayName = data?.name ?? version.name
  const displayVersion = data?.version ?? version.version

  const tabItems = descriptions.map((entry) => ({
    key: entry.domain,
    label: domainTabLabel(entry.domain),
    children: (
      <Flex vertical gap="middle">
        {canEdit ? (
          <Flex justify="flex-end">
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => setEditingDomain(entry)}
            >
              Edit
            </Button>
          </Flex>
        ) : null}
        <AngleDefinitionViewer markdown={entry.content} />
      </Flex>
    ),
  }))

  function handleVersionChange(nextVersionId) {
    setSelectedVersionId(nextVersionId)
    setEditingDomain(null)
  }

  return (
    <>
      <Modal
        title={`Generated descriptions — ${displayName} (v${displayVersion})`}
        open
        onCancel={onClose}
        footer={null}
        width={960}
        destroyOnHidden
      >
        {showVersionPicker ? (
          <Flex vertical gap={4} style={{ marginBottom: 16 }}>
            <Text type="secondary">Version</Text>
            <Select
              value={selectedVersionId}
              onChange={handleVersionChange}
              loading={versionsLoading}
              options={sortedVersions.map((entry) => ({
                value: entry._id,
                label: formatVersionOptionLabel(entry),
              }))}
              style={{ width: '100%' }}
              aria-label="Select version to preview"
            />
          </Flex>
        ) : null}

        {isLoading && (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <Spin />
          </div>
        )}

        {isError && (
          <Alert type="error" message={error?.message || 'Failed to load descriptions'} showIcon />
        )}

        {!isLoading && !isError && tabItems.length === 0 && (
          <Text type="secondary">No generated descriptions found for this version.</Text>
        )}

        {!isLoading && !isError && tabItems.length > 0 && (
          <Tabs key={selectedVersionId} items={tabItems} defaultActiveKey={tabItems[0]?.key} />
        )}
      </Modal>

      {editingDomain && canEdit && (
        <EditFrameworkDomainDescriptionModal
          frameworkVersionId={version._id}
          domain={editingDomain.domain}
          initialMarkdown={editingDomain.content ?? ''}
          onClose={() => setEditingDomain(null)}
          onSaved={() => setEditingDomain(null)}
        />
      )}
    </>
  )
}
