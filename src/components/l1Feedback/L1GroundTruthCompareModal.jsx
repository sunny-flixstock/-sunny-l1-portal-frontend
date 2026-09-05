import { Alert, Button, Empty, Flex, Modal, Spin, Switch, Typography } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { useMemo, useState } from 'react'
import { Select } from '../common/Select.jsx'
import {
  useL1GroundTruthVersionContent,
  useL1GroundTruthVersions,
} from '../../hooks/useL1GroundTruth.js'
import { diffLines } from '../../utils/frameworkVersionCompare.js'
import { downloadTextFile } from '../../utils/downloadTextFile.js'

function versionSuffixedFileName(fileName, versionNumber) {
  const dotIndex = fileName.lastIndexOf('.')
  if (dotIndex === -1) return `${fileName}.v${versionNumber}`
  return `${fileName.slice(0, dotIndex)}.v${versionNumber}${fileName.slice(dotIndex)}`
}

const { Text } = Typography

const LINE_STYLES = {
  equal: { background: 'transparent', color: 'rgba(0, 0, 0, 0.65)' },
  remove: { background: 'rgba(255, 77, 79, 0.12)', color: '#a8071a' },
  add: { background: 'rgba(82, 196, 26, 0.12)', color: '#135200' },
}

const LINE_PREFIX = { equal: ' ', remove: '-', add: '+' }

function versionLabel(version) {
  const tags = []
  if (version.isStaging) tags.push('Staging')
  if (version.isLive) tags.push('Live')
  const suffix = tags.length ? ` · ${tags.join(' + ')}` : ''
  return `v${version.versionNumber}${suffix}`
}

export function L1GroundTruthCompareModal({ document, onClose }) {
  const { data: versions = [], isLoading: versionsLoading } = useL1GroundTruthVersions(document?._id)

  const defaultLeftId = useMemo(
    () => versions.find((v) => v.isLive)?._id ?? versions[0]?._id,
    [versions]
  )
  const defaultRightId = useMemo(
    () => versions.find((v) => v.isStaging)?._id ?? versions[0]?._id,
    [versions]
  )

  const [leftId, setLeftId] = useState(undefined)
  const [rightId, setRightId] = useState(undefined)
  const [onlyChanges, setOnlyChanges] = useState(true)

  const effectiveLeftId = leftId ?? defaultLeftId
  const effectiveRightId = rightId ?? defaultRightId
  const canCompare = Boolean(effectiveLeftId && effectiveRightId && effectiveLeftId !== effectiveRightId)

  const { data: leftVersion, isLoading: leftLoading, isError: leftError, error: leftErr } =
    useL1GroundTruthVersionContent(effectiveLeftId, canCompare)
  const { data: rightVersion, isLoading: rightLoading, isError: rightError, error: rightErr } =
    useL1GroundTruthVersionContent(effectiveRightId, canCompare)

  const lines = useMemo(() => {
    if (!leftVersion || !rightVersion) return []
    return diffLines(leftVersion.content, rightVersion.content)
  }, [leftVersion, rightVersion])

  const changeCount = lines.filter((l) => l.type !== 'equal').length
  const shownLines = onlyChanges ? lines.filter((l) => l.type !== 'equal') : lines
  const contentLoading = canCompare && (leftLoading || rightLoading)
  const contentError = leftError || rightError

  const versionOptions = versions.map((v) => ({ value: v._id, label: versionLabel(v) }))

  return (
    <Modal
      title={document ? `Compare — ${document.fileName}` : 'Compare versions'}
      open={Boolean(document)}
      onCancel={onClose}
      footer={null}
      width={1000}
      destroyOnHidden
    >
      <Flex vertical gap="middle">
        <Flex wrap="wrap" gap="middle" align="flex-end">
          <div style={{ minWidth: 240, flex: 1 }}>
            <Text type="secondary">Version A</Text>
            <Flex gap="small" style={{ marginTop: 4 }}>
              <Select
                placeholder="Select version"
                value={effectiveLeftId}
                onChange={setLeftId}
                loading={versionsLoading}
                style={{ width: '100%' }}
                options={versionOptions.map((o) => ({ ...o, disabled: o.value === effectiveRightId }))}
                aria-label="Version A"
              />
              <Button
                icon={<DownloadOutlined />}
                disabled={!leftVersion}
                onClick={() =>
                  leftVersion &&
                  downloadTextFile(
                    versionSuffixedFileName(document.fileName, leftVersion.versionNumber),
                    leftVersion.content
                  )
                }
              />
            </Flex>
          </div>
          <div style={{ minWidth: 240, flex: 1 }}>
            <Text type="secondary">Version B</Text>
            <Flex gap="small" style={{ marginTop: 4 }}>
              <Select
                placeholder="Select version"
                value={effectiveRightId}
                onChange={setRightId}
                loading={versionsLoading}
                style={{ width: '100%' }}
                options={versionOptions.map((o) => ({ ...o, disabled: o.value === effectiveLeftId }))}
                aria-label="Version B"
              />
              <Button
                icon={<DownloadOutlined />}
                disabled={!rightVersion}
                onClick={() =>
                  rightVersion &&
                  downloadTextFile(
                    versionSuffixedFileName(document.fileName, rightVersion.versionNumber),
                    rightVersion.content
                  )
                }
              />
            </Flex>
          </div>
        </Flex>

        {versions.length < 2 ? (
          <Alert type="info" showIcon message="Need at least two versions to compare" />
        ) : !canCompare ? (
          <Empty description="Select two different versions" />
        ) : contentLoading ? (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <Spin />
          </div>
        ) : contentError ? (
          <Alert type="error" showIcon message={leftErr?.message || rightErr?.message || 'Failed to load version content'} />
        ) : (
          <>
            <Flex justify="space-between" align="center" wrap="wrap" gap="middle">
              <Text type="secondary">
                {changeCount === 0 ? 'Versions are identical' : `${changeCount} differing line${changeCount === 1 ? '' : 's'}`}
              </Text>
              <Flex align="center" gap="small">
                <Text type="secondary">Only changed lines</Text>
                <Switch checked={onlyChanges} onChange={setOnlyChanges} />
              </Flex>
            </Flex>
            {shownLines.length === 0 ? (
              <Empty description="No differing lines to show" />
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
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {shownLines.map((line, index) => (
                  <div
                    key={`${line.type}-${line.leftLine ?? 'x'}-${line.rightLine ?? 'x'}-${index}`}
                    style={{ ...LINE_STYLES[line.type], padding: '0 8px', borderRadius: 2 }}
                  >
                    <Text code style={{ marginRight: 8, opacity: 0.55, fontSize: 11 }}>
                      {LINE_PREFIX[line.type]}
                    </Text>
                    {line.text || ' '}
                  </div>
                ))}
              </pre>
            )}
          </>
        )}
      </Flex>
    </Modal>
  )
}
