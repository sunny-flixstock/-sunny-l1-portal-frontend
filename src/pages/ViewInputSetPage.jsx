import { ArrowLeftOutlined, CopyOutlined, EditOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Flex, Popconfirm, Spin, Typography } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'
import { InputSetSummary } from '../components/inputSets/InputSetSummary.jsx'
import { LABELS } from '../constants/brandAiStylistLabels.js'
import { useArchiveInputSet, useInputSet } from '../hooks/useInputSets.js'

const { Title } = Typography

export function ViewInputSetPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, isError, error } = useInputSet(id)
  const archiveMutation = useArchiveInputSet()

  return (
    <Card style={{ height: '100%' }}>
      <Flex align="center" gap={12} style={{ marginBottom: 24 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/input-sets')}
        >
          Back
        </Button>
        <Title level={3} style={{ margin: 0 }}>
          Input set
        </Title>
      </Flex>

      {isLoading ? (
        <Flex justify="center" style={{ padding: 48 }}>
          <Spin size="large" />
        </Flex>
      ) : null}

      {isError ? (
        <Alert type="error" message={error?.message || 'Failed to load input set'} showIcon />
      ) : null}

      {!isLoading && !isError && data ? (
        <InputSetSummary
          detail={data}
          showActions={data.status !== 'archive'}
          actions={
            <Flex gap={8}>
              <Button
                icon={<CopyOutlined />}
                onClick={() => navigate(`/input-sets/${id}/clone`)}
              >
                Clone
              </Button>
              {data.status === 'draft' ? (
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => navigate(`/input-sets/${id}/edit`)}
                >
                  Edit
                </Button>
              ) : null}
              {data.status !== 'archive' ? (
                <Popconfirm
                  title="Archive input set?"
                  description={`Archived input sets are hidden from ${LABELS.stylistVersion.toLowerCase()} creation.`}
                  okText="Archive"
                  onConfirm={() =>
                    archiveMutation.mutate(id, {
                      onSuccess: () => navigate('/input-sets'),
                    })
                  }
                >
                  <Button danger loading={archiveMutation.isPending}>
                    Archive
                  </Button>
                </Popconfirm>
              ) : null}
            </Flex>
          }
        />
      ) : null}
    </Card>
  )
}
