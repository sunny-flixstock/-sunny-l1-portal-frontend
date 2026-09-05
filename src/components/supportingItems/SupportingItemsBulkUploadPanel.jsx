import {
  DownloadOutlined,
  FileOutlined,
  FolderOpenOutlined,
  QuestionCircleOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import {
  Alert,
  Button,
  Card,
  Flex,
  List,
  Statistic,
  Table,
  Typography,
  message,
} from 'antd'
import { useRef, useState } from 'react'
import { analyzeSupportingItemsBulkUpload } from '../../utils/supportingItemsBulkUpload.js'
import { exportUnmappedSkuFolders } from '../../utils/supportingItemsCsvExport.js'
import { SupportingItemsConfigureStep } from './SupportingItemsConfigureStep.jsx'
import { SupportingItemsUploadBreadcrumb } from './SupportingItemsUploadBreadcrumb.jsx'
import { clearSupportingItemsUploadTourProgress } from '../../utils/supportingItemsUploadTour.js'
import {
  SupportingItemsUploadTour,
  resumeSupportingItemsConfigureTour,
} from './SupportingItemsUploadTour.jsx'

const { Text, Paragraph } = Typography

export function SupportingItemsBulkUploadPanel() {
  const csvInputRef = useRef(null)
  const folderInputRef = useRef(null)
  const mapCsvRef = useRef(null)
  const mapFolderRef = useRef(null)
  const mapValidateRef = useRef(null)
  const mapNextRef = useRef(null)
  const configureAssetTypeRef = useRef(null)
  const configureClientRef = useRef(null)
  const configureUploadRef = useRef(null)

  const [forceTourOpen, setForceTourOpen] = useState(false)

  const [step, setStep] = useState('map')
  const [csvFiles, setCsvFiles] = useState([])
  const [folderFiles, setFolderFiles] = useState([])
  const [folderLabel, setFolderLabel] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [analysisErrors, setAnalysisErrors] = useState([])

  function resetAnalysis() {
    setAnalysis(null)
    setAnalysisErrors([])
    setStep('map')
  }

  function handleCsvSelected(fileList) {
    const next = Array.from(fileList).filter((file) =>
      file.name.toLowerCase().endsWith('.csv')
    )
    if (next.length === 0) {
      message.warning('Select at least one .csv file')
      return
    }
    setCsvFiles((prev) => {
      const byName = new Map(prev.map((file) => [file.name, file]))
      next.forEach((file) => byName.set(file.name, file))
      return Array.from(byName.values())
    })
    resetAnalysis()
  }

  function handleFolderSelected(fileList) {
    const files = Array.from(fileList)
    if (files.length === 0) {
      return
    }
    const rootName = files[0]?.webkitRelativePath.split('/')[0] ?? 'Selected folder'
    setFolderFiles(files)
    setFolderLabel(rootName)
    resetAnalysis()
  }

  async function handleAnalyze() {
    if (csvFiles.length === 0) {
      message.warning('Add at least one CSV file')
      return
    }
    if (folderFiles.length === 0) {
      message.warning('Select a folder containing SKU directories')
      return
    }

    setIsAnalyzing(true)
    setAnalysis(null)
    setAnalysisErrors([])

    try {
      const result = await analyzeSupportingItemsBulkUpload({
        csvFiles,
        folderFiles,
      })

      if (!result.ok) {
        setAnalysisErrors(result.errors)
        return
      }

      setAnalysis(result)
    } catch (error) {
      setAnalysisErrors([error.message || 'Analysis failed'])
    } finally {
      setIsAnalyzing(false)
    }
  }

  function handleGoToConfigure() {
    resumeSupportingItemsConfigureTour()
    setStep('configure')
  }

  function handleRestartTour() {
    clearSupportingItemsUploadTourProgress()
    setForceTourOpen(true)
    window.setTimeout(() => setForceTourOpen(false), 0)
  }

  const tourTargets = {
    mapCsv: mapCsvRef,
    mapFolder: mapFolderRef,
    mapValidate: mapValidateRef,
    mapNext: mapNextRef,
    configureAssetType: configureAssetTypeRef,
    configureClient: configureClientRef,
    configureUpload: configureUploadRef,
  }

  function handleExportUnmapped() {
    if (!analysis?.unmapped?.length) {
      message.info('No unmapped SKU folders to export')
      return
    }
    exportUnmappedSkuFolders(analysis.unmapped)
  }

  const unmappedColumns = [
    { title: 'SKU folder', dataIndex: 'skuName', key: 'skuName' },
    { title: 'Files', dataIndex: 'fileCount', key: 'fileCount', width: 100 },
  ]

  const mappedColumns = [
    { title: 'SKU folder', dataIndex: 'skuName', key: 'skuName' },
    { title: 'Barcode', dataIndex: 'barcode', key: 'barcode' },
    { title: 'Files', dataIndex: 'fileCount', key: 'fileCount', width: 100 },
  ]

  if (step === 'configure' && analysis) {
    return (
      <Flex vertical gap="large">
        <SupportingItemsUploadBreadcrumb
          step={step}
          onGoToMap={() => setStep('map')}
          disabled={isAnalyzing}
        />
        <SupportingItemsConfigureStep
          analysis={analysis}
          onBack={() => setStep('map')}
          hideBackButton
          assetTypeRef={configureAssetTypeRef}
          clientRef={configureClientRef}
          uploadRef={configureUploadRef}
        />
        <SupportingItemsUploadTour
          variant="configure"
          targets={tourTargets}
          forceOpen={forceTourOpen}
        />
      </Flex>
    )
  }

  return (
    <Flex vertical gap="large">
      <Flex align="center" justify="space-between">
        <SupportingItemsUploadBreadcrumb step={step} />
        <Button icon={<QuestionCircleOutlined />} onClick={handleRestartTour}>
          Take a tour
        </Button>
      </Flex>
      <Alert
        type="info"
        showIcon
        message="Bulk supporting items upload"
        description="Add CSV file(s) with a barcode column and select a folder where each immediate subfolder is one SKU. Only jpg, jpeg, or png images are collected from each subfolder, including nested paths."
      />

      <Flex wrap gap="middle">
        <input
          ref={csvInputRef}
          type="file"
          accept=".csv,text/csv"
          multiple
          hidden
          onChange={(event) => {
            handleCsvSelected(event.target.files)
            event.target.value = ''
          }}
        />
        <input
          ref={folderInputRef}
          type="file"
          hidden
          webkitdirectory=""
          multiple
          onChange={(event) => {
            handleFolderSelected(event.target.files)
            event.target.value = ''
          }}
        />

        <Button ref={mapCsvRef} icon={<FileOutlined />} onClick={() => csvInputRef.current?.click()}>
          Select CSV files
        </Button>
        <Button ref={mapFolderRef} icon={<FolderOpenOutlined />} onClick={() => folderInputRef.current?.click()}>
          Select folder
        </Button>
        <Button
          ref={mapValidateRef}
          type="primary"
          icon={<UploadOutlined />}
          loading={isAnalyzing}
          onClick={handleAnalyze}
          disabled={csvFiles.length === 0 || folderFiles.length === 0}
        >
          Validate &amp; map
        </Button>
      </Flex>

      <Flex wrap gap="large">
        <Card size="small" title="CSV files" style={{ minWidth: 280, flex: 1 }}>
          {csvFiles.length === 0 ? (
            <Text type="secondary">No CSV files selected</Text>
          ) : (
            <List
              size="small"
              dataSource={csvFiles}
              renderItem={(file) => (
                <List.Item
                  actions={[
                    <Button
                      key="remove"
                      type="link"
                      size="small"
                      danger
                      onClick={() => {
                        setCsvFiles((prev) => prev.filter((entry) => entry.name !== file.name))
                        resetAnalysis()
                      }}
                    >
                      Remove
                    </Button>,
                  ]}
                >
                  {file.name}
                </List.Item>
              )}
            />
          )}
        </Card>

        <Card size="small" title="Folder" style={{ minWidth: 280, flex: 1 }}>
          {folderFiles.length === 0 ? (
            <Text type="secondary">No folder selected</Text>
          ) : (
            <>
              <Paragraph style={{ marginBottom: 8 }}>
                <Text strong>{folderLabel}</Text>
              </Paragraph>
              <Text type="secondary">
                {folderFiles.length.toLocaleString()} file(s) scanned
              </Text>
              <div style={{ marginTop: 8 }}>
                <Button
                  size="small"
                  onClick={() => {
                    setFolderFiles([])
                    setFolderLabel('')
                    resetAnalysis()
                  }}
                >
                  Clear folder
                </Button>
              </div>
            </>
          )}
        </Card>
      </Flex>

      {analysisErrors.length > 0 && (
        <Alert
          type="error"
          showIcon
          message="Validation failed"
          description={
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {analysisErrors.map((entry) => (
                <li key={entry}>{entry}</li>
              ))}
            </ul>
          }
        />
      )}

      {analysis && (
        <>
          <Flex wrap gap="large">
            <Statistic title="SKUs found in folder" value={analysis.totalSkus} />
            <Statistic
              title="Mapped to barcode"
              value={analysis.mappedCount}
              valueStyle={{ color: '#3f8600' }}
            />
            <Statistic
              title="Not mapped"
              value={analysis.unmappedCount}
              valueStyle={{ color: analysis.unmappedCount > 0 ? '#cf1322' : undefined }}
            />
            <Statistic title="CSV rows (unique barcodes)" value={analysis.csvRowCount} />
          </Flex>

          <Flex wrap gap="middle">
            {analysis.unmappedCount > 0 && (
              <Button icon={<DownloadOutlined />} onClick={handleExportUnmapped}>
                Export unmapped SKU folders (CSV)
              </Button>
            )}
            {analysis.mappedCount > 0 && (
              <Button ref={mapNextRef} type="primary" onClick={handleGoToConfigure}>
                Next
              </Button>
            )}
          </Flex>

          {analysis.unmapped.length > 0 && (
            <div>
              <Text strong>Unmapped SKU folders</Text>
              <Table
                rowKey="skuName"
                size="small"
                style={{ marginTop: 8 }}
                columns={unmappedColumns}
                dataSource={analysis.unmapped}
                pagination={{ pageSize: 10, showSizeChanger: false }}
                scroll={{ y: 240 }}
              />
            </div>
          )}

          {analysis.mapped.length > 0 && (
            <div>
              <Text strong>Mapped SKUs</Text>
              <Table
                rowKey="skuName"
                size="small"
                style={{ marginTop: 8 }}
                columns={mappedColumns}
                dataSource={analysis.mapped}
                pagination={{ pageSize: 10, showSizeChanger: false }}
                scroll={{ y: 240 }}
              />
            </div>
          )}
        </>
      )}
      <SupportingItemsUploadTour
        variant="map"
        targets={tourTargets}
        hasMappedSkus={Boolean(analysis?.mappedCount)}
        forceOpen={forceTourOpen}
      />
    </Flex>
  )
}
