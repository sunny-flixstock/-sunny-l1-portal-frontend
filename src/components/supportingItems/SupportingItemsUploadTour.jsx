import { Tour } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TOUR_STEP,
  getSupportingItemsUploadTourStep,
  isSupportingItemsUploadTourCompleted,
  markSupportingItemsUploadTourCompleted,
  setSupportingItemsUploadTourStep,
} from '../../utils/supportingItemsUploadTour.js'

function getTarget(ref) {
  return () => ref?.current ?? null
}

function buildListSteps(targets) {
  return [
    {
      title: 'Supporting items',
      description:
        'Upload supporting articles in bulk by pairing a CSV of barcodes with a folder of SKU images.',
      target: getTarget(targets.listWelcome),
    },
    {
      title: 'Client overview',
      description:
        'Review SKU and internal SKU counts per client. Click a row or use the dropdown to browse a client’s items.',
      target: getTarget(targets.listStats),
    },
    {
      title: 'Start an upload',
      description:
        'Click “Upload supporting items” to begin. The tour will continue on the upload page with CSV and folder steps.',
      target: getTarget(targets.listUpload),
    },
  ]
}

function buildMapSteps(targets, hasMappedSkus) {
  const steps = [
    {
      title: 'Select CSV files',
      description:
        'Add one or more CSV files. Each must include a barcode column; other columns become SKU metadata.',
      target: getTarget(targets.mapCsv),
    },
    {
      title: 'Select image folder',
      description:
        'Choose the root folder. Each immediate subfolder should be named after a barcode and contain image files.',
      target: getTarget(targets.mapFolder),
    },
    {
      title: 'Validate & map',
      description:
        'Match folder names to CSV barcodes and review mapped vs unmapped SKUs before continuing.',
      target: getTarget(targets.mapValidate),
    },
  ]

  if (hasMappedSkus) {
    steps.push({
      title: 'Continue to setup',
      description:
        'When mapping looks correct, click Next to choose client asset type and validate against CSV config.',
      target: getTarget(targets.mapNext),
    })
  } else {
    steps.push({
      title: 'Review mapping results',
      description:
        'After validation, export unmapped folders if needed, then click Next when at least one SKU is mapped.',
      target: getTarget(targets.mapValidate),
    })
  }

  return steps
}

function buildConfigureSteps(targets) {
  return [
    {
      title: 'Choose asset type',
      description:
        'Client assets belong to the selected client. Internal assets are stored under FLIXSTOCK and linked via associatedTo.',
      target: getTarget(targets.configureAssetType),
    },
    {
      title: 'Select client',
      description:
        'Pick the client. Client assets validate CSV rows against the client csvConfig before upload.',
      target: getTarget(targets.configureClient),
    },
    {
      title: 'Upload validated data',
      description:
        'Images upload to S3 first, then SKUs and assets are created. You’ll return to the listing when finished.',
      target: getTarget(targets.configureUpload),
    },
  ]
}

export function SupportingItemsUploadTour({
  variant,
  targets,
  hasMappedSkus = false,
  forceOpen = false,
}) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState(0)

  const stepConfig = useMemo(() => {
    if (variant === 'list') {
      return {
        start: TOUR_STEP.LIST_WELCOME,
        end: TOUR_STEP.LIST_UPLOAD,
        steps: buildListSteps(targets),
      }
    }
    if (variant === 'map') {
      return {
        start: TOUR_STEP.MAP_CSV,
        end: hasMappedSkus ? TOUR_STEP.MAP_NEXT : TOUR_STEP.MAP_VALIDATE,
        steps: buildMapSteps(targets, hasMappedSkus),
      }
    }
    return {
      start: TOUR_STEP.CONFIGURE_ASSET_TYPE,
      end: TOUR_STEP.CONFIGURE_UPLOAD,
      steps: buildConfigureSteps(targets),
    }
  }, [variant, targets, hasMappedSkus, navigate])

  useEffect(() => {
    if (forceOpen) {
      setOpen(true)
      setCurrent(0)
      setSupportingItemsUploadTourStep(stepConfig.start)
      return
    }

    if (isSupportingItemsUploadTourCompleted()) {
      return
    }

    const resumeStep = getSupportingItemsUploadTourStep()
    if (resumeStep === null) {
      if (variant === 'list') {
        setOpen(true)
        setCurrent(0)
      }
      return
    }

    if (resumeStep >= stepConfig.start && resumeStep <= stepConfig.end) {
      setOpen(true)
      setCurrent(resumeStep - stepConfig.start)
    }
  }, [variant, forceOpen, stepConfig.start, stepConfig.end])

  function handleClose() {
    setOpen(false)
    setSupportingItemsUploadTourStep(stepConfig.start + current)
  }

  function handleChange(nextCurrent) {
    setCurrent(nextCurrent)
    setSupportingItemsUploadTourStep(stepConfig.start + nextCurrent)
  }

  function handleFinish() {
    if (variant === 'list') {
      setSupportingItemsUploadTourStep(TOUR_STEP.MAP_CSV)
      navigate('/supporting-items/upload')
      setOpen(false)
      return
    }

    if (variant === 'map') {
      setSupportingItemsUploadTourStep(TOUR_STEP.MAP_VALIDATE)
      setOpen(false)
      return
    }

    markSupportingItemsUploadTourCompleted()
    setOpen(false)
  }

  return (
    <Tour
      open={open}
      current={current}
      steps={stepConfig.steps}
      onClose={handleClose}
      onChange={handleChange}
      onFinish={handleFinish}
      mask={{ color: 'rgba(0, 0, 0, 0.45)' }}
    />
  )
}

export function resumeSupportingItemsConfigureTour() {
  if (!isSupportingItemsUploadTourCompleted()) {
    setSupportingItemsUploadTourStep(TOUR_STEP.CONFIGURE_ASSET_TYPE)
  }
}
