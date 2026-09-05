import { Descriptions, Modal, Spin, Tag, Typography } from 'antd'
import { useAngleTechnicalSpecification } from '../../hooks/useAngleTechnicalSpecifications.js'
import { formatDimensions, formatFileSpec } from '../../utils/angleTechnicalSpecConstants.js'

const { Text } = Typography

export function AngleTechnicalSpecViewModal({ specId, onClose }) {
  const { data: spec, isLoading, isError, error } = useAngleTechnicalSpecification(specId)

  return (
    <Modal
      title={spec?.name ?? 'Angle technical specification'}
      open
      onCancel={onClose}
      footer={null}
      width={560}
      destroyOnClose
    >
      {isLoading && <Spin />}
      {isError && <Text type="danger">{error?.message}</Text>}
      {spec && (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Client">
            <Tag>{spec.client}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Dimensions">
            {formatDimensions(spec.dimensions)}
          </Descriptions.Item>
          <Descriptions.Item label="Background">
            <span
              style={{
                display: 'inline-block',
                width: 16,
                height: 16,
                borderRadius: 4,
                background: spec.background?.color,
                border: '1px solid #d9d9d9',
                marginRight: 8,
                verticalAlign: 'middle',
              }}
            />
            <Text code>{spec.background?.color}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="File specifications">
            {formatFileSpec(spec.fileSpecifications)}
          </Descriptions.Item>
          <Descriptions.Item label="Spec hash">
            <Text code copyable>
              {spec.specHash}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Created">
            {spec.createdAt ? new Date(spec.createdAt).toLocaleString() : '—'}
          </Descriptions.Item>
        </Descriptions>
      )}
    </Modal>
  )
}
