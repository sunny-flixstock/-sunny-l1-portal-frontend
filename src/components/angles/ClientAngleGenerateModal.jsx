import { UploadOutlined } from '@ant-design/icons'
import { Alert, Button, Flex, Form, Input, Modal, Progress, Upload, message } from 'antd'
import { Select } from '../common/Select.jsx'
import { useEffect, useMemo, useState } from 'react'
import { presignClientAngleUploads } from '../../api/clientAngleApi.js'
import { fetchSystemInstructions } from '../../api/systemInstructionApi.js'
import { useAllBaseAngles } from '../../hooks/useBaseAngles.js'
import { useAllClients } from '../../hooks/useClients.js'
import { useGenerateClientAngle } from '../../hooks/useClientAngles.js'
import { useDescriptionModelCatalog } from '../../hooks/useModelCatalog.js'
import { fetchAllPages } from '../../utils/fetchAllPages.js'
import {
  ANGLE_UPLOAD_STATUS,
  isAngleImageFile,
  uploadAngleImagesToS3,
} from '../../utils/angleImageUpload.js'
import { ALLOWED_IMAGE_ACCEPT, allowedImageRejectMessage } from '../../utils/allowedImageFormats.js'
import { ModelSelectionButton } from '../frameworkVersions/ModelSelectionButton.jsx'

const CLIENT_ANGLE_INSTRUCTION_TYPE = 'client_angle_definition'

function formatInstructionOption(instruction) {
  return `${instruction.name} (v${instruction.version})`
}

