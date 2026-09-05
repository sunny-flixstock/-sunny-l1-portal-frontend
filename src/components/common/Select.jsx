import { Select as AntSelect } from 'antd'

/** Ant Design Select with search enabled by default. */
export function Select({ showSearch = true, optionFilterProp = 'label', ...props }) {
  return <AntSelect showSearch={showSearch} optionFilterProp={optionFilterProp} {...props} />
}
