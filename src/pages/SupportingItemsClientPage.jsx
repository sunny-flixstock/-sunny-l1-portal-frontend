import { Breadcrumb, Card, Flex, Typography } from 'antd'
import { Link, useParams } from 'react-router-dom'
import { SkuListTable } from '../components/supportingItems/SkuListTable.jsx'
import { useClient } from '../hooks/useClients.js'

const { Title, Text } = Typography

export function SupportingItemsClientPage() {
  const { clientCode } = useParams()
  const { data: client } = useClient(clientCode)

  const title = client?.displayName
    ? `${clientCode} — ${client.displayName}`
    : clientCode

  return (
    <Card
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
      styles={{
        body: {
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <Flex vertical gap={8} style={{ marginBottom: 24, flexShrink: 0 }}>
        <Breadcrumb
          items={[
            { title: <Link to="/supporting-items">Supporting Items</Link> },
            { title: clientCode },
          ]}
        />
        <div>
          <Title level={3} style={{ margin: 0 }}>
            {title}
          </Title>
          <Text type="secondary">Supporting items SKUs</Text>
        </div>
      </Flex>
      <SkuListTable clientName={clientCode} />
    </Card>
  )
}
