import { Form, Input, Modal } from 'antd'
import { useRenameBaseAngle } from '../../hooks/useBaseAngles.js'
import { useRenameClientAngle } from '../../hooks/useClientAngles.js'

export function RenameAngleModal({
  title,
  currentName,
  angleId,
  kind = 'base',
  onClose,
  onRenamed,
}) {
  const [form] = Form.useForm()
  const baseRename = useRenameBaseAngle()
  const clientRename = useRenameClientAngle()
  const mutation = kind === 'client' ? clientRename : baseRename

  function handleSubmit() {
    form.validateFields().then((values) => {
      mutation.mutate(
        { id: angleId, name: values.name.trim() },
        {
          onSuccess: () => {
            onRenamed?.()
            onClose()
          },
        },
      )
    })
  }

  return (
    <Modal
      title={title}
      open
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={mutation.isPending}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" initialValues={{ name: currentName }}>
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: 'Name is required' }]}
        >
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  )
}
