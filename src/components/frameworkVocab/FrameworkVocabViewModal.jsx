import { Modal, Spin, Typography } from 'antd'
import { LABELS } from '../../constants/brandAiStylistLabels.js'
import { useFrameworkVocab } from '../../hooks/useFrameworkVocab.js'
import { formatVocabPreview } from '../../utils/frameworkVocabJson.js'

const { Text } = Typography

export function FrameworkVocabViewModal({ vocabId, onClose }) {
  const { data, isLoading, isError, error } = useFrameworkVocab(vocabId)

  return (
    <Modal
      title={data?.name || LABELS.stylistVocab}
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
            {formatVocabPreview(data.vocab)}
          </pre>
        </>
      )}
    </Modal>
  )
}
