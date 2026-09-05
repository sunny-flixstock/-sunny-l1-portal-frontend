import { Layout } from 'antd'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar.jsx'

const { Content } = Layout

export function PrivateLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((prev) => !prev)} />
      <Layout style={{ overflow: 'hidden' }}>
        <Content
          style={{
            padding: 24,
            overflow: 'auto',
            background: '#f8fafc',
            height: '100%',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
