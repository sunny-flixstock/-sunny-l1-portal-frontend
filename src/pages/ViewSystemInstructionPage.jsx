import { ArrowLeftOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Flex,
  Popconfirm,
  Spin,
  Tag,
  Typography,
} from 'antd'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { RenameInstructionModal } from '../components/systemInstructions/RenameInstructionModal.jsx'
import { SystemInstructionCreateModal } from '../components/systemInstructions/SystemInstructionCreateModal.jsx'
import {
  useArchiveSystemInstruction,
  useSystemInstruction,
} from '../hooks/useSystemInstructions.js'
import {
  INSTRUCTION_TYPE_LABELS,
  instructionDetailPath,
  instructionTypePath,
} from '../utils/systemInstructionConstants.js'

const { Title, Text } = Typography

export function ViewSystemInstructionPage() {
  const { instructionType, id } = useParams()
  const navigate = useNavigate()
  const [renameOpen, setRenameOpen] = useState(false)
  const [newVersionOpen, setNewVersionOpen] = useState(false)

  const label = INSTRUCTION_TYPE_LABELS[instructionType] ?? instructionType

  const { data: instruction, isLoading, isError, error } = useSystemInstruction(id, {
    includeContent: true,
  })

  const archiveMutation = useArchiveSystemInstruction()

  if (isLoading) {
    return (
      <Card>
        <Spin />
      </Card>
    )
  }

  if (isError || !instruction) {
    return (
      <Card>
        <Alert type="error" message={error?.message ?? 'Instruction not found'} showIcon />
        <Button type="link" style={{ paddingLeft: 0, marginTop: 16 }}>
          <Link to={instructionTypePath(instructionType)}>Back to {label}</Link>
        </Button>
      </Card>
    )
  }

  const isActive = instruction.status === 'active'

  return (
    <Card>
      <Button type="link" icon={<ArrowLeftOutlined />} style={{ paddingLeft: 0 }}>
        <Link to={instructionTypePath(instructionType)}>{label}</Link>
      </Button>

      <Flex justify="space-between" align="flex-start" wrap gap="middle">
        <div>
          <Title level={3} style={{ marginTop: 8, marginBottom: 4 }}>
            {instruction.name}
          </Title>
          <Flex gap="small" wrap>
            <Tag>v{instruction.version}</Tag>
            <Tag color={isActive ? 'green' : 'default'}>{instruction.status}</Tag>
          </Flex>
        </div>

        {isActive && (
          <Flex gap="small" wrap>
            <Button icon={<EditOutlined />} onClick={() => setRenameOpen(true)}>
              Rename
            </Button>
            <Button icon={<PlusOutlined />} onClick={() => setNewVersionOpen(true)}>
              New version
            </Button>
            <Popconfirm
              title="Archive this version?"
              okText="Archive"
              onConfirm={() =>
                archiveMutation.mutate(id, {
                  onSuccess: () =>
                    navigate(instructionTypePath(instructionType)),
                })
              }
            >
              <Button danger loading={archiveMutation.isPending}>
                Archive
              </Button>
            </Popconfirm>
          </Flex>
        )}
      </Flex>

      <Descriptions column={1} bordered size="small" style={{ marginTop: 24 }}>
        <Descriptions.Item label="Purpose">{instruction.purpose}</Descriptions.Item>
        <Descriptions.Item label="Series key">
          <Text code>{instruction.seriesKey}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Created">
          {instruction.createdAt
            ? new Date(instruction.createdAt).toLocaleString()
            : '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Updated">
          {instruction.updatedAt
            ? new Date(instruction.updatedAt).toLocaleString()
            : '—'}
        </Descriptions.Item>
      </Descriptions>

      <Title level={5} style={{ marginTop: 32 }}>
        System prompt
      </Title>
      <pre className="system-instruction-prompt">{instruction.systemPrompt ?? ''}</pre>

      <Title level={5} style={{ marginTop: 24 }}>
        Output schema
      </Title>
      <pre className="system-instruction-prompt">
        {JSON.stringify(instruction.outputSchema ?? {}, null, 2)}
      </pre>

      {renameOpen && (
        <RenameInstructionModal
          instruction={instruction}
          onClose={() => setRenameOpen(false)}
        />
      )}

      {newVersionOpen && (
        <SystemInstructionCreateModal
          instructionType={instructionType}
          instructionTypeLabel={label}
          seriesKey={instruction.seriesKey}
          initialName={instruction.name}
          initialPurpose={instruction.purpose}
          onClose={() => setNewVersionOpen(false)}
          onCreated={(created) =>
            navigate(instructionDetailPath(instructionType, created._id))
          }
        />
      )}
    </Card>
  )
}
