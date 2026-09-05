import { Card, Typography } from 'antd'
import { InputSetsTable } from '../components/inputSets/InputSetsTable.jsx'

const { Title } = Typography

export function InputSetsPage() {
  return (
    <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Title level={3} style={{ marginTop: 0 }}>
        Input sets
      </Title>
      <InputSetsTable />
    </Card>
  )
}
