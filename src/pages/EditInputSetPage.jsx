import { Alert, Button, Card, Flex, Spin } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'
import { InputSetWizard } from '../components/inputSets/InputSetWizard.jsx'
import { useInputSet } from '../hooks/useInputSets.js'

export function EditInputSetPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, isError, error } = useInputSet(id)

  if (isLoading) {
    return (
      <Card style={{ height: '100%' }}>
        <Flex justify="center" style={{ padding: 48 }}>
          <Spin size="large" />
        </Flex>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card style={{ height: '100%' }}>
        <Alert
          type="error"
          message={error?.message || 'Failed to load input set'}
          showIcon
        />
      </Card>
    )
  }

  if (data?.status !== 'draft') {
    return (
      <Card style={{ height: '100%' }}>
        <Alert
          type="warning"
          message="Only draft input sets can be edited."
          showIcon
          action={
            <Button size="small" onClick={() => navigate(`/input-sets/${id}`)}>
              View input set
            </Button>
          }
        />
      </Card>
    )
  }

  return (
    <Card style={{ height: '100%' }}>
      <InputSetWizard mode="edit" inputSetId={id} initialData={data} />
    </Card>
  )
}
