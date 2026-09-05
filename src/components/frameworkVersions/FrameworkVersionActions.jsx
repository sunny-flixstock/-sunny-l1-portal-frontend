import { EyeOutlined, PlayCircleOutlined, RollbackOutlined, RocketOutlined } from '@ant-design/icons'
import { Button, Popconfirm, Space } from 'antd'
import { LABELS } from '../../constants/brandAiStylistLabels.js'
import {
  useArchiveFrameworkVersion,
  useDemoteToInReview,
  useMakeFrameworkVersionLive,
  useStartFrameworkCreation,
} from '../../hooks/useFrameworkVersions.js'

export function FrameworkVersionActions({
  version,
  onViewDescriptions,
  startingId,
  setStartingId,
  archivingId,
  setArchivingId,
  makingLiveId,
  setMakingLiveId,
  demotingId,
  setDemotingId,
}) {
  const startCreationMutation = useStartFrameworkCreation()
  const archiveMutation = useArchiveFrameworkVersion()
  const makeLiveMutation = useMakeFrameworkVersionLive()
  const demoteToInReviewMutation = useDemoteToInReview()

  const viewDescriptionsButton = (
    <Button
      type="link"
      size="small"
      icon={<EyeOutlined />}
      onClick={() => onViewDescriptions(version)}
    >
      View descriptions
    </Button>
  )

  if (version.status === 'draft') {
    const isStarting = startingId === version._id && startCreationMutation.isPending

    return (
      <Space size="small" wrap onClick={(event) => event.stopPropagation()}>
        {viewDescriptionsButton}
        <Popconfirm
          title={`Start ${LABELS.brandAiStylist.toLowerCase()} creation?`}
          description="Moves this version to in progress and creates pending image description entries for each example image and description instruction."
          okText="Start creation"
          onConfirm={() => {
            setStartingId(version._id)
            startCreationMutation.mutate(version._id, {
              onSettled: () => setStartingId(null),
            })
          }}
        >
          <Button
            type="link"
            size="small"
            icon={<PlayCircleOutlined />}
            loading={isStarting}
          >
            Start creation
          </Button>
        </Popconfirm>
      </Space>
    )
  }

  if (version.status === 'in_review') {
    const isArchiving = archivingId === version._id && archiveMutation.isPending
    const isMakingLive = makingLiveId === version._id && makeLiveMutation.isPending

    return (
      <Space size="small" wrap onClick={(event) => event.stopPropagation()}>
        {viewDescriptionsButton}
        <Popconfirm
          title="Make this version live in production?"
          description="Promotes this version and sets it as the active production version for its stylist group. Any previously promoted version in the same group returns to in review."
          okText="Make version Live"
          onConfirm={() => {
            setMakingLiveId(version._id)
            makeLiveMutation.mutate(version._id, {
              onSettled: () => setMakingLiveId(null),
            })
          }}
        >
          <Button
            type="link"
            size="small"
            icon={<RocketOutlined />}
            loading={isMakingLive}
          >
            Make version Live
          </Button>
        </Popconfirm>
        <Popconfirm
          title={`Archive this ${LABELS.stylistVersion.toLowerCase()}?`}
          description="This marks the version as archived. Generated descriptions remain stored."
          okText="Archive"
          okButtonProps={{ danger: true }}
          onConfirm={() => {
            setArchivingId(version._id)
            archiveMutation.mutate(version._id, {
              onSettled: () => setArchivingId(null),
            })
          }}
        >
          <Button type="link" size="small" danger loading={isArchiving}>
            Archive
          </Button>
        </Popconfirm>
      </Space>
    )
  }

  if (version.status === 'promoted') {
    const isDemoting = demotingId === version._id && demoteToInReviewMutation.isPending

    return (
      <Space size="small" wrap onClick={(event) => event.stopPropagation()}>
        {viewDescriptionsButton}
        <Popconfirm
          title="Return this version to in review?"
          description="Removes it from production for its stylist group. Partners will have no live version until another one is made live."
          okText="Return to in review"
          okButtonProps={{ danger: true }}
          onConfirm={() => {
            setDemotingId(version._id)
            demoteToInReviewMutation.mutate(version._id, {
              onSettled: () => setDemotingId(null),
            })
          }}
        >
          <Button
            type="link"
            size="small"
            danger
            icon={<RollbackOutlined />}
            loading={isDemoting}
          >
            Return to in review
          </Button>
        </Popconfirm>
      </Space>
    )
  }

  return (
    <Space size="small" wrap onClick={(event) => event.stopPropagation()}>
      {viewDescriptionsButton}
    </Space>
  )
}
