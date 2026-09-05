import { EditOutlined } from '@ant-design/icons'
import { Button, Descriptions, Drawer, Flex, Spin, Table, Tag, Typography } from 'antd'
import { useAnglePreset } from '../../hooks/useAnglePresets.js'
import { formatDimensions, formatFileSpec } from '../../utils/angleTechnicalSpecConstants.js'

const { Text, Paragraph } = Typography

const SHOW_ANGLE_PRESET_EDIT = false

export function ViewAnglePresetDrawer({ presetId, onClose, onEdit }) {
  const { data: preset, isLoading, isError, error } = useAnglePreset(presetId, Boolean(presetId))

  const tableData =
    preset?.entries?.flatMap((entry) =>
      entry.imageSpecs.map((imageSpec, index) => ({
        key: `${entry.clientAngleId}-${index}`,
        angleName: entry.clientAngle?.name ?? '—',
        baseAngle: entry.clientAngle?.baseAngleSeriesKey ?? '—',
        specName: imageSpec.angleTechnicalSpecification?.name ?? '—',
        dimensions: imageSpec.angleTechnicalSpecification?.dimensions,
        fileSpec: imageSpec.angleTechnicalSpecification?.fileSpecifications,
        background: imageSpec.angleTechnicalSpecification?.background?.color,
        namingPattern: imageSpec.namingPattern,
      })),
    ) ?? []

  return (
    <Drawer
      title={preset?.name ?? 'Angle preset'}
      open={Boolean(presetId)}
      onClose={onClose}
      width={720}
      extra={
        SHOW_ANGLE_PRESET_EDIT &&
        preset && (
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => onEdit(preset._id)}
          >
            Edit
          </Button>
        )
      }
    >
      {isLoading && <Spin />}
      {isError && <Text type="danger">{error?.message}</Text>}
      {preset && (
        <Flex vertical gap={24}>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Client">
              <Tag>{preset.client}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Angles">
              {preset.entries?.length ?? 0}
            </Descriptions.Item>
            <Descriptions.Item label="Total outputs">
              {tableData.length}
            </Descriptions.Item>
            <Descriptions.Item label="Updated">
              {preset.updatedAt ? new Date(preset.updatedAt).toLocaleString() : '—'}
            </Descriptions.Item>
          </Descriptions>

          <div>
            <Paragraph strong style={{ marginBottom: 8 }}>
              Angle outputs
            </Paragraph>
            <Table
              rowKey="key"
              size="small"
              pagination={false}
              dataSource={tableData}
              scroll={{ x: true }}
              columns={[
                { title: 'Angle', dataIndex: 'angleName', key: 'angleName' },
                {
                  title: 'Base angle',
                  dataIndex: 'baseAngle',
                  key: 'baseAngle',
                  render: (value) => <Tag>{value}</Tag>,
                },
                { title: 'Specification', dataIndex: 'specName', key: 'specName' },
                {
                  title: 'Dimensions',
                  key: 'dimensions',
                  render: (_, row) => formatDimensions(row.dimensions),
                },
                {
                  title: 'File',
                  key: 'fileSpec',
                  render: (_, row) => formatFileSpec(row.fileSpec),
                },
                {
                  title: 'Background',
                  dataIndex: 'background',
                  key: 'background',
                  render: (color) => <Text code>{color ?? '—'}</Text>,
                },
                {
                  title: 'Naming pattern',
                  dataIndex: 'namingPattern',
                  key: 'namingPattern',
                  render: (value) => <Text code>{value}</Text>,
                },
              ]}
            />
          </div>
        </Flex>
      )}
    </Drawer>
  )
}
