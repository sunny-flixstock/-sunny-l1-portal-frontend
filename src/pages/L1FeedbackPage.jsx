import { Card, Segmented, Tabs, Typography } from 'antd'
import { useSearchParams } from 'react-router-dom'
import { L1FeedbackUploadPanel } from '../components/l1Feedback/L1FeedbackUploadPanel.jsx'
import { L1FeedbackIssuesList } from '../components/l1Feedback/L1FeedbackIssuesList.jsx'
import { L1GroundTruthTable } from '../components/l1Feedback/L1GroundTruthTable.jsx'
import { GenericFeedbackComposer } from '../components/l1Feedback/GenericFeedbackComposer.jsx'
import { GenericFeedbackList } from '../components/l1Feedback/GenericFeedbackList.jsx'
import { BatchSessionHistory } from '../components/l1Feedback/BatchSessionHistory.jsx'

const { Title } = Typography

/** One entry point for every input shape: images (bad/good, bulk), a
 * generation-bundle ZIP, a free-text requirement, or a SKU config with
 * explicit per-variant feedback. All four submit into the same review
 * pipeline; this is purely which form is showing. URL-backed so refresh
 * keeps your place, same as the tab itself. */
function SubmitFeedbackPanel({ searchParams, setSearchParams }) {
  const mode = searchParams.get('mode') || 'feedback'

  function handleModeChange(value) {
    const next = new URLSearchParams(searchParams)
    next.set('mode', value)
    setSearchParams(next)
  }

  return (
    <>
      <Segmented
        value={mode}
        onChange={handleModeChange}
        style={{ marginBottom: 16 }}
        options={[
          { label: 'Feedback (image / ZIP / text)', value: 'feedback' },
          { label: 'SKU config upload', value: 'sku' },
        ]}
      />
      {mode === 'sku' ? (
        <L1FeedbackUploadPanel />
      ) : (
        <>
          <GenericFeedbackComposer />
          <div id="generic-feedback-list" style={{ marginTop: 16, scrollMarginTop: 16 }}>
            <GenericFeedbackList />
          </div>
        </>
      )}
    </>
  )
}

export function L1FeedbackPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'submit'

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
          {
            key: 'submit',
            label: 'Submit Feedback',
            children: <SubmitFeedbackPanel searchParams={searchParams} setSearchParams={setSearchParams} />,
          },
          { key: 'review', label: 'HITL Review', children: <L1FeedbackIssuesList /> },
          { key: 'versions', label: 'Ground Truth Versions', children: <L1GroundTruthTable /> },
          { key: 'history', label: 'Batch/Session History', children: <BatchSessionHistory /> },
        ]}
      />
    </Card>
  )
}
