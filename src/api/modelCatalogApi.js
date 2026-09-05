import { apiRequest } from './http.js'

export function fetchDescriptionModelCatalog() {
  return apiRequest('/model-catalog/description')
}
