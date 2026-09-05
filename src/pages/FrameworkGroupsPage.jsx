import { Card, Typography } from 'antd'
import { FrameworkGroupsTable } from '../components/frameworkGroups/FrameworkGroupsTable.jsx'
import { LABELS } from '../constants/brandAiStylistLabels.js'

const { Title } = Typography

export function FrameworkGroupsPage() {
  return (
    <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Title level={3} style={{ marginTop: 0 }}>
        {LABELS.stylistGroups}
      </Title>
      <FrameworkGroupsTable />
    </Card>
  )
}
