import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { Alert, Button, Divider, Flex, Form, Input, Modal, Spin, Typography } from 'antd'
import { Select } from '../common/Select.jsx'
import { useEffect, useMemo, useState } from 'react'
import { fetchFrameworkGroups } from '../../api/frameworkGroupApi.js'
import { fetchCategoryRegistries } from '../../api/categoryRegistryApi.js'
import { fetchFrameworkVocabs } from '../../api/frameworkVocabApi.js'
import { fetchInputSets } from '../../api/inputSetApi.js'
import { fetchSystemInstructions } from '../../api/systemInstructionApi.js'
import { useAllClients } from '../../hooks/useClients.js'
import { useCreateFrameworkVersion } from '../../hooks/useFrameworkVersions.js'
import { useDescriptionModelCatalog } from '../../hooks/useModelCatalog.js'
import { LABELS } from '../../constants/brandAiStylistLabels.js'
import { fetchAllPages } from '../../utils/fetchAllPages.js'
import { formatConstraint } from '../../utils/frameworkGroupForm.js'
import {
  DEFAULT_DOMAIN_CONFIGS,
  formatFrameworkGroupLabel,
  formatInstructionOption,
  formValuesToPayload,
} from '../../utils/frameworkVersionForm.js'
import { ModelSelectionButton } from './ModelSelectionButton.jsx'

const { Text, Title } = Typography

const LOOKUP_PAGE_SIZE = 100

function frameworkGroupOptionLabel(group) {
  const base = formatFrameworkGroupLabel(group)
  const constraints = [
    formatConstraint(group.gender),
    formatConstraint(group.season),
    formatConstraint(group.category),
  ].filter((part) => part && part !== 'Any')

  if (constraints.length === 0) {
    return `${base} (${group.client})`
  }

  return `${base} (${constraints.join(', ')})`
}

function validateDomainConfigs(_, configs) {
  if (!configs?.length) {
    return Promise.reject(new Error('Add at least one domain'))
  }

  const seen = new Set()
  for (const row of configs) {
    const domain = row?.domain?.trim().toLowerCase()
    if (!domain) {
      return Promise.reject(new Error('Each row needs a domain name'))
    }
    if (seen.has(domain)) {
      return Promise.reject(new Error(`Duplicate domain: ${domain}`))
    }
    seen.add(domain)

    if (!row.descriptionProvider || !row.descriptionModel) {
      return Promise.reject(new Error('Select a model for each description instruction'))
    }
    if (!row.frameworkProvider || !row.frameworkModel) {
      return Promise.reject(new Error(`Select a model for each ${LABELS.stylistInstruction.toLowerCase()}`))
    }
  }

  return Promise.resolve()
}

function InstructionWithModel({
  form,
  listName,
  fieldName,
  restField,
  instructionField,
  providerField,
  modelField,
  instructionLabel,
  instructionOptions,
  modelProviders,
  modelCatalog,
  disabled,
  showLabel,
  showApplyToAll,
}) {
  const provider = Form.useWatch([listName, fieldName, providerField], form)
  const model = Form.useWatch([listName, fieldName, modelField], form)

  return (
    <Flex vertical gap={6} style={{ flex: '2 1 240px', minWidth: 240, marginBottom: 12 }}>
      <Form.Item
        {...restField}
        name={[fieldName, instructionField]}
        label={showLabel ? instructionLabel : undefined}
        rules={[{ required: true, message: 'Required' }]}
        style={{ marginBottom: 0 }}
      >
        <Select
          showSearch
          placeholder="Select instruction…"
          optionFilterProp="label"
          options={instructionOptions}
        />
      </Form.Item>
      <Form.Item {...restField} name={[fieldName, providerField]} hidden>
        <Input />
      </Form.Item>
      <Form.Item {...restField} name={[fieldName, modelField]} hidden>
        <Input />
      </Form.Item>
      <ModelSelectionButton
        providers={modelProviders}
        catalog={modelCatalog}
        provider={provider}
        model={model}
        disabled={disabled}
        ariaLabel={`Select model for ${instructionLabel}`}
        onChange={(nextProvider, nextModel) => {
          form.setFieldValue([listName, fieldName, providerField], nextProvider)
          form.setFieldValue([listName, fieldName, modelField], nextModel)
        }}
        onApplyToAll={
          showApplyToAll
            ? (nextProvider, nextModel) => {
                const rows = form.getFieldValue(listName) ?? []
                form.setFieldsValue({
                  [listName]: rows.map((row) => ({
                    ...row,
                    [providerField]: nextProvider,
                    [modelField]: nextModel,
                  })),
                })
              }
            : undefined
        }
      />
    </Flex>
  )
}

