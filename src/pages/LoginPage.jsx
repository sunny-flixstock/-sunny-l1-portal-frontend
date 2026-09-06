import { useState } from 'react'
import { Button, Card, Flex, Input, Typography, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/useAppContext.js'
import { setLoggedIn } from '../utils/auth.js'
import { loginWithPassword } from '../api/authApi.js'

const { Title, Paragraph } = Typography

export function LoginPage() {
  const navigate = useNavigate()
  const { dispatch } = useAppContext()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!password) return
    setLoading(true)
    try {
      const { data } = await loginWithPassword(password)
      setLoggedIn(data.token)
      dispatch({ type: 'LOGIN' })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      message.error(err.message || 'Incorrect password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Flex align="center" justify="center" style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Card style={{ minWidth: 360, textAlign: 'center' }}>
        <Title level={3} style={{ marginTop: 0 }}>
          Welcome
        </Title>
        <Paragraph type="secondary">Enter the portal password to continue.</Paragraph>
        <Flex vertical gap="middle">
          <Input.Password
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onPressEnter={handleSubmit}
            autoFocus
          />
          <Button type="primary" block loading={loading} disabled={!password} onClick={handleSubmit}>
            Log in
          </Button>
        </Flex>
      </Card>
    </Flex>
  )
}
