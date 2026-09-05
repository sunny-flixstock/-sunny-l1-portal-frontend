export const EXAMPLE_IMAGE_TYPES = ['good', 'bad']

export const EXAMPLE_IMAGE_TYPE_LABELS = {
  good: 'Good',
  bad: 'Bad',
}

export const UPLOAD_STATUS = {
  QUEUED: 'queued',
  PRESIGNING: 'presigning',
  UPLOADING: 'uploading',
  CREATING: 'creating',
  THUMBNAIL: 'thumbnail',
  DONE: 'done',
  ERROR: 'error',
}

export const UPLOAD_STATUS_LABELS = {
  queued: 'Queued',
  presigning: 'Getting upload URL…',
  uploading: 'Uploading…',
  creating: 'Saving…',
  thumbnail: 'Generating thumbnail…',
  done: 'Done',
  error: 'Failed',
}

export function joinFilterValues(values) {
  return values?.length ? values.join(',') : undefined
}
