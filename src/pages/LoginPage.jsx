import { Card, Flex, Typography, message } from 'antd'
import { GoogleLogin } from '@react-oauth/google'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/useAppContext.js'
import { setLoggedIn } from '../utils/auth.js'
import { loginWithGoogle } from '../api/authApi.js'

const { Title, Paragraph } = Typography

export function LoginPage() {
  const navigate = useNavigate()
  const { dispatch } = useAppContext()

  async function handleGoogleSuccess(credentialResponse) {
    try {
      const { data } = await loginWithGoogle(credentialResponse.credential)
      setLoggedIn(data.token)
      dispatch({ type: 'LOGIN' })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      message.error(err.message || 'This account is not authorized to access this portal')
    }
  }

  return (
    <Flex align="center" justify="center" style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Card style={{ minWidth: 360, textAlign: 'center' }}>
        <Title level={3} style={{ marginTop: 0 }}>
          Welcome
        </Title>
        <Paragraph type="secondary">Sign in with the Google account authorized for this portal.</Paragraph>
        <Flex justify="center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => message.error('Google sign-in failed')}
          />
        </Flex>
      </Card>
    </Flex>
  )
}
