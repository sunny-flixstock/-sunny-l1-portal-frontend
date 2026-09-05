import { Card, Flex, Typography, Button } from 'antd'
import { QuestionCircleOutlined, UploadOutlined } from '@ant-design/icons'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClientSkuStatsTable } from '../components/supportingItems/ClientSkuStatsTable.jsx'
import {
  SupportingItemsUploadTour,
} from '../components/supportingItems/SupportingItemsUploadTour.jsx'
import { clearSupportingItemsUploadTourProgress } from '../utils/supportingItemsUploadTour.js'

const { Title } = Typography

export function SupportingItemsPage() {
  const navigate = useNavigate()
  const [forceTourOpen, setForceTourOpen] = useState(false)
  const listWelcomeRef = useRef(null)
  const listStatsRef = useRef(null)
  const listUploadRef = useRef(null)

  const tourTargets = {
    listWelcome: listWelcomeRef,
    listStats: listStatsRef,
    listUpload: listUploadRef,
  }

  function handleRestartTour() {
    clearSupportingItemsUploadTourProgress()
    setForceTourOpen(true)
    window.setTimeout(() => setForceTourOpen(false), 0)
  }

  return (
    <Card
      ref={listWelcomeRef}
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
      <Flex align="center" justify="space-between" style={{ flexShrink: 0, marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          Supporting Items
        </Title>
        <Flex gap={8}>
          <Button icon={<QuestionCircleOutlined />} onClick={handleRestartTour}>
            Take a tour
          </Button>
          <Button
            ref={listUploadRef}
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => navigate('/supporting-items/upload')}
          >
            Upload supporting items
          </Button>
        </Flex>
      </Flex>
      <div ref={listStatsRef} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <ClientSkuStatsTable />
      </div>
      <SupportingItemsUploadTour
        variant="list"
        targets={tourTargets}
        forceOpen={forceTourOpen}
      />
    </Card>
  )
}
