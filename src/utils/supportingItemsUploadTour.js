export const TOUR_COMPLETED_KEY = 'gtom.supportingItemsUploadTour.completed'
export const TOUR_STEP_KEY = 'gtom.supportingItemsUploadTour.step'

export const TOUR_STEP = {
  LIST_WELCOME: 0,
  LIST_STATS: 1,
  LIST_UPLOAD: 2,
  MAP_CSV: 3,
  MAP_FOLDER: 4,
  MAP_VALIDATE: 5,
  MAP_NEXT: 6,
  CONFIGURE_ASSET_TYPE: 7,
  CONFIGURE_CLIENT: 8,
  CONFIGURE_UPLOAD: 9,
}

export function isSupportingItemsUploadTourCompleted() {
  return localStorage.getItem(TOUR_COMPLETED_KEY) === 'true'
}

export function markSupportingItemsUploadTourCompleted() {
  localStorage.setItem(TOUR_COMPLETED_KEY, 'true')
  sessionStorage.removeItem(TOUR_STEP_KEY)
}

export function clearSupportingItemsUploadTourProgress() {
  localStorage.removeItem(TOUR_COMPLETED_KEY)
  sessionStorage.removeItem(TOUR_STEP_KEY)
}

export function getSupportingItemsUploadTourStep() {
  const value = sessionStorage.getItem(TOUR_STEP_KEY)
  if (value === null) {
    return null
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function setSupportingItemsUploadTourStep(step) {
  sessionStorage.setItem(TOUR_STEP_KEY, String(step))
}
