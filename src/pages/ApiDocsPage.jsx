import { ApiOutlined } from '@ant-design/icons'
import { Alert, Card, Empty, List, Spin, Typography } from 'antd'
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ApiDocViewer } from '../components/apiDocs/ApiDocViewer.jsx'
import { useApiDoc, useApiDocs } from '../hooks/useApiDocs.js'

const { Title, Paragraph, Text } = Typography

const PAGE_HEIGHT = 'calc(100vh - 48px)'

export function ApiDocsPage() {
  const navigate = useNavigate()
  const { docName } = useParams()
  const decodedDocName = docName ? decodeURIComponent(docName) : null

  const {
    data: docs = [],
    isLoading: isListLoading,
    isError: isListError,
    error: listError,
  } = useApiDocs()

  const {
    data: selectedDoc,
    isLoading: isDocLoading,
    isError: isDocError,
    error: docError,
  } = useApiDoc(decodedDocName)

  useEffect(() => {
    if (!docName && docs.length > 0) {
      navigate(`/api-docs/${encodeURIComponent(docs[0].name)}`, { replace: true })
    }
  }, [docName, docs, navigate])

  const activeDocName = decodedDocName ?? docs[0]?.name ?? null

  return (
    <Card
      style={{
        height: PAGE_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
      }}
      styles={{
        body: {
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: 16,
        },
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <Title level={3} style={{ marginTop: 0 }}>
          API Docs
        </Title>
        <Paragraph type="secondary" style={{ maxWidth: 720, marginBottom: 16 }}>
          Partner and integration API reference served from the backend{' '}
          <Text code>API_DOCS</Text> folder.
        </Paragraph>

        {isListError && (
          <Alert type="error" message={listError.message} showIcon style={{ marginBottom: 16 }} />
        )}
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: '280px minmax(0, 1fr)',
          gap: 16,
        }}
      >
        <Card
          size="small"
          title="Documents"
          style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}
          styles={{
            body: {
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              padding: 0,
            },
          }}
        >
          {isListLoading ? (
            <div style={{ padding: 24, textAlign: 'center' }}>
              <Spin />
            </div>
          ) : docs.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No API docs found"
              style={{ padding: 24 }}
            />
          ) : (
            <List
              dataSource={docs}
              renderItem={(item) => {
                const isActive = item.name === activeDocName

                return (
                  <List.Item
                    style={{
                      cursor: 'pointer',
                      padding: '12px 16px',
                      background: isActive ? '#eff6ff' : 'transparent',
                      borderInlineStart: isActive ? '3px solid #2563eb' : '3px solid transparent',
                    }}
                    onClick={() => navigate(`/api-docs/${encodeURIComponent(item.name)}`)}
                  >
                    <List.Item.Meta
                      avatar={<ApiOutlined style={{ color: '#2563eb', fontSize: 18 }} />}
                      title={item.title}
                      description={
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {item.name}
                        </Text>
                      }
                    />
                  </List.Item>
                )
              }}
            />
          )}
        </Card>

        <Card
          size="small"
          title={selectedDoc?.title ?? activeDocName ?? 'Viewer'}
          style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}
          styles={{
            body: {
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              padding: selectedDoc?.format === 'html' ? 0 : 16,
            },
          }}
        >
          {isDocError && (
            <Alert type="error" message={docError.message} showIcon style={{ margin: 16 }} />
          )}

          {!activeDocName ? (
            <Empty description="Select a document" style={{ marginTop: 48 }} />
          ) : isDocLoading ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <Spin />
            </div>
          ) : selectedDoc ? (
            <ApiDocViewer doc={selectedDoc} />
          ) : null}
        </Card>
      </div>
    </Card>
  )
}
