import { Card, Divider, Tabs, Typography } from 'antd'
import { useQueryClient } from '@tanstack/react-query'
import { BulkExampleImageUploadPanel } from '../components/exampleImages/BulkExampleImageUploadPanel.jsx'
import { ExampleImageUploadPanel } from '../components/exampleImages/ExampleImageUploadPanel.jsx'
import { ExampleImagesGrid } from '../components/exampleImages/ExampleImagesGrid.jsx'
import { exampleImageKeys } from '../hooks/useExampleImages.js'

const { Title } = Typography

export function ExampleImagesPage() {
  const queryClient = useQueryClient()

  function handleUploadComplete() {
    queryClient.invalidateQueries({ queryKey: exampleImageKeys.all })
  }

  const uploadTabs = [
    {
      key: 'standard',
      label: 'Standard upload',
      children: <ExampleImageUploadPanel onUploadComplete={handleUploadComplete} />,
    },
    {
      key: 'bulk',
      label: 'Bulk upload',
      children: <BulkExampleImageUploadPanel onUploadComplete={handleUploadComplete} />,
    },
  ]

  return (
    <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Title level={3} style={{ marginTop: 0 }}>
        Example images
      </Title>

      <Tabs items={uploadTabs} />

      <Divider style={{ margin: '16px 0' }} />

      <Title level={5} style={{ marginTop: 0 }}>
        All example images
      </Title>
      <ExampleImagesGrid />
    </Card>
  )
}
