import { Descriptions, Tag } from 'antd'

export function CandidateBlock({ label, candidate }) {
  return (
    <Descriptions
      size="small"
      column={1}
      title={label}
      bordered
      styles={{ label: { width: 140 } }}
    >
      <Descriptions.Item label="Location">{candidate.location}</Descriptions.Item>
      <Descriptions.Item label="Action">{candidate.action}</Descriptions.Item>
      <Descriptions.Item label="Detail">{candidate.detail}</Descriptions.Item>
      <Descriptions.Item label="Rationale">{candidate.rationale}</Descriptions.Item>
      <Descriptions.Item label="Conflict check">
        <Tag color={candidate.conflictCheck?.status === 'conflicting' ? 'red' : 'green'}>
          {candidate.conflictCheck?.status}
        </Tag>
        {candidate.conflictCheck?.details}
      </Descriptions.Item>
      <Descriptions.Item label="Confidence">
        <Tag>{candidate.confidence?.level}</Tag>
        reaches goal state: {candidate.confidence?.reachesGoalState} — {candidate.confidence?.reasoning}
      </Descriptions.Item>
      {candidate.clientScope && (
        <Descriptions.Item label="Client scope">
          <Tag color={candidate.clientScope === 'all_clients' ? 'blue' : 'volcano'}>
            {candidate.clientScope === 'all_clients' ? 'Applies to ALL clients' : 'This client only'}
          </Tag>
          {candidate.clientScope === 'this_client_only' && 'Requires a new per-client branch — none exists today.'}
        </Descriptions.Item>
      )}
    </Descriptions>
  )
}
