import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Divider, Flex, Form, Input, Modal, Spin, Typography, message } from 'antd'
import { Select } from '../common/Select.jsx'
import { useEffect, useMemo, useState } from 'react'
import { fetchAngleTechnicalSpecifications } from '../../api/angleTechnicalSpecificationApi.js'
import { fetchClientAngles } from '../../api/clientAngleApi.js'
import { useAllClients } from '../../hooks/useClients.js'
import { useAnglePreset, useCreateAnglePreset, useUpdateAnglePreset } from '../../hooks/useAnglePresets.js'
import { fetchAllPages } from '../../utils/fetchAllPages.js'
import { formatDimensions, formatFileSpec } from '../../utils/angleTechnicalSpecConstants.js'
import { NamingPatternInput } from './NamingPatternInput.jsx'

const { Text, Paragraph } = Typography
function createEmptyImageSpec() {
  return {
    key: crypto.randomUUID(),
    angleTechnicalSpecificationId: undefined,
    namingPattern: '',
  }
}

function createEntryFromAngle(angle) {
  return {
    clientAngleId: angle._id,
    angleName: angle.name,
    imageSpecs: [createEmptyImageSpec()],
  }
}

export function AnglePresetCreateModal({ onClose, presetId }) {
  const isEdit = Boolean(presetId)
  const [form] = Form.useForm()
  const [entries, setEntries] = useState([])
  const client = Form.useWatch('client', form)

  const createMutation = useCreateAnglePreset()
  const updateMutation = useUpdateAnglePreset()
  const { data: preset, isLoading: presetLoading } = useAnglePreset(presetId, isEdit)

  const [clientAngles, setClientAngles] = useState([])
  const [technicalSpecs, setTechnicalSpecs] = useState([])
  const [optionsLoading, setOptionsLoading] = useState(false)

  const { data: clients = [] } = useAllClients()

  useEffect(() => {
    if (!client) {
      setClientAngles([])
      setTechnicalSpecs([])
      return
    }

    let cancelled = false
    setOptionsLoading(true)

    Promise.all([
      fetchAllPages((params) =>
        fetchClientAngles({ ...params, client, status: 'active' }),
      ),
      fetchAllPages((params) =>
        fetchAngleTechnicalSpecifications({ ...params, client }),
      ),
    ])
      .then(([angles, specs]) => {
        if (!cancelled) {
          setClientAngles(angles)
          setTechnicalSpecs(specs)
        }
      })
      .catch(() => {
        if (!cancelled) {
          message.error('Failed to load angles or specifications for this client')
          setClientAngles([])
          setTechnicalSpecs([])
        }
      })
      .finally(() => {
        if (!cancelled) {
          setOptionsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [client])

  const specOptions = useMemo(
    () =>
      technicalSpecs.map((spec) => ({
        value: spec._id,
        label: `${spec.name} (${formatDimensions(spec.dimensions)}, ${formatFileSpec(spec.fileSpecifications)})`,
      })),
    [technicalSpecs],
  )

  const specLabelById = useMemo(
    () => new Map(technicalSpecs.map((spec) => [spec._id, spec.name])),
    [technicalSpecs],
  )

  useEffect(() => {
    if (!isEdit || !preset) return

    form.setFieldsValue({
      name: preset.name,
      client: preset.client,
    })

    setEntries(
      preset.entries.map((entry) => ({
        clientAngleId: entry.clientAngleId,
        angleName: entry.clientAngle?.name ?? entry.clientAngleId,
        imageSpecs: entry.imageSpecs.map((imageSpec) => ({
          key: crypto.randomUUID(),
          angleTechnicalSpecificationId: imageSpec.angleTechnicalSpecificationId,
          namingPattern: imageSpec.namingPattern,
        })),
      })),
    )
  }, [isEdit, preset, form])

  function handleClientChange() {
    setEntries([])
  }

  function handleAnglesChange(selectedIds) {
    setEntries((current) => {
      const currentMap = new Map(current.map((entry) => [entry.clientAngleId, entry]))
      return selectedIds.map((id) => {
        if (currentMap.has(id)) return currentMap.get(id)
        const angle = clientAngles.find((item) => item._id === id)
        return createEntryFromAngle(angle ?? { _id: id, name: id })
      })
    })
  }

  function updateImageSpec(entryIndex, specIndex, updates) {
    setEntries((current) =>
      current.map((entry, index) => {
        if (index !== entryIndex) return entry
        return {
          ...entry,
          imageSpecs: entry.imageSpecs.map((spec, specIdx) =>
            specIdx === specIndex ? { ...spec, ...updates } : spec,
          ),
        }
      }),
    )
  }

  function addImageSpec(entryIndex) {
    setEntries((current) =>
      current.map((entry, index) =>
        index === entryIndex
          ? { ...entry, imageSpecs: [...entry.imageSpecs, createEmptyImageSpec()] }
          : entry,
      ),
    )
  }

  function removeImageSpec(entryIndex, specIndex) {
    setEntries((current) =>
      current.map((entry, index) => {
        if (index !== entryIndex) return entry
        if (entry.imageSpecs.length <= 1) return entry
        return {
          ...entry,
          imageSpecs: entry.imageSpecs.filter((_, specIdx) => specIdx !== specIndex),
        }
      }),
    )
  }

  async function handleSubmit() {
    const values = await form.validateFields()

    if (entries.length === 0) {
      message.error('Select at least one client angle')
      return
    }

    for (const entry of entries) {
      for (const imageSpec of entry.imageSpecs) {
        if (!imageSpec.angleTechnicalSpecificationId) {
          message.error(`Select a technical specification for "${entry.angleName}"`)
          return
        }
        if (!imageSpec.namingPattern?.trim()) {
          message.error(`Enter a naming pattern for "${entry.angleName}"`)
          return
        }
      }
    }

    const entriesPayload = entries.map((entry) => ({
      clientAngleId: entry.clientAngleId,
      imageSpecs: entry.imageSpecs.map((imageSpec) => ({
        angleTechnicalSpecificationId: imageSpec.angleTechnicalSpecificationId,
        namingPattern: imageSpec.namingPattern.trim(),
      })),
    }))

    if (isEdit) {
      updateMutation.mutate(
        { id: presetId, name: values.name.trim(), entries: entriesPayload },
        { onSuccess: () => onClose() },
      )
    } else {
      createMutation.mutate(
        { name: values.name.trim(), client: values.client, entries: entriesPayload },
        { onSuccess: () => onClose() },
      )
    }
  }

  const selectedAngleIds = entries.map((entry) => entry.clientAngleId)
  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Modal
      title={isEdit ? 'Edit angle preset' : 'New angle preset'}
      open
      onCancel={onClose}
      onOk={handleSubmit}
      okText={isEdit ? 'Save' : 'Create'}
      confirmLoading={isPending}
      width={800}
      destroyOnClose
    >
      {presetLoading ? (
        <Spin />
      ) : (
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Flex gap={16}>
            <Form.Item
              name="client"
              label="Client"
              rules={[{ required: true, message: 'Client is required' }]}
              style={{ flex: 1 }}
            >
              <Select
                placeholder="Select client"
                disabled={isEdit}
                onChange={handleClientChange}
                options={clients.map((item) => ({
                  value: item.code,
                  label: item.code,
                }))}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
            <Form.Item
              name="name"
              label="Preset name"
              rules={[{ required: true, whitespace: true, message: 'Name is required' }]}
              style={{ flex: 2 }}
            >
              <Input placeholder="e.g. Standard e-commerce pack" maxLength={200} />
            </Form.Item>
          </Flex>

          {!client && (
            <Alert
              type="info"
              showIcon
              message="Select a client first to choose angles and technical specifications."
              style={{ marginBottom: 16 }}
            />
          )}

          {client && (
            <>
              <Form.Item label="Client angles" required>
                <Select
                  mode="multiple"
                  placeholder="Select client angles to include"
                  value={selectedAngleIds}
                  onChange={handleAnglesChange}
                  loading={optionsLoading}
                  options={clientAngles.map((angle) => ({
                    value: angle._id,
                    label: `${angle.name} (v${angle.version})`,
                  }))}
                  optionFilterProp="label"
                />
              </Form.Item>

              {technicalSpecs.length === 0 && (
                <Alert
                  type="warning"
                  showIcon
                  message="No technical specifications for this client yet."
                  description="Create specifications in Angle technical specifications before building a preset."
                  style={{ marginBottom: 16 }}
                />
              )}

              {entries.length > 0 && (
                <>
                  <Divider style={{ margin: '8px 0 16px' }} />
                  <Paragraph type="secondary" style={{ marginBottom: 12 }}>
                    For each angle, pick the output specification and how the file should be named.
                    Use <Text code>${'{'}</Text>
                    <Text code>field</Text>
                    <Text code>{'}'}</Text> for product data and <Text code>${'{'}</Text>
                    <Text code>ext</Text>
                    <Text code>{'}'}</Text> for the file extension.
                  </Paragraph>

                  <Flex vertical gap={12}>
                    {entries.map((entry, entryIndex) => (
                      <Card
                        key={entry.clientAngleId}
                        size="small"
                        title={entry.angleName}
                        styles={{ body: { paddingTop: 12 } }}
                      >
                        <Flex vertical gap={16}>
                          {entry.imageSpecs.map((imageSpec, specIndex) => (
                            <Flex key={imageSpec.key} vertical gap={8}>
                              {entry.imageSpecs.length > 1 && (
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  Output {specIndex + 1}
                                </Text>
                              )}
                              <Form.Item
                                label="Technical specification"
                                required
                                style={{ marginBottom: 0 }}
                              >
                                <Select
                                  placeholder="Select specification"
                                  value={imageSpec.angleTechnicalSpecificationId}
                                  onChange={(value) =>
                                    updateImageSpec(entryIndex, specIndex, {
                                      angleTechnicalSpecificationId: value,
                                    })
                                  }
                                  loading={optionsLoading}
                                  options={specOptions}
                                  showSearch
                                  optionFilterProp="label"
                                />
                              </Form.Item>
                              <NamingPatternInput
                                value={imageSpec.namingPattern}
                                onChange={(value) =>
                                  updateImageSpec(entryIndex, specIndex, { namingPattern: value })
                                }
                                specLabel={
                                  specLabelById.get(imageSpec.angleTechnicalSpecificationId) ??
                                  null
                                }
                              />
                              {entry.imageSpecs.length > 1 && (
                                <Button
                                  type="text"
                                  danger
                                  size="small"
                                  icon={<DeleteOutlined />}
                                  onClick={() => removeImageSpec(entryIndex, specIndex)}
                                  style={{ alignSelf: 'flex-start' }}
                                >
                                  Remove output
                                </Button>
                              )}
                            </Flex>
                          ))}
                          <Button
                            type="dashed"
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={() => addImageSpec(entryIndex)}
                            style={{ alignSelf: 'flex-start' }}
                          >
                            Add another output for this angle
                          </Button>
                        </Flex>
                      </Card>
                    ))}
                  </Flex>
                </>
              )}
            </>
          )}
        </Form>
      )}
    </Modal>
  )
}
