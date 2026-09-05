import { Card, Typography } from 'antd'
import { FrameworkVersionsTable } from '../components/frameworkVersions/FrameworkVersionsTable.jsx'
import { LABELS } from '../constants/brandAiStylistLabels.js'

const { Title } = Typography

export function FrameworkVersionsPage() {
  return (
    <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Title level={3} style={{ marginTop: 0 }}>
        {LABELS.stylistVersions}
      </Title>
      <FrameworkVersionsTable />
    </Card>
  )
}