export function ClientAngleGenerateModal({
  seriesKey,
  initialClient,
  initialBaseAngleId,
  initialName,
  onClose,
  onGenerated,
}) {
  const [form] = Form.useForm()
  const [pendingFiles, setPendingFiles] = useState([])
  const [uploadItems, setUploadItems] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [instructions, setInstructions] = useState([])
  const [instructionsLoading, setInstructionsLoading] = useState(true)
  const [provider, setProvider] = useState(undefined)
  const [model, setModel] = useState(undefined)

  const generateMutation = useGenerateClientAngle()
  const { data: clients = [] } = useAllClients()
  const { data: baseAngles = [] } = useAllBaseAngles({ status: 'active' })

  const { data: modelCatalogData } = useDescriptionModelCatalog()
  const modelProviders = modelCatalogData?.providers ?? []
  const modelCatalog = modelCatalogData?.catalog ?? {}

  const isNewVersion = Boolean(seriesKey)
  const isUploading = uploadItems?.some(
    (item) =>
      item.status === ANGLE_UPLOAD_STATUS.PRESIGNING ||
      item.status === ANGLE_UPLOAD_STATUS.UPLOADING ||
      item.status === ANGLE_UPLOAD_STATUS.QUEUED,
  )

  const overallUploadPercent = uploadItems?.length
    ? Math.round(
      uploadItems.reduce((sum, item) => sum + (item.progress ?? 0), 0) / uploadItems.length,
    )
    : 0

  const uploadFileList = uploadItems
    ? uploadItems.map((item) => ({
      uid: item.uid,
      name: item.fileName,
      status:
        item.status === ANGLE_UPLOAD_STATUS.ERROR
          ? 'error'
          : item.status === ANGLE_UPLOAD_STATUS.DONE
            ? 'done'
            : 'uploading',
      percent: item.progress,
      error: item.error ? { message: item.error } : undefined,
    }))
    : pendingFiles.map((file, index) => ({
      uid: file.uid ?? `${file.name}-${index}`,
      name: file.name,
      status: 'done',
    }))

  useEffect(() => {
    let cancelled = false

    fetchAllPages((params) =>
      fetchSystemInstructions({
        ...params,
        instructionType: CLIENT_ANGLE_INSTRUCTION_TYPE,
        status: 'active',
      }),
    )
      .then((rows) => {
        if (!cancelled) {
          setInstructions(rows)
        }
      })
      .catch(() => {
        if (!cancelled) {
          message.error('Failed to load system instructions')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setInstructionsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const instructionOptions = useMemo(
    () =>
      instructions.map((instruction) => ({
        value: instruction._id,
        label: formatInstructionOption(instruction),
      })),
    [instructions],
  )

  async function handleSubmit() {
    try {
      const values = await form.validateFields()

      if (!provider || !model) {
        message.error('Select a model for generation')
        return
      }

      if (!pendingFiles.length) {
        message.error('Add at least one reference image')
        return
      }

      setSubmitting(true)
      setUploadItems([])

      const referenceImages = await uploadAngleImagesToS3({
        files: pendingFiles,
        presignFn: (body) =>
          presignClientAngleUploads({
            client: isNewVersion ? initialClient : values.client,
            ...body,
          }),
        onItemUpdate: setUploadItems,
      })
      setUploadItems(null)

      const payload = {
        client: isNewVersion ? initialClient : values.client,
        baseAngleId: isNewVersion ? initialBaseAngleId : values.baseAngleId,
        systemInstructionId: values.systemInstructionId,
        provider,
        model,
        referenceImages,
      }

      if (values.name?.trim()) {
        payload.name = values.name.trim()
      }

      if (seriesKey) {
        payload.seriesKey = seriesKey
      }

      generateMutation.mutate(payload, {
        onSuccess: (response) => {
          onGenerated?.(response.data)
          onClose()
        },
        onSettled: () => {
          setSubmitting(false)
          setUploadItems(null)
        },
      })
    } catch {
      setSubmitting(false)
      setUploadItems(null)
    }
  }

  return (
    <Modal
      title={isNewVersion ? 'Regenerate client angle' : 'Generate client angle'}
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
          loading={submitting || generateMutation.isPending}
          onClick={handleSubmit}
        >
          {isUploading
            ? 'Uploading…'
            : submitting || generateMutation.isPending
              ? 'Generating…'
              : 'Generate'}
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          client: initialClient ?? undefined,
          baseAngleId: initialBaseAngleId ?? undefined,
          name: initialName ?? '',
        }}
      >
        {!isNewVersion && (
          <Form.Item
            name="client"
            label="Client"
            rules={[{ required: true, message: 'Client is required' }]}
          >
            <Select
              showSearch
              placeholder="Select client…"
              optionFilterProp="label"
              options={clients.map((client) => ({
                value: client.code,
                label: client.code,
              }))}
            />
          </Form.Item>
        )}

        {!isNewVersion && (
          <Form.Item
            name="baseAngleId"
            label="Base angle"
            rules={[{ required: true, message: 'Base angle is required' }]}
          >
            <Select
              showSearch
              placeholder="Select base angle…"
              optionFilterProp="label"
              options={baseAngles.map((angle) => ({
                value: angle._id,
                label: `${angle.name} (v${angle.version})`,
              }))}
            />
          </Form.Item>
        )}

        <Form.Item
          name="systemInstructionId"
          label="System instruction"
          rules={[{ required: true, message: 'System instruction is required' }]}
          extra={
            instructionsLoading
              ? 'Loading instructions…'
              : instructionOptions.length === 0
                ? 'Create a client_angle_definition instruction in System Instructions first.'
                : undefined
          }
        >
          <Select
            showSearch
            loading={instructionsLoading}
            placeholder="Select instruction…"
            optionFilterProp="label"
            options={instructionOptions}
          />
        </Form.Item>

        <Form.Item name="name" label="Display name (optional)">
          <Input placeholder="Defaults to base angle name" />
        </Form.Item>

        <Form.Item label="Model" required>
          <ModelSelectionButton
            providers={modelProviders}
            catalog={modelCatalog}
            provider={provider}
            model={model}
            onChange={(nextProvider, nextModel) => {
              setProvider(nextProvider)
              setModel(nextModel)
            }}
            ariaLabel="Select generation model"
          />
        </Form.Item>

        <Form.Item label="Reference images" required>
          <Upload
            multiple
            accept={ALLOWED_IMAGE_ACCEPT}
            disabled={submitting}
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
            fileList={uploadFileList}
          >
            <Button icon={<UploadOutlined />} disabled={submitting}>
              Select reference images
            </Button>
          </Upload>
          {uploadItems?.length > 0 && (
            <Progress
              percent={overallUploadPercent}
              size="small"
              status={isUploading ? 'active' : undefined}
              format={() => {
                const doneCount = uploadItems.filter(
                  (item) => item.status === ANGLE_UPLOAD_STATUS.DONE,
                ).length
                return `${doneCount}/${uploadItems.length} uploaded`
              }}
              style={{ marginTop: 8 }}
            />
          )}
        </Form.Item>
      </Form>

      {isNewVersion && (
        <Alert
          type="info"
          showIcon
          message="A new version will be created for this client angle series. Client and base angle are taken from the existing record."
          style={{ marginTop: 8 }}
        />
      )}
    </Modal>
  )
}
