import { Button, Form, Input, Modal } from 'antd'
import { useUpdateSystemInstructionName } from '../../hooks/useSystemInstructions.js'

export function RenameInstructionModal({ instruction, onClose }) {
  const [form] = Form.useForm()
  const updateMutation = useUpdateSystemInstructionName()

  function handleSubmit() {
    form.validateFields().then((values) => {
      updateMutation.mutate(
        { id: instruction._id, name: values.name.trim() },
        { onSuccess: () => onClose() },
      )
    })
  }

  return (
    <Modal
      title="Rename instruction"
      open
      onCancel={onClose}
      destroyOnHidden
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="save"
          type="primary"
          loading={updateMutation.isPending}
          onClick={handleSubmit}
        >
          Save
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" initialValues={{ name: instruction.name }}>
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: 'Name is required' }]}
        >
          <Input />
        </Form.Item>
      </Form>
      <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>
        Prompt content and other fields are immutable. Create a new version to change
        the system prompt.
      </p>
    </Modal>
  )
}
