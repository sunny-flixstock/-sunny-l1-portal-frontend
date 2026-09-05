import { Card, Typography } from 'antd'
import { ClientsTable } from '../components/clients/ClientsTable.jsx'

const { Title } = Typography

export function ClientsPage() {
  return (
    <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Title level={3} style={{ marginTop: 0 }}>
        Clients
      </Title>
      <ClientsTable />
    </Card>
  )
}
