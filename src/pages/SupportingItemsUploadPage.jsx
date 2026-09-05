import { Card, Flex, Typography } from 'antd'
import { SupportingItemsBulkUploadPanel } from '../components/supportingItems/SupportingItemsBulkUploadPanel.jsx'

const { Title, Text } = Typography

export function SupportingItemsUploadPage() {
  return (
    <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Flex vertical gap={8} style={{ marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            Upload supporting items
          </Title>
          <Text type="secondary">Validate CSV barcodes against folder structure</Text>
        </div>
      </Flex>
      <SupportingItemsBulkUploadPanel />
    </Card>
  )
}
