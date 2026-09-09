import { Card, Space, Typography } from 'antd'
import { FrameworkWorkflowGuide } from '../components/dashboard/FrameworkWorkflowGuide.jsx'
import { BztSportsAutoRunCard } from '../components/dashboard/BztSportsAutoRunCard.jsx'

const { Title } = Typography

export function DashboardPage() {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Title level={3} style={{ marginTop: 0 }}>
          Dashboard
        </Title>
        <FrameworkWorkflowGuide />
      </Card>
      <BztSportsAutoRunCard />
    </Space>
  )
}
