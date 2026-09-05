import { Card, Typography } from 'antd'
import { RulesTable } from '../components/rules/RulesTable.jsx'

const { Title } = Typography

export function RulesPage() {
  return (
    <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Title level={3} style={{ marginTop: 0 }}>
        Rules
      </Title>
      <RulesTable />
    </Card>
  )
}
