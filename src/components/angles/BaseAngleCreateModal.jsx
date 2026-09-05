import { Button, Form, Input, Modal, Upload, message } from 'antd'
import { useState } from 'react'
import { presignBaseAngleUploads } from '../../api/baseAngleApi.js'
import { useCreateBaseAngle } from '../../hooks/useBaseAngles.js'
import { isAngleImageFile, uploadAngleImagesToS3 } from '../../utils/angleImageUpload.js'
import { ALLOWED_IMAGE_ACCEPT, allowedImageRejectMessage } from '../../utils/allowedImageFormats.js'
import { AngleDefinitionEditor } from './AngleDefinitionEditor.jsx'

const SHOW_SAMPLE_IMAGE_UPLOAD = false

export function BaseAngleCreateModal({ seriesKey, initialName, onClose, onCreated }) {
  const [form] = Form.useForm()
  const [pendingFiles, setPendingFiles] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const createMutation = useCreateBaseAngle()

  const isNewVersion = Boolean(seriesKey)

  async function handleSubmit() {
    try {
      const values = await form.validateFields()
      setSubmitting(true)

      const sampleImages = pendingFiles.length
        ? await uploadAngleImagesToS3({
          files: pendingFiles,
          presignFn: presignBaseAngleUploads,
        })
        : []

      const payload = {
        definitionMarkdown: values.definitionMarkdown.trim(),
        sampleImages,
      }

      if (seriesKey) {
        payload.seriesKey = seriesKey
        if (values.name?.trim()) {
          payload.name = values.name.trim()
        }
      } else {
        payload.name = values.name.trim()
      }

      createMutation.mutate(payload, {
        onSuccess: (response) => {
          onCreated?.(response.data)
          onClose()
        },
        onSettled: () => setSubmitting(false),
      })
    } catch {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title={isNewVersion ? 'New base angle version' : 'Create base angle'}
      open
      onCancel={onClose}
      width={720}
      destroyOnHidden
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={submitting || createMutation.isPending}
          onClick={handleSubmit}
        >
          Save
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          name: initialName ?? '',
          definitionMarkdown: '',
        }}
      >
        {!isNewVersion && (
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Name is required' }]}
          >
            <Input placeholder="e.g. Front View" />
          </Form.Item>
        )}

        {isNewVersion && (
          <Form.Item name="name" label="Name (optional override)">
            <Input placeholder={initialName ?? 'Keep existing name'} />
          </Form.Item>
        )}

        <Form.Item
          name="definitionMarkdown"
          label="Definition"
          rules={[{ required: true, message: 'Definition is required' }]}
        >
          <AngleDefinitionEditor />
        </Form.Item>

        {SHOW_SAMPLE_IMAGE_UPLOAD && (
          <Form.Item label="Sample images">
            <Upload
              multiple
              accept={ALLOWED_IMAGE_ACCEPT}
              beforeUpload={(file) => {
                if (!isAngleImageFile(file)) {
                  message.error(allowedImageRejectMessage(file.name))
                  return Upload.LIST_IGNORE
                }
                setPendingFiles((prev) => [...prev, file])
                return false
              }}
              onRemove={(file) => {
                setPendingFiles((prev) => prev.filter((item) => item.uid !== file.uid))
              }}
              fileList={pendingFiles.map((file, index) => ({
                uid: file.uid ?? `${file.name}-${index}`,
                name: file.name,
                status: 'done',
              }))}
            >
              <Button>Select images</Button>
            </Upload>
          </Form.Item>
        )}
      </Form>
    </Modal>
  )
}
