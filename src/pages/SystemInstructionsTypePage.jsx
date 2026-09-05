import { ArrowLeftOutlined } from '@ant-design/icons'
import { Button, Card, Typography } from 'antd'
import { Link, useParams } from 'react-router-dom'
import { SystemInstructionsTable } from '../components/systemInstructions/SystemInstructionsTable.jsx'
import { INSTRUCTION_TYPE_LABELS } from '../utils/systemInstructionConstants.js'

const { Title } = Typography

export function SystemInstructionsTypePage() {
  const { instructionType } = useParams()
  const label = INSTRUCTION_TYPE_LABELS[instructionType] ?? instructionType

  return (
    <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        style={{ alignSelf: 'flex-start', paddingLeft: 0, marginBottom: 8 }}
      >
        <Link to="/system-instructions">System instructions library</Link>
      </Button>
      <Title level={3} style={{ marginTop: 0 }}>
        {label}
      </Title>
      <SystemInstructionsTable instructionType={instructionType} />
    </Card>
  )
}
