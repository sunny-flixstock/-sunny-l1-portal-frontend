import { DownloadOutlined, UploadOutlined } from '@ant-design/icons'
import { Alert, Button, Flex, Progress, Radio, Spin, Statistic, Typography, message } from 'antd'
import { Select } from '../common/Select.jsx'
import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAllClients, useClient } from '../../hooks/useClients.js'
import { skuKeys } from '../../hooks/useSkus.js'
import { validateMappedSkusAgainstCsvConfig } from '../../utils/csvConfigValidation.js'
import { exportUnvalidatedSkus } from '../../utils/supportingItemsCsvExport.js'
import {
  UPLOAD_PHASE,
  runSupportingItemsUploadPipeline,
} from '../../utils/supportingItemsUploadPipeline.js'
import { markSupportingItemsUploadTourCompleted } from '../../utils/supportingItemsUploadTour.js'

const { Text } = Typography

const ASSET_TYPES = {
  CLIENT: 'client',
  INTERNAL: 'internal',
}

const INITIAL_PROGRESS = {
  phase: UPLOAD_PHASE.UPLOADING,
  overallPercent: 0,
  filePercent: 0,
  currentBarcode: null,
  currentFileName: null,
  completedSteps: 0,
  totalSteps: 0,
}

export function SupportingItemsConfigureStep({
  analysis,
  onBack,
  hideBackButton = false,
  assetTypeRef,
  clientRef,
  uploadRef,
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [assetType, setAssetType] = useState(ASSET_TYPES.CLIENT)
  const [clientCode, setClientCode] = useState(undefined)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(INITIAL_PROGRESS)
  const [uploadResult, setUploadResult] = useState(null)

  const { data: clients = [], isLoading: clientsLoading } = useAllClients()
  const { data: client, isLoading: clientLoading, isError: clientError, error } = useClient(
    clientCode,
    assetType === ASSET_TYPES.CLIENT && Boolean(clientCode)
  )

  const clientOptions = useMemo(
    () =>
      clients.map((entry) => ({
        value: entry.code,
        label: entry.displayName ? `${entry.code} — ${entry.displayName}` : entry.code,
      })),
    [clients]
  )

  const configValidation = useMemo(() => {
    if (!analysis?.mapped?.length) {
      return null
    }

    if (assetType === ASSET_TYPES.INTERNAL) {
      if (!clientCode) {
        return null
      }
      return {
        validated: analysis.mapped.map((item) => ({
          ...item,
          normalisedCsvRow: item.csvRow,
        })),
        unvalidated: [],
        validatedCount: analysis.mapped.length,
        unvalidatedCount: 0,
      }
    }

    if (!client?.csvConfig) {
      return null
    }

    return validateMappedSkusAgainstCsvConfig(analysis.mapped, client.csvConfig)
  }, [analysis, assetType, clientCode, client?.csvConfig])

  useEffect(() => {
    setClientCode(undefined)
    setUploadResult(null)
  }, [assetType])

  useEffect(() => {
    if (clientError) {
      message.error(error?.message || 'Failed to load client configuration')
    }
  }, [clientError, error])

  function handleExportUnvalidated() {
    if (!configValidation?.unvalidated.length) {
      message.info('No unvalidated SKUs to export')
      return
    }
    exportUnvalidatedSkus(configValidation.unvalidated)
  }

  async function handleUpload() {
    if (!configValidation?.validated.length || !clientCode) {
      return
    }

    setIsUploading(true)
    setUploadResult(null)
    setUploadProgress(INITIAL_PROGRESS)

    try {
      const summary = await runSupportingItemsUploadPipeline({
        assetType,
        clientName: clientCode,
        validatedSkus: configValidation.validated,
        onProgress: setUploadProgress,
      })

      setUploadResult(summary)

      if (summary.failed === 0) {
        markSupportingItemsUploadTourCompleted()
        message.success(`Uploaded ${summary.succeeded} SKU(s) successfully`)
        queryClient.invalidateQueries({ queryKey: skuKeys.statsByClient() })
        navigate('/supporting-items')
        return
      } else if (summary.succeeded > 0) {
        message.warning(
          `Uploaded ${summary.succeeded} SKU(s); ${summary.failed} failed`
        )
      } else {
        message.error('Upload failed for all SKUs')
      }
    } catch (uploadError) {
      message.error(uploadError.message || 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const awaitingClient = !clientCode
  const awaitingCsvConfig =
    assetType === ASSET_TYPES.CLIENT && clientCode && (clientLoading || !client?.csvConfig)
  const canUpload = Boolean(configValidation?.validatedCount) && !isUploading

  const progressStatus =
    uploadProgress.phase === UPLOAD_PHASE.DONE ? 'success' : 'active'

  const fileProgressLabel =
    uploadProgress.phase === UPLOAD_PHASE.CREATING
      ? `Creating records for ${uploadProgress.currentBarcode}…`
      : uploadProgress.currentFileName
        ? `Uploading ${uploadProgress.currentFileName}`
        : 'Waiting for next file…'

  return (
    <Flex vertical gap="large">
      {!hideBackButton && (
        <div>
          <Button onClick={onBack} disabled={isUploading}>
            Back to mapping
          </Button>
        </div>
      )}

      <div ref={assetTypeRef}>
        <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
          Asset type
        </Text>
        <Radio.Group
          value={assetType}
          onChange={(event) => setAssetType(event.target.value)}
          optionType="button"
          buttonStyle="solid"
          disabled={isUploading}
          options={[
            { value: ASSET_TYPES.CLIENT, label: 'Client asset' },
            { value: ASSET_TYPES.INTERNAL, label: 'Internal asset for a client' },
          ]}
        />
      </div>

      <div ref={clientRef}>
        <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
          {assetType === ASSET_TYPES.CLIENT ? 'Client' : 'Client (assets associated to)'}
        </Text>
        <Select
          showSearch
          placeholder="Select client"
          value={clientCode}
          onChange={setClientCode}
          loading={clientsLoading}
          disabled={isUploading}
          style={{ width: 320 }}
          optionFilterProp="label"
          options={clientOptions}
          aria-label="Client selector"
        />
      </div>

      {assetType === ASSET_TYPES.CLIENT && clientCode && clientLoading && (
        <Flex align="center" gap={8}>
          <Spin size="small" />
          <Text type="secondary">Loading client CSV config…</Text>
        </Flex>
      )}

      {assetType === ASSET_TYPES.CLIENT && clientCode && !clientLoading && !client?.csvConfig && (
        <Alert
          type="warning"
          showIcon
          message="No CSV config"
          description={`Client ${clientCode} has no csvConfig defined. CSV rows cannot be validated.`}
        />
      )}

      {configValidation && (
        <>
          <Flex wrap gap="large">
            <Statistic title="Mapped SKUs" value={analysis.mappedCount} />
            <Statistic
              title="Validated"
              value={configValidation.validatedCount}
              valueStyle={{ color: '#3f8600' }}
            />
            {assetType === ASSET_TYPES.CLIENT && (
              <Statistic
                title="Unvalidated (csvConfig)"
                value={configValidation.unvalidatedCount}
                valueStyle={{
                  color: configValidation.unvalidatedCount > 0 ? '#cf1322' : undefined,
                }}
              />
            )}
          </Flex>

          {assetType === ASSET_TYPES.CLIENT && configValidation.unvalidatedCount > 0 && (
            <Alert
              type="warning"
              showIcon
              message={`${configValidation.unvalidatedCount} SKU(s) failed CSV config validation`}
              description="Export unvalidated SKUs to review and fix CSV data before upload."
            />
          )}

          {(isUploading || uploadResult) && (
            <Flex vertical gap="middle">
              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                  Overall progress
                  {uploadProgress.totalSteps
                    ? ` (${uploadProgress.completedSteps}/${uploadProgress.totalSteps} steps)`
                    : ''}
                </Text>
                <Progress
                  percent={uploadProgress.overallPercent}
                  status={progressStatus}
                />
              </div>
              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                  {fileProgressLabel}
                </Text>
                <Progress
                  percent={uploadProgress.filePercent}
                  status={
                    uploadProgress.phase === UPLOAD_PHASE.CREATING ? 'active' : progressStatus
                  }
                  showInfo={uploadProgress.phase !== UPLOAD_PHASE.CREATING}
                />
              </div>
            </Flex>
          )}

          {uploadResult && (
            <Alert
              type={uploadResult.failed > 0 ? 'warning' : 'success'}
              showIcon
              message={
                uploadResult.failed > 0
                  ? `Upload finished with ${uploadResult.failed} failure(s)`
                  : 'Upload complete'
              }
              description={
                <>
                  {uploadResult.succeeded} SKU(s) created successfully
                  {uploadResult.failed > 0
                    ? `; ${uploadResult.failed} SKU(s) failed`
                    : ''}
                  .
                </>
              }
            />
          )}

          {uploadResult?.failures?.length > 0 && (
            <Alert
              type="error"
              showIcon
              message="Failed SKUs"
              description={
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {uploadResult.failures.map((entry) => (
                    <li key={entry.barcode}>
                      <Text code>{entry.barcode}</Text> — {entry.error}
                    </li>
                  ))}
                </ul>
              }
            />
          )}

          <div ref={uploadRef}>
            <Flex wrap gap="middle">
              {assetType === ASSET_TYPES.CLIENT && configValidation.unvalidatedCount > 0 && (
                <Button
                  icon={<DownloadOutlined />}
                  onClick={handleExportUnvalidated}
                  disabled={isUploading}
                >
                  Export unvalidated SKUs (CSV)
                </Button>
              )}
              {canUpload && (
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  loading={isUploading}
                  onClick={handleUpload}
                >
                  Upload validated data
                </Button>
              )}
            </Flex>
          </div>
        </>
      )}

      {!configValidation && (
        <div ref={uploadRef}>
          <Text type="secondary">
            Select a client to validate CSV rows and enable upload.
          </Text>
        </div>
      )}

      {awaitingClient && (
        <Text type="secondary">Select a client to continue.</Text>
      )}

      {awaitingCsvConfig && !clientLoading && (
        <Text type="secondary">Waiting for client CSV configuration…</Text>
      )}
    </Flex>
  )
}
