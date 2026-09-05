import { Table } from 'antd'
import { useState } from 'react'
import { useFrameworkVersions } from '../../hooks/useFrameworkVersions.js'
import { LABELS } from '../../constants/brandAiStylistLabels.js'
import { FrameworkVersionActions } from '../frameworkVersions/FrameworkVersionActions.jsx'
import { FrameworkVersionDescriptionsModal } from '../frameworkVersions/FrameworkVersionDescriptionsModal.jsx'
import { buildFrameworkVersionNestedColumns } from '../../utils/frameworkVersionTableColumns.jsx'

const NESTED_PAGE_SIZE = 100

export function FrameworkGroupVersionsPanel({ group, enabled }) {
  const [startingId, setStartingId] = useState(null)
  const [archivingId, setArchivingId] = useState(null)
  const [makingLiveId, setMakingLiveId] = useState(null)
  const [demotingId, setDemotingId] = useState(null)
  const [descriptionsVersion, setDescriptionsVersion] = useState(null)

  const { data, isLoading, isFetching } = useFrameworkVersions({
    frameworkGroupId: group._id,
    pageSize: NESTED_PAGE_SIZE,
    enabled,
  })

  const versions = data?.data ?? []

  const columns = buildFrameworkVersionNestedColumns({
    activeProductionFrameworkVersionId: group.activeProductionFrameworkVersionId,
    renderActions: (row) => (
      <FrameworkVersionActions
        version={row}
        onViewDescriptions={setDescriptionsVersion}
        startingId={startingId}
        setStartingId={setStartingId}
        archivingId={archivingId}
        setArchivingId={setArchivingId}
        makingLiveId={makingLiveId}
        setMakingLiveId={setMakingLiveId}
        demotingId={demotingId}
        setDemotingId={setDemotingId}
      />
    ),
  })

  return (
    <>
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={versions}
        loading={isLoading || isFetching}
        locale={{ emptyText: `No ${LABELS.stylistVersions.toLowerCase()} for this group` }}
        pagination={false}
        size="small"
        scroll={{ x: true }}
      />

      {descriptionsVersion && (
        <FrameworkVersionDescriptionsModal
          version={descriptionsVersion}
          onClose={() => setDescriptionsVersion(null)}
        />
      )}
    </>
  )
}
