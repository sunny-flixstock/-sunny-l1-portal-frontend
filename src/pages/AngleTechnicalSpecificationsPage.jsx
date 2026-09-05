import { Card, Typography } from 'antd'
import { AngleTechnicalSpecTable } from '../components/angleTechnicalSpecs/AngleTechnicalSpecTable.jsx'

const { Title } = Typography

export function AngleTechnicalSpecificationsPage() {
  return (
    <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Title level={3} style={{ marginTop: 0 }}>
        Angle technical specifications
      </Title>
      <AngleTechnicalSpecTable />
    </Card>
  )
}
