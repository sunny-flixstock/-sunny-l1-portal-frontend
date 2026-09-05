import { useMemo, useState } from 'react'
import { Alert, Button, Empty, Flex, Modal, Segmented, Spin, Typography } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { Select } from '../common/Select.jsx'
import { AngleDefinitionViewer } from '../angles/AngleDefinitionViewer.jsx'
import {
  useL1GroundTruthVersionContent,
  useL1GroundTruthVersions,
} from '../../hooks/useL1GroundTruth.js'
import { downloadTextFile } from '../../utils/downloadTextFile.js'

const { Text } = Typography

function versionLabel(version) {
  const tags = []
  if (version.isStaging) tags.push('Staging')
  if (version.isLive) tags.push('Live')
  return `v${version.versionNumber}${tags.length ? ` · ${tags.join(' + ')}` : ''}`
}

function versionSuffixedFileName(fileName, versionNumber) {
  const dotIndex = fileName.lastIndexOf('.')
  if (dotIndex === -1) return `${fileName}.v${versionNumber}`
  return `${fileName.slice(0, dotIndex)}.v${versionNumber}${fileName.slice(dotIndex)}`
}

export function L1GroundTruthContentModal({ document, onClose }) {
  const { data: versions = [], isLoading: versionsLoading } = useL1GroundTruthVersions(document?._id)
  const [selectedVersionId, setSelectedVersionId] = useState(undefined)
  const [mode, setMode] = useState('formatted')

  const effectiveVersionId =
    selectedVersionId ?? document?.liveVersionId ?? versions.find((v) => v.isLive)?._id

  const { data: version, isLoading, isError, error } = useL1GroundTruthVersionContent(
    effectiveVersionId,
    Boolean(document)
  )

  const versionOptions = useMemo(
    () => versions.map((v) => ({ value: v._id, label: versionLabel(v) })),
    [versions]
  )

  function handleDownload() {
    if (!document || !version) return
    downloadTextFile(versionSuffixedFileName(document.fileName, version.versionNumber), version.content)
  }

  return (
    <Modal
      title={document?.fileName ?? 'View content'}
      open={Boolean(document)}
      onCancel={() => {
        setSelectedVersionId(undefined)
        onClose()
      }}
      footer={null}
      width={900}
      destroyOnHidden
    >
      <Flex vertical gap="middle">
        <Flex justify="space-between" align="center" wrap="wrap" gap="middle">
          <div style={{ minWidth: 220 }}>
            <Text type="secondary">Version</Text>
            <Select
              value={effectiveVersionId}
              onChange={setSelectedVersionId}
              loading={versionsLoading}
              style={{ width: 220, marginTop: 4 }}
              options={versionOptions}
              aria-label="Version"
            />
          </div>
          <Flex align="center" gap="middle">
            <Segmented
              value={mode}
              onChange={setMode}
              options={[
                { label: 'Formatted', value: 'formatted' },
                { label: 'Raw markdown', value: 'raw' },
              ]}
            />
            <Button icon={<DownloadOutlined />} onClick={handleDownload} disabled={!version}>
              Download {version ? `v${version.versionNumber}` : ''}
            </Button>
          </Flex>
        </Flex>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <Spin />
          </div>
        ) : isError ? (
          <Alert type="error" showIcon message={error?.message || 'Failed to load content'} />
        ) : !version?.content ? (
          <Empty description="No content" />
        ) : mode === 'formatted' ? (
          <AngleDefinitionViewer markdown={version.content} />
        ) : (
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
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            <Text>{version.content}</Text>
          </pre>
        )}
      </Flex>
    </Modal>
  )
}
