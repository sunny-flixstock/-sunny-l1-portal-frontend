import { FileTextOutlined, RightOutlined } from '@ant-design/icons'
import { Alert, Card, Col, Row, Spin, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useInstructionTypes } from '../hooks/useSystemInstructions.js'
import {
  INSTRUCTION_TYPE_DESCRIPTIONS,
  instructionTypePath,
} from '../utils/systemInstructionConstants.js'

const { Title, Paragraph, Text } = Typography

export function SystemInstructionsLibraryPage() {
  const navigate = useNavigate()
  const { data: types, isLoading, isError, error } = useInstructionTypes()

  return (
    <Card style={{ height: '100%' }}>
      <Title level={3} style={{ marginTop: 0 }}>
        System instructions library
      </Title>
      <Paragraph type="secondary" style={{ maxWidth: 640 }}>
        Versioned system prompts stored in S3. Each instruction is immutable after
        creation; you can rename active versions or archive them.
      </Paragraph>

      {isError && (
        <Alert type="error" message={error.message} showIcon style={{ marginBottom: 16 }} />
      )}

      {isLoading ? (
        <Spin />
      ) : (
        <Row gutter={[16, 16]}>
          {(types ?? []).map((item) => (
            <Col xs={24} sm={12} lg={8} key={item.instructionType}>
              <Card
                hoverable
                onClick={() => navigate(instructionTypePath(item.instructionType))}
                styles={{ body: { minHeight: 140 } }}
              >
                <FlexBetween
                  icon={<FileTextOutlined style={{ fontSize: 22, color: '#2563eb' }} />}
                  action={<RightOutlined style={{ color: '#94a3b8' }} />}
                />
                <Title level={5} style={{ marginTop: 12, marginBottom: 4 }}>
                  {item.label}
                </Title>
                <Paragraph
                  type="secondary"
                  ellipsis={{ rows: 2 }}
                  style={{ marginBottom: 12, minHeight: 44 }}
                >
                  {INSTRUCTION_TYPE_DESCRIPTIONS[item.instructionType] ?? ''}
                </Paragraph>
                <Text type="secondary">
                  {item.activeCount} active version{item.activeCount === 1 ? '' : 's'}
                </Text>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Card>
  )
}

function FlexBetween({ icon, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      {icon}
      {action}
    </div>
  )
}
