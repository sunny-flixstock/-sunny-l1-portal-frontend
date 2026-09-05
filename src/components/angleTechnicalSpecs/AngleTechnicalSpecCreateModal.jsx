import { Col, ColorPicker, Form, Input, InputNumber, Modal, Row } from 'antd'
import { Select } from '../common/Select.jsx'
import { useEffect } from 'react'
import { useAllClients } from '../../hooks/useClients.js'
import {
  useAngleTechnicalSpecificationsMeta,
  useCreateAngleTechnicalSpecification,
} from '../../hooks/useAngleTechnicalSpecifications.js'

export function AngleTechnicalSpecCreateModal({ onClose, initialClient }) {
  const [form] = Form.useForm()
  const createMutation = useCreateAngleTechnicalSpecification()
  const { data: meta } = useAngleTechnicalSpecificationsMeta()
  const { data: clients = [] } = useAllClients()

  useEffect(() => {
    if (initialClient) {
      form.setFieldValue('client', initialClient)
    }
    if (meta?.defaultBackgroundColor) {
      form.setFieldValue('backgroundColor', meta.defaultBackgroundColor)
    }
  }, [initialClient, meta, form])

  async function handleSubmit() {
    const values = await form.validateFields()

    const payload = {
      name: values.name.trim(),
      client: values.client,
      dimensions: {
        width: values.width,
        height: values.height,
        dpi: values.dpi,
      },
      background: {
        color:
          typeof values.backgroundColor === 'string'
            ? values.backgroundColor
            : values.backgroundColor?.toHexString?.() ?? '#FFFFFF',
      },
      fileSpecifications: {
        colorMode: values.colorMode,
        fileFormat: values.fileFormat,
      },
    }

    createMutation.mutate(payload, { onSuccess: () => onClose() })
  }

  return (
    <Modal
      title="New angle technical specification"
      open
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Create"
      confirmLoading={createMutation.isPending}
      width={640}
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="client"
              label="Client"
              rules={[{ required: true, message: 'Client is required' }]}
            >
              <Select
                placeholder="Select client"
                options={clients.map((client) => ({
                  value: client.code,
                  label: client.code,
                }))}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="name"
              label="Name"
              rules={[{ required: true, whitespace: true, message: 'Name is required' }]}
            >
              <Input placeholder="e.g. E-commerce front 2000×2000" maxLength={200} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Dimensions" required style={{ marginBottom: 0 }}>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item
                name="width"
                label="Width (px)"
                rules={[{ required: true, message: 'Required' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} placeholder="2000" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="height"
                label="Height (px)"
                rules={[{ required: true, message: 'Required' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} placeholder="2000" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="dpi"
                label="DPI"
                rules={[{ required: true, message: 'Required' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} placeholder="300" />
              </Form.Item>
            </Col>
          </Row>
        </Form.Item>

        <Form.Item
          name="backgroundColor"
          label="Background color"
          rules={[{ required: true, message: 'Background color is required' }]}
        >
          <ColorPicker showText format="hex" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="colorMode"
              label="Color mode"
              rules={[{ required: true, message: 'Color mode is required' }]}
            >
              <Select
                placeholder="Select color mode"
                options={(meta?.colorModes ?? []).map((mode) => ({
                  value: mode,
                  label: mode.toUpperCase(),
                }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="fileFormat"
              label="File format"
              rules={[{ required: true, message: 'File format is required' }]}
            >
              <Select
                placeholder="Select format"
                options={(meta?.fileFormats ?? []).map((format) => ({
                  value: format,
                  label: format.toUpperCase(),
                }))}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  )
}
