import { Card, Tabs, Typography } from 'antd'
import { useSearchParams } from 'react-router-dom'
import { L1FeedbackUploadPanel } from '../components/l1Feedback/L1FeedbackUploadPanel.jsx'
import { L1FeedbackIssuesList } from '../components/l1Feedback/L1FeedbackIssuesList.jsx'
import { L1GroundTruthTable } from '../components/l1Feedback/L1GroundTruthTable.jsx'
import { GenericFeedbackComposer } from '../components/l1Feedback/GenericFeedbackComposer.jsx'
import { GenericFeedbackList } from '../components/l1Feedback/GenericFeedbackList.jsx'
import { BatchSessionHistory } from '../components/l1Feedback/BatchSessionHistory.jsx'

const { Title } = Typography

export function L1FeedbackPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'upload'

  function handleTabChange(key) {
    const next = new URLSearchParams(searchParams)
    next.set('tab', key)
    if (key !== 'history') {
      next.delete('session')
      next.delete('sessionType')
    }
    setSearchParams(next)
  }

  return (
    <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Title level={3} style={{ marginTop: 0 }}>
        L1 Feedback
      </Title>
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={[
          { key: 'upload', label: 'Upload', children: <L1FeedbackUploadPanel /> },
          { key: 'review', label: 'HITL Review', children: <L1FeedbackIssuesList /> },
          {
            key: 'generic',
            label: 'Generic Feedback',
            children: (
              <>
                <GenericFeedbackComposer />
                <div style={{ marginTop: 16 }}>
                  <GenericFeedbackList />
                </div>
              </>
            ),
          },
          { key: 'versions', label: 'Ground Truth Versions', children: <L1GroundTruthTable /> },
          { key: 'history', label: 'Batch/Session History', children: <BatchSessionHistory /> },
        ]}
      />
    </Card>
  )
}
