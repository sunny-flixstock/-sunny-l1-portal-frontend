import { Modal, Spin, Typography } from 'antd'
import { useCategoryRegistry } from '../../hooks/useCategoryRegistry.js'
import { formatRegistryPreview } from '../../utils/categoryRegistryJson.js'

const { Text } = Typography

export function CategoryRegistryViewModal({ registryId, onClose }) {
  const { data, isLoading, isError, error } = useCategoryRegistry(registryId)

  return (
    <Modal
      title={data?.name || 'Category registry'}
      open
      onCancel={onClose}
      footer={null}
      width={800}
    >
      {isLoading && <Spin />}
      {isError && <Text type="danger">{error?.message || 'Failed to load'}</Text>}
      {data && (
        <>
          <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
            Hash: <Text code copyable>{data.contentHash}</Text>
          </Text>
          <pre
            style={{
              margin: 0,
              maxHeight: '60vh',
              overflow: 'auto',
              padding: 12,
              background: '#f8fafc',
              borderRadius: 8,
              fontSize: 12,
            }}
          >
            {formatRegistryPreview(data.registry)}
          </pre>
        </>
      )}
    </Modal>
  )
}
