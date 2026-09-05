import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { Alert, Button, Flex, Form, Input, Spin, Steps, Typography } from 'antd'
import { Select } from '../common/Select.jsx'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchRules } from '../../api/ruleApi.js'
import { useAllClients } from '../../hooks/useClients.js'
import { useCreateInputSet, useUpdateInputSet } from '../../hooks/useInputSets.js'
import { fetchAllPages } from '../../utils/fetchAllPages.js'
import { InputSetSummary } from './InputSetSummary.jsx'
import { RuleSelectionPanel } from './RuleSelectionPanel.jsx'
import { SelectableExampleImagesGrid } from './SelectableExampleImagesGrid.jsx'

const { Title, Text } = Typography
const STEPS = [
  { title: 'Basic info' },
  { title: 'Rules' },
  { title: 'Examples' },
  { title: 'Summary' },
]

export function InputSetWizard({
  mode = 'create',
  inputSetId,
  cloneFromId,
  cloneFromName,
  initialData,
}) {
  const isEdit = mode === 'edit'
  const isClone = mode === 'clone'
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [step, setStep] = useState(0)
  const [selectedRuleIds, setSelectedRuleIds] = useState(() =>
    (initialData?.rules ?? []).map((rule) => rule._id)
  )
  const [selectedExampleIds, setSelectedExampleIds] = useState(() => {
    const examples = initialData?.examples ?? []
    return new Set(examples.map((image) => image._id))
  })
  const [selectedExamplesById, setSelectedExamplesById] = useState(() => {
    const examples = initialData?.examples ?? []
    return Object.fromEntries(examples.map((image) => [image._id, image]))
  })

  const createMutation = useCreateInputSet()
  const updateMutation = useUpdateInputSet()
  const isSaving = createMutation.isPending || updateMutation.isPending

  const { data: clients = [], isLoading: clientsLoading } = useAllClients()
  const client = Form.useWatch('client', form)

  const formInitialValues = useMemo(
    () =>
      initialData
        ? {
            client: initialData.client,
            name: initialData.name,
            createdBy: initialData.createdBy ?? '',
          }
        : undefined,
    [initialData]
  )

  const {
    data: availableRules = [],
    isLoading: rulesLoading,
    isError: rulesError,
    error: rulesErrorDetail,
  } = useQuery({
    queryKey: ['inputSetWizard', 'rules', client],
    queryFn: () => fetchAllPages((params) => fetchRules({ ...params, client })),
    enabled: Boolean(client),
  })

  const catalogLoading = rulesLoading
  const catalogError = rulesError
    ? rulesErrorDetail?.message || 'Failed to load rules'
    : ''

  function handleClientChange(value) {
    form.setFieldValue('client', value)
    setSelectedRuleIds([])
    setSelectedExampleIds(new Set())
    setSelectedExamplesById({})
  }

  function handleExampleToggle(image, shouldSelect) {
    setSelectedExampleIds((prev) => {
      const next = new Set(prev)
      if (shouldSelect) {
        next.add(image._id)
      } else {
        next.delete(image._id)
      }
      return next
    })
    setSelectedExamplesById((prev) => {
      if (shouldSelect) {
        return { ...prev, [image._id]: image }
      }
      const next = { ...prev }
      delete next[image._id]
      return next
    })
  }

  function clearExampleSelection() {
    setSelectedExampleIds(new Set())
    setSelectedExamplesById({})
  }

  function selectManyExamples(images) {
    setSelectedExampleIds((prev) => {
      const next = new Set(prev)
      for (const image of images) {
        next.add(image._id)
      }
      return next
    })
    setSelectedExamplesById((prev) => {
      const next = { ...prev }
      for (const image of images) {
        next[image._id] = image
      }
      return next
    })
  }

  const summaryDraft = useMemo(() => {
    const values = form.getFieldsValue()
    const ruleById = new Map(availableRules.map((rule) => [rule._id, rule]))
    for (const rule of initialData?.rules ?? []) {
      ruleById.set(rule._id, rule)
    }
    const rules = selectedRuleIds.map((id) => ruleById.get(id)).filter(Boolean)
    const examples = Object.values(selectedExamplesById)
    return {
      name: values.name,
      client: values.client,
      createdBy: values.createdBy,
      status: isEdit ? initialData?.status ?? 'draft' : 'draft',
      rules,
      examples,
    }
  }, [
    form,
    availableRules,
    selectedExamplesById,
    selectedRuleIds,
    isEdit,
    initialData?.status,
    initialData?.rules,
  ])

  async function goNext() {
    if (step === 0) {
      try {
        await form.validateFields(['client', 'name', 'createdBy'])
        setStep(1)
      } catch {
        // validation messages shown by form
      }
      return
    }
    if (step === 1) {
      setStep(2)
      return
    }
    if (step === 2) {
      setStep(3)
    }
  }

  function goBack() {
    setStep((current) => Math.max(0, current - 1))
  }

  function buildPayload(values) {
    return {
      name: values.name.trim(),
      client: values.client,
      createdBy: values.createdBy?.trim() || null,
      clientRulesIds: selectedRuleIds,
      exampleImageIds: [...selectedExampleIds],
    }
  }

  function handleSubmit() {
    const values = form.getFieldsValue()
    const payload = buildPayload(values)

    if (isEdit) {
      updateMutation.mutate(
        { id: inputSetId, body: payload },
        {
          onSuccess: () => {
            navigate(`/input-sets/${inputSetId}`, { replace: true })
          },
        }
      )
      return
    }

    createMutation.mutate(payload, {
      onSuccess: (response) => {
        const id = response?.data?._id
        if (id) {
          navigate(`/input-sets/${id}`, { replace: true })
        } else {
          navigate('/input-sets', { replace: true })
        }
      },
    })
  }

  function handleCancel() {
    if (isEdit) {
      navigate(`/input-sets/${inputSetId}`)
      return
    }
    if (isClone) {
      navigate(`/input-sets/${cloneFromId}`)
      return
    }
    navigate('/input-sets')
  }

  const wizardTitle = isEdit
    ? 'Edit input set'
    : isClone
      ? 'Clone input set'
      : 'Create input set'

  return (
    <div className="input-set-wizard">
      <Flex align="center" justify="space-between" wrap gap={12} style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          {wizardTitle}
        </Title>
        <Button type="link" onClick={handleCancel}>
          {isEdit || isClone ? 'Cancel' : 'Back to list'}
        </Button>
      </Flex>

      {isClone && cloneFromName ? (
        <Alert
          type="info"
          showIcon
          message={`Cloning from "${cloneFromName}". Update the details below and save as a new draft.`}
          style={{ marginBottom: 24 }}
        />
      ) : null}

      <Steps current={step} items={STEPS} style={{ marginBottom: 32 }} />

      <Form
        form={form}
        layout="vertical"
        preserve
        key={isClone ? `clone-${cloneFromId}` : initialData?._id ?? 'create'}
        initialValues={formInitialValues}
      >
        <div style={{ display: step === 0 ? 'block' : 'none', maxWidth: 480 }}>
          <Form.Item
            name="client"
            label="Client"
            rules={[{ required: true, message: 'Select a client' }]}
          >
            <Select
              showSearch
              placeholder="Select client"
              loading={clientsLoading}
              optionFilterProp="label"
              onChange={handleClientChange}
              options={clients.map((c) => ({
                value: c.code,
                label: c.displayName ? `${c.code} — ${c.displayName}` : c.code,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="name"
            label="Name"
            rules={[
              { required: true, message: 'Enter a name' },
              { whitespace: true, message: 'Name cannot be blank' },
            ]}
          >
            <Input placeholder="Unique input set name" />
          </Form.Item>
          <Form.Item name="createdBy" label="Created by">
            <Input placeholder="Optional" />
          </Form.Item>
        </div>
      </Form>

      {step === 1 ? (
        <div>
          {!client ? (
            <Alert type="warning" message="Select a client on the first step." showIcon />
          ) : catalogError ? (
            <Alert type="error" message={catalogError} showIcon />
          ) : (
            <Spin spinning={catalogLoading}>
              <RuleSelectionPanel
                rules={availableRules}
                selectedIds={selectedRuleIds}
                onChange={setSelectedRuleIds}
                client={client}
              />
            </Spin>
          )}
        </div>
      ) : null}

      {step === 2 ? (
        <div>
          <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
            Click a thumbnail to select or deselect. Good and bad types are kept when saved.
          </Text>
          <SelectableExampleImagesGrid
            client={client}
            selectedIds={selectedExampleIds}
            onToggle={handleExampleToggle}
            onSelectMany={selectManyExamples}
            onClearSelection={clearExampleSelection}
          />
        </div>
      ) : null}

      {step === 3 ? (
        <InputSetSummary draft={summaryDraft} showActions={false} />
      ) : null}

      <Flex justify="space-between" style={{ marginTop: 32 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={goBack} disabled={step === 0}>
          Back
        </Button>
        {step < 3 ? (
          <Button type="primary" icon={<ArrowRightOutlined />} onClick={goNext}>
            Next
          </Button>
        ) : (
          <Button type="primary" loading={isSaving} onClick={handleSubmit}>
            {isEdit ? 'Save changes' : isClone ? 'Create clone' : 'Create input set'}
          </Button>
        )}
      </Flex>
    </div>
  )
}
