import {
  AppstoreOutlined,
  DashboardOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  InboxOutlined,
  PictureOutlined,
  ReadOutlined,
  TeamOutlined,
  ApiOutlined,
  BookOutlined,
  BranchesOutlined,
  DatabaseOutlined,
  TagsOutlined,
  AppstoreAddOutlined,
  AimOutlined,
  SettingOutlined,
  AlertOutlined,
} from '@ant-design/icons'
import { Button, Layout, Menu } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import { LABELS } from '../constants/brandAiStylistLabels.js'
import { useAppContext } from '../context/useAppContext.js'
import { clearLoggedIn } from '../utils/auth.js'

const { Sider } = Layout

const navItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/clients', icon: <TeamOutlined />, label: 'Clients' },
  { key: '/framework-groups', icon: <AppstoreOutlined />, label: LABELS.stylistGroups },
  { key: '/framework-versions', icon: <BranchesOutlined />, label: LABELS.stylistVersions },
  { key: '/l1-feedback', icon: <AlertOutlined />, label: 'L1 Feedback' },
  { key: '/framework-vocab', icon: <DatabaseOutlined />, label: LABELS.stylistVocab },
  { key: '/category-registry', icon: <TagsOutlined />, label: 'Category Registry' },
  { key: '/supporting-items', icon: <AppstoreAddOutlined />, label: 'Supporting Items' },
  { key: '/angles', icon: <AimOutlined />, label: 'Angles' },
  {
    key: '/angle-technical-specifications',
    icon: <SettingOutlined />,
    label: 'Angle specs',
  },
  { key: '/rules', icon: <ReadOutlined />, label: 'Rules' },
  {
    key: '/system-instructions',
    icon: <BookOutlined />,
    label: 'System instructions',
  },
  { key: '/example-images', icon: <PictureOutlined />, label: 'Example images' },
  { key: '/input-sets', icon: <InboxOutlined />, label: 'Input sets' },
  { key: '/api-docs', icon: <ApiOutlined />, label: 'API Docs' },
]

export function Sidebar({ collapsed, onToggle }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { dispatch } = useAppContext()

  function handleLogout() {
    clearLoggedIn()
    dispatch({ type: 'LOGOUT' })
    navigate('/login', { replace: true })
  }

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      trigger={null}
      width={240}
      style={{ background: '#0f172a', display: 'flex', flexDirection: 'column' }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: '16px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          minHeight: 56,
          flexShrink: 0,
        }}
      >
        {!collapsed && (
          <span style={{ color: '#fff', fontWeight: 600, fontSize: 18 }}>GTOM</span>
        )}
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{ color: '#e2e8f0' }}
        />
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[
          location.pathname.startsWith('/api-docs')
            ? '/api-docs'
            : location.pathname.startsWith('/input-sets')
              ? '/input-sets'
              : location.pathname.startsWith('/system-instructions')
              ? '/system-instructions'
              : location.pathname.startsWith('/framework-versions')
                ? '/framework-versions'
                : location.pathname.startsWith('/framework-vocab')
                  ? '/framework-vocab'
                  : location.pathname.startsWith('/category-registry')
                    ? '/category-registry'
                    : location.pathname.startsWith('/supporting-items')
                      ? '/supporting-items'
                      : location.pathname.startsWith('/angle-technical-specifications')
                      ? '/angle-technical-specifications'
                      : location.pathname.startsWith('/angles')
                        ? '/angles'
                        : location.pathname,
        ]}
        items={navItems}
        onClick={({ key }) => navigate(key)}
        style={{ flex: 1, background: 'transparent', borderInlineEnd: 'none' }}
      />

      <div style={{ padding: '12px 8px 16px', flexShrink: 0 }}>
        <Button
          type="text"
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          block
          style={{
            color: '#cbd5e1',
            justifyContent: collapsed ? 'center' : 'flex-start',
            height: 40,
          }}
        >
          {!collapsed && 'Logout'}
        </Button>
      </div>
    </Sider>
  )
}
