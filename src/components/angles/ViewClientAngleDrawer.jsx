import {
  Button,
  Descriptions,
  Drawer,
  Flex,
  Image,
  List,
  Popconfirm,
  Spin,
  Tag,
  Typography,
} from 'antd'
import { useState } from 'react'
import {
  useArchiveClientAngle,
  useClientAngle,
  useClientAngleVersions,
} from '../../hooks/useClientAngles.js'
import { imageUrlFromAngleImage } from '../../utils/angleHelpers.js'
import { AngleDefinitionViewer } from './AngleDefinitionViewer.jsx'
import { ClientAngleGenerateModal } from './ClientAngleGenerateModal.jsx'
import { EditAngleDefinitionModal } from './EditAngleDefinitionModal.jsx'
import { RenameAngleModal } from './RenameAngleModal.jsx'

const { Text, Title } = Typography

export function ViewClientAngleDrawer({ angleId, onClose, onVersionCreated }) {
  const [regenerateOpen, setRegenerateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [showVersions, setShowVersions] = useState(false)

  const { data: angle, isLoading, isError, error } = useClientAngle(angleId, {
    includeContent: true,
  })

  const { data: versions, isLoading: versionsLoading } = useClientAngleVersions(
    angle?.seriesKey,
    showVersions && Boolean(angle?.seriesKey),
  )

  const archiveMutation = useArchiveClientAngle()

  const isActive = angle?.status === 'active'

  return (
    <>
      <Drawer
        title={angle?.name ?? 'Client angle'}
        open={Boolean(angleId)}
        onClose={onClose}
        width={720}
        destroyOnHidden
      >
        {isLoading && <Spin />}
        {isError && (
          <Text type="danger">{error?.message ?? 'Failed to load client angle'}</Text>
        )}
        {angle && (
          <>
            <Flex gap="small" wrap style={{ marginBottom: 16 }}>
              <Tag>{angle.client}</Tag>
              <Tag>v{angle.version}</Tag>
              <Tag color={isActive ? 'green' : 'default'}>{angle.status}</Tag>
              <Text code>{angle.seriesKey}</Text>
            </Flex>

            {isActive && (
              <Flex gap="small" wrap style={{ marginBottom: 24 }}>
                <Button onClick={() => setRenameOpen(true)}>Rename</Button>
                <Button type="primary" onClick={() => setEditOpen(true)}>
                  Edit definition
                </Button>
                <Button onClick={() => setRegenerateOpen(true)}>Regenerate</Button>
                <Button onClick={() => setShowVersions((value) => !value)}>
                  {showVersions ? 'Hide versions' : 'Version history'}
                </Button>
                <Popconfirm
                  title="Archive this version?"
                  okText="Archive"
                  onConfirm={() => {
                    archiveMutation.mutate(angle._id, { onSuccess: onClose })
                  }}
                >
                  <Button danger loading={archiveMutation.isPending}>
                    Archive
                  </Button>
                </Popconfirm>
              </Flex>
            )}

            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Base angle series">
                {angle.baseAngleSeriesKey}
              </Descriptions.Item>
              <Descriptions.Item label="Generated">
                {angle.generationMeta?.generatedAt
                  ? new Date(angle.generationMeta.generatedAt).toLocaleString()
                  : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Model">
                {angle.generationMeta?.provider && angle.generationMeta?.model
                  ? `${angle.generationMeta.provider} · ${angle.generationMeta.model}`
                  : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Updated">
                {angle.updatedAt
                  ? new Date(angle.updatedAt).toLocaleString()
                  : '—'}
              </Descriptions.Item>
            </Descriptions>

            {angle.referenceImages?.length > 0 && (
              <>
                <Title level={5} style={{ marginTop: 24 }}>
                  Reference images
                </Title>
                <Flex wrap gap={8}>
                  {angle.referenceImages.map((image, index) => {
                    const url = imageUrlFromAngleImage(image)
                    return url ? (
                      <Image
                        key={image._id ?? index}
                        src={url}
                        width={96}
                        height={96}
                        style={{ objectFit: 'cover' }}
                      />
                    ) : null
                  })}
                </Flex>
              </>
            )}

            <Title level={5} style={{ marginTop: 24 }}>
              Generated definition
            </Title>
            <AngleDefinitionViewer markdown={angle.definitionMarkdown} />

            {showVersions && (
              <>
                <Title level={5} style={{ marginTop: 24 }}>
                  Version history
                </Title>
                {versionsLoading && <Spin size="small" />}
                <List
                  size="small"
                  dataSource={versions ?? []}
                  renderItem={(item) => (
                    <List.Item>
                      <Flex justify="space-between" style={{ width: '100%' }}>
                        <span>
                          v{item.version} — {item.name}
                        </span>
                        <Tag color={item.status === 'active' ? 'green' : 'default'}>
                          {item.status}
                        </Tag>
                      </Flex>
                    </List.Item>
                  )}
                />
              </>
            )}
          </>
        )}
      </Drawer>

      {editOpen && angle && (
        <EditAngleDefinitionModal
          kind="client"
          seriesKey={angle.seriesKey}
          initialName={angle.name}
          initialMarkdown={angle.definitionMarkdown ?? ''}
          onClose={() => setEditOpen(false)}
          onSaved={(data) => {
            setEditOpen(false)
            onVersionCreated?.(data._id)
          }}
        />
      )}

      {regenerateOpen && angle && (
        <ClientAngleGenerateModal
          seriesKey={angle.seriesKey}
          initialClient={angle.client}
          initialBaseAngleId={angle.baseAngleId}
          initialName={angle.name}
          onClose={() => setRegenerateOpen(false)}
          onGenerated={() => setRegenerateOpen(false)}
        />
      )}

      {renameOpen && angle && (
        <RenameAngleModal
          title="Rename client angle"
          currentName={angle.name}
          angleId={angle._id}
          kind="client"
          onClose={() => setRenameOpen(false)}
        />
      )}
    </>
  )
}
