import { Alert, Card, Flex, Spin } from 'antd'
import { useParams } from 'react-router-dom'
import { InputSetWizard } from '../components/inputSets/InputSetWizard.jsx'
import { useInputSet } from '../hooks/useInputSets.js'
import { buildCloneInitialData } from '../utils/inputSetClone.js'

export function CloneInputSetPage() {
  const { id } = useParams()
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

  return (
    <Card style={{ height: '100%' }}>
      <InputSetWizard
        mode="clone"
        cloneFromId={id}
        cloneFromName={data.name}
        initialData={buildCloneInitialData(data)}
      />
    </Card>
  )
}