export function FrameworkVersionModal({ onClose }) {
  const [form] = Form.useForm()
  const [lookupLoading, setLookupLoading] = useState(false)
  const [inputSetsLoading, setInputSetsLoading] = useState(false)
  const [allGroups, setAllGroups] = useState([])
  const [descriptionInstructions, setDescriptionInstructions] = useState([])
  const [frameworkInstructions, setFrameworkInstructions] = useState([])
  const [inputSets, setInputSets] = useState([])
  const [frameworkVocabs, setFrameworkVocabs] = useState([])
  const [categoryRegistries, setCategoryRegistries] = useState([])

  const selectedClient = Form.useWatch('client', form)

  const { data: clients = [], isLoading: clientsLoading } = useAllClients()
  const { data: modelCatalogData, isLoading: modelCatalogLoading } = useDescriptionModelCatalog()
  const createMutation = useCreateFrameworkVersion()

  const modelProviders = modelCatalogData?.providers ?? []
  const modelCatalog = modelCatalogData?.catalog ?? {}
  const isSaving = createMutation.isPending

  const descriptionInstructionOptions = useMemo(
    () =>
      descriptionInstructions.map((instruction) => ({
        value: instruction._id,
        label: formatInstructionOption(instruction),
      })),
    [descriptionInstructions],
  )

  const frameworkInstructionOptions = useMemo(
    () =>
      frameworkInstructions.map((instruction) => ({
        value: instruction._id,
        label: formatInstructionOption(instruction),
      })),
    [frameworkInstructions],
  )

  useEffect(() => {
    let cancelled = false

    async function loadLookups() {
      setLookupLoading(true)
      try {
        const [groups, descriptionRows, frameworkRows, vocabRows, registryRows] =
          await Promise.all([
          fetchAllPages(
            (params) => fetchFrameworkGroups(params),
            { pageSize: LOOKUP_PAGE_SIZE },
          ),
          fetchAllPages(
            (params) =>
              fetchSystemInstructions({
                ...params,
                instructionType: 'image_description',
                status: 'active',
              }),
            { pageSize: LOOKUP_PAGE_SIZE },
          ),
          fetchAllPages(
            (params) =>
              fetchSystemInstructions({
                ...params,
                instructionType: 'framework_builder',
                status: 'active',
              }),
            { pageSize: LOOKUP_PAGE_SIZE },
          ),
          fetchAllPages(
            (params) => fetchFrameworkVocabs(params),
            { pageSize: LOOKUP_PAGE_SIZE },
          ),
          fetchAllPages(
            (params) => fetchCategoryRegistries(params),
            { pageSize: LOOKUP_PAGE_SIZE },
          ),
        ])

        if (!cancelled) {
          setAllGroups(groups)
          setDescriptionInstructions(descriptionRows)
          setFrameworkInstructions(frameworkRows)
          setFrameworkVocabs(vocabRows)
          setCategoryRegistries(registryRows)
        }
      } finally {
        if (!cancelled) {
          setLookupLoading(false)
        }
      }
    }

    loadLookups()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selectedClient) {
      setInputSets([])
      return
    }

    let cancelled = false

    async function loadInputSets() {
      setInputSetsLoading(true)
      try {
        const rows = await fetchAllPages(
          (params) => fetchInputSets({ ...params, client: selectedClient }),
          { pageSize: LOOKUP_PAGE_SIZE },
        )
        if (!cancelled) {
          setInputSets(rows.filter((set) => set.status !== 'archive'))
        }
      } finally {
        if (!cancelled) {
          setInputSetsLoading(false)
        }
      }
    }

    loadInputSets()
    return () => {
      cancelled = true
    }
  }, [selectedClient])

  const filteredGroups = useMemo(() => {
    if (!selectedClient) return []
    return allGroups.filter((group) => group.client === selectedClient)
  }, [allGroups, selectedClient])

  function handleClientChange(client) {
    form.setFieldsValue({
      client,
      frameworkGroupId: undefined,
      inputSet: undefined,
    })
  }

  function handleFrameworkGroupChange(frameworkGroupId) {
    const group = filteredGroups.find((row) => row._id === frameworkGroupId)
    if (group) {
      form.setFieldsValue({ client: group.client })
    }
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      createMutation.mutate(formValuesToPayload(values), { onSuccess: () => onClose() })
    })
  }

  const isLoading = clientsLoading || lookupLoading || modelCatalogLoading

  return (
    <Modal
      title={`New ${LABELS.stylistVersion.toLowerCase()}`}
      open
      onCancel={onClose}
      width={960}
      destroyOnHidden
      footer={[
        <Button key="cancel" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={isSaving}
          disabled={isLoading}
          onClick={handleSubmit}
        >
          Create
        </Button>,
      ]}
    >
      <Alert
        type="info"
        message={`Version number is assigned automatically per ${LABELS.stylistGroup.toLowerCase()}. New versions start in draft status.`}
        showIcon
        style={{ marginBottom: 16 }}
      />

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <Spin />
        </div>
      ) : (
        <Form
          form={form}
          layout="vertical"
          disabled={isSaving}
          initialValues={{ domainConfigs: DEFAULT_DOMAIN_CONFIGS }}
        >
          <Form.Item
            name="client"
            label="Client"
            rules={[{ required: true, message: 'Select a client' }]}
          >
            <Select
              placeholder="Select client…"
              onChange={handleClientChange}
              options={clients.map((client) => ({
                value: client.code,
                label: client.code,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="frameworkGroupId"
            label={LABELS.stylistGroup}
            rules={[{ required: true, message: `Select a ${LABELS.stylistGroup.toLowerCase()}` }]}
          >
            <Select
              showSearch
              placeholder={selectedClient ? 'Select group…' : 'Select a client first'}
              disabled={!selectedClient}
              optionFilterProp="label"
              onChange={handleFrameworkGroupChange}
              options={filteredGroups.map((group) => ({
                value: group._id,
                label: frameworkGroupOptionLabel(group),
              }))}
            />
          </Form.Item>

          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Enter a name' }]}
          >
            <Input placeholder="Version display name" />
          </Form.Item>

          <Form.Item label="Version">
            <Input disabled value="Auto-assigned on create" />
          </Form.Item>

          <Form.Item label="Status">
            <Input disabled value="Draft" />
          </Form.Item>

          <Divider />

          <Title level={5} style={{ marginTop: 0 }}>
            Domains and instructions
          </Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
            Define domains for description generation and {LABELS.stylistOutput}. Select an instruction
            and model for each.
          </Text>

          <Form.List name="domainConfigs" rules={[{ validator: validateDomainConfigs }]}>
            {(fields, { add, remove }, { errors }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Flex key={key} gap={8} align="flex-start" wrap="wrap">
                    <Form.Item
                      {...restField}
                      name={[name, 'domain']}
                      label={name === 0 ? 'Domain' : undefined}
                      rules={[{ required: true, message: 'Required' }]}
                      style={{ flex: '1 1 140px', minWidth: 140, marginBottom: 12 }}
                    >
                      <Input placeholder="e.g. styling" />
                    </Form.Item>
                    <InstructionWithModel
                      form={form}
                      listName="domainConfigs"
                      fieldName={name}
                      restField={restField}
                      instructionField="descriptionInstructionId"
                      providerField="descriptionProvider"
                      modelField="descriptionModel"
                      instructionLabel="Description instruction"
                      instructionOptions={descriptionInstructionOptions}
                      modelProviders={modelProviders}
                      modelCatalog={modelCatalog}
                      disabled={isSaving}
                      showLabel={name === 0}
                      showApplyToAll={fields.length > 1}
                    />
                    <InstructionWithModel
                      form={form}
                      listName="domainConfigs"
                      fieldName={name}
                      restField={restField}
                      instructionField="frameworkCreationInstructionId"
                      providerField="frameworkProvider"
                      modelField="frameworkModel"
                      instructionLabel={LABELS.stylistInstruction}
                      instructionOptions={frameworkInstructionOptions}
                      modelProviders={modelProviders}
                      modelCatalog={modelCatalog}
                      disabled={isSaving}
                      showLabel={name === 0}
                      showApplyToAll={fields.length > 1}
                    />
                    {fields.length > 1 ? (
                      <Button
                        type="text"
                        danger
                        icon={<MinusCircleOutlined />}
                        aria-label="Remove domain"
                        onClick={() => remove(name)}
                        style={{ marginTop: name === 0 ? 30 : 0 }}
                      />
                    ) : null}
                  </Flex>
                ))}
                <Form.ErrorList errors={errors} />
                <Button
                  type="dashed"
                  onClick={() =>
                    add({
                      domain: '',
                      descriptionInstructionId: undefined,
                      descriptionProvider: undefined,
                      descriptionModel: undefined,
                      frameworkCreationInstructionId: undefined,
                      frameworkProvider: undefined,
                      frameworkModel: undefined,
                    })
                  }
                  icon={<PlusOutlined />}
                  style={{ marginBottom: 16 }}
                >
                  Add domain
                </Button>
              </>
            )}
          </Form.List>

          <Divider />

          <Form.Item
            name="frameworkVocabId"
            label={LABELS.stylistVocab}
            rules={[{ required: true, message: `Select a ${LABELS.stylistVocab.toLowerCase()}` }]}
            extra={
              frameworkVocabs.length === 0
                ? `Upload vocab on the ${LABELS.stylistVocab} page first.`
                : undefined
            }
          >
            <Select
              showSearch
              placeholder={`Select ${LABELS.stylistVocab.toLowerCase()}…`}
              optionFilterProp="label"
              options={frameworkVocabs.map((vocab) => ({
                value: vocab._id,
                label: vocab.name,
                title: vocab.contentHash,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="categoryRegistryId"
            label="Category registry"
            rules={[{ required: true, message: 'Select a category registry' }]}
            extra={
              categoryRegistries.length === 0
                ? 'Upload a registry on the Category Registry page first.'
                : undefined
            }
          >
            <Select
              showSearch
              placeholder="Select category registry…"
              optionFilterProp="label"
              options={categoryRegistries.map((registry) => ({
                value: registry._id,
                label: registry.name,
                title: registry.contentHash,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="inputSet"
            label="Input set"
            rules={[{ required: true, message: 'Select an input set' }]}
          >
            <Select
              showSearch
              placeholder={selectedClient ? 'Select input set…' : 'Select a client first'}
              disabled={!selectedClient}
              loading={inputSetsLoading}
              optionFilterProp="label"
              options={inputSets.map((set) => ({
                value: set._id,
                label: set.name,
              }))}
            />
          </Form.Item>
        </Form>
      )}
    </Modal>
  )
}
