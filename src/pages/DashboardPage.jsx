import { Card, Typography } from 'antd'
import { FrameworkWorkflowGuide } from '../components/dashboard/FrameworkWorkflowGuide.jsx'

const { Title } = Typography

export function DashboardPage() {
  return (
    <Card style={{ height: '100%' }}>
      <Title level={3} style={{ marginTop: 0 }}>
        Dashboard
      </Title>
      <FrameworkWorkflowGuide />
    </Card>
  )
}
