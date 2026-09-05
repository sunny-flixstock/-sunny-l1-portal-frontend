import { Card, Typography } from 'antd'
import { CategoryRegistryTable } from '../components/categoryRegistry/CategoryRegistryTable.jsx'

const { Title } = Typography

export function CategoryRegistryPage() {
  return (
    <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Title level={3} style={{ marginTop: 0 }}>
        Category Registry
      </Title>
      <CategoryRegistryTable />
    </Card>
  )
}
