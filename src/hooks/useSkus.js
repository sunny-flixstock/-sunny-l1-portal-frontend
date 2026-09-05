import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { fetchSkuById, fetchSkus, fetchSkuStatsByClient } from '../api/skuApi.js'
import { addAssetToSku } from '../utils/supportingItemsUploadPipeline.js'

export const skuKeys = {
  all: ['skus'],
  statsByClient: () => ['skus', 'statsByClient'],
  lists: () => ['skus', 'list'],
  list: (params) => ['skus', 'list', params],
  detail: (id) => ['skus', id],
}

export function useSkuStatsByClient() {
  return useQuery({
    queryKey: skuKeys.statsByClient(),
    queryFn: async () => {
      const response = await fetchSkuStatsByClient()
      return response.data ?? []
    },
    meta: {
      errorMessage: 'Failed to load SKU stats',
    },
  })
}

export function useSkus(params = {}, enabled = true) {
  return useQuery({
    queryKey: skuKeys.list(params),
    queryFn: () => fetchSkus(params),
    enabled: Boolean(params.clientName) && enabled,
    meta: {
      errorMessage: 'Failed to load SKUs',
    },
  })
}

export function useSku(id, enabled = true) {
  return useQuery({
    queryKey: skuKeys.detail(id),
    queryFn: async () => {
      const response = await fetchSkuById(id)
      return response.data
    },
    enabled: Boolean(id) && enabled,
    meta: {
      errorMessage: 'Failed to load SKU details',
    },
  })
}

export function useAddSkuAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addAssetToSku,
    onSuccess: (_, variables) => {
      if (variables.skuId) {
        queryClient.invalidateQueries({ queryKey: skuKeys.detail(variables.skuId) })
      }
      queryClient.invalidateQueries({ queryKey: skuKeys.lists() })
      message.success('Asset added')
    },
    onError: (error) => {
      message.error(error.message || 'Failed to add asset')
    },
  })
}
