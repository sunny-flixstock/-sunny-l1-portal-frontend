import {
  AimOutlined,
  AppstoreOutlined,
  BookOutlined,
  BranchesOutlined,
  DatabaseOutlined,
  InboxOutlined,
  PictureOutlined,
  ReadOutlined,
  RightOutlined,
  SettingOutlined,
  TagsOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { Button, Card, Col, Collapse, Flex, Row, Steps, Tag, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import { LABELS } from '../../constants/brandAiStylistLabels.js'
import {
  FRAMEWORK_VERSION_STATUS_COLORS,
  FRAMEWORK_VERSION_STATUS_LABELS,
} from '../../utils/frameworkVersionConstants.js'

const { Title, Paragraph, Text } = Typography

const PREREQUISITES = [
  {
    key: 'client',
    title: 'Set up the client',
    icon: <TeamOutlined />,
    path: '/clients',
    summary: `Every ${LABELS.brandAiStylist.toLowerCase()} belongs to a client (brand or account).`,
    details: [
      'Open Clients and confirm your client exists. If not, create one with the client code your team uses.',
      'Optionally configure CSV column mappings if your team imports product data.',
    ],
  },
  {
    key: 'framework-group',
    title: `Create a ${LABELS.stylistGroup.toLowerCase()}`,
    icon: <AppstoreOutlined />,
    path: '/framework-groups',
    summary: `A group defines which products a ${LABELS.brandAiStylist.toLowerCase()} applies to.`,
    details: [
      `Go to ${LABELS.stylistGroups} and click New group.`,
      'Choose the client, then set constraints such as gender, season, or category.',
      'Leave a constraint empty to match any value (wildcard).',
      'Give the group a clear name so teammates can find it later.',
    ],
  },
  {
    key: 'rules',
    title: 'Add styling rules',
    icon: <ReadOutlined />,
    path: '/rules',
    summary: 'Rules describe what good and bad styling looks like for a client.',
    details: [
      'Open Rules and create or import rules for your client.',
      'Each rule should be written in plain language that reviewers understand.',
      'You will pick these rules when building an input set.',
    ],
  },
  {
    key: 'example-images',
    title: 'Upload example images',
    icon: <PictureOutlined />,
    path: '/example-images',
    summary: 'Example images teach the system what to look for.',
    details: [
      'Go to Example images and upload reference photos for the client.',
      'Tag images when helpful so they are easier to find.',
      'Include both good and bad examples when possible — the input set wizard lets you choose which to use.',
    ],
  },
  {
    key: 'input-set',
    title: 'Build an input set',
    icon: <InboxOutlined />,
    path: '/input-sets',
    summary: `An input set bundles the rules and example images for one ${LABELS.brandAiStylist.toLowerCase()} run.`,
    details: [
      'Open Input sets and click Create input set.',
      'Step 1 — Basic info: choose the client and give the set a descriptive name.',
      `Step 2 — Rules: select the styling rules that apply to this ${LABELS.brandAiStylist.toLowerCase()}.`,
      'Step 3 — Examples: pick the example images the AI should learn from.',
      `Step 4 — Summary: review everything and save. The set starts as Draft and becomes Active when you use it in a ${LABELS.stylistVersion.toLowerCase()}.`,
    ],
  },
  {
    key: 'system-instructions',
    title: 'Prepare system instructions',
    icon: <BookOutlined />,
    path: '/system-instructions',
    summary: `Instructions tell the AI how to describe images and build ${LABELS.stylistOutput}.`,
    details: [
      'Open System instructions. You need two active instruction types:',
      'Example image description generation — writes descriptions for each example image per domain (e.g. styling, pose).',
      `${LABELS.stylistCreationAndStorage} — turns descriptions into the final ${LABELS.stylistOutput} per domain.`,
      'Create a new instruction version if none are active, or ask your technical lead to publish one.',
    ],
  },
  {
    key: 'framework-vocab',
    title: `Upload ${LABELS.stylistVocab.toLowerCase()}`,
    icon: <DatabaseOutlined />,
    path: '/framework-vocab',
    summary: `Vocab defines the terms and structure the ${LABELS.stylistOutput} must follow.`,
    details: [
      `Go to ${LABELS.stylistVocab} and click Upload.`,
      'Paste or upload the JSON vocab file provided by your team.',
      `Give it a clear name — you will select it when creating a ${LABELS.stylistVersion.toLowerCase()}.`,
    ],
  },
  {
    key: 'category-registry',
    title: 'Upload category registry',
    icon: <TagsOutlined />,
    path: '/category-registry',
    summary: `The registry maps product categories used during ${LABELS.brandAiStylist.toLowerCase()} generation.`,
    details: [
      'Go to Category Registry and click Upload.',
      'Paste or upload the JSON registry file provided by your team.',
      'Name it clearly so you can pick the right one later.',
    ],
  },
  {
    key: 'base-angles',
    title: 'Create base angles',
    icon: <AimOutlined />,
    path: '/angles',
    summary: 'Base angles are canonical camera/view definitions shared across clients.',
    details: [
      'Open Angles → Base angles and click Create.',
      'Give the angle a clear name and paste the markdown definition that describes the shot.',
      'Optionally upload sample reference images.',
      'Base angles are versioned — create a new version when the definition changes.',
    ],
  },
  {
    key: 'client-angles',
    title: 'Generate client angles',
    icon: <AimOutlined />,
    path: '/angles',
    summary: 'Client angles adapt a base angle for a specific brand using AI.',
    details: [
      'Open Angles → Client angles and click Generate.',
      'Choose the client, base angle, and an active client angle definition system instruction.',
      'Upload client reference images — the AI writes a tailored angle definition.',
      'Each client angle is versioned and scoped to one client.',
    ],
  },
  {
    key: 'angle-specs',
    title: 'Define angle technical specifications',
    icon: <SettingOutlined />,
    path: '/angle-technical-specifications',
    summary: 'Technical specs describe output image dimensions, background, and file format.',
    details: [
      'Open Angle specs in the sidebar and click New specification.',
      'Choose the client, then set width, height, DPI, background color, color mode, and file format.',
      'Identical settings are deduplicated automatically via a spec hash — reuse specs across presets.',
      'Build a library of specs per client before creating angle presets.',
    ],
  },
  {
    key: 'angle-presets',
    title: 'Build angle presets',
    icon: <AimOutlined />,
    path: '/angles',
    summary: 'Angle presets bundle client angles with output specs and file naming patterns.',
    details: [
      'Open Angles → Angle presets and click New preset.',
      'Choose the client and give the preset a name.',
      'Select the client angles to include, then for each angle pick a technical specification.',
      'Set a naming pattern per output — use ${barcode} for product data and ${ext} for the file extension.',
      'You can add multiple outputs per angle when one shot needs more than one file.',
    ],
  },
]

const CREATE_STEPS = [
  {
    title: `Open ${LABELS.stylistVersions}`,
    description: (
      <>
        <Paragraph style={{ marginBottom: 8 }}>
          Go to <Text strong>{LABELS.stylistVersions}</Text> in the sidebar. This is where all{' '}
          {LABELS.stylistVersions.toLowerCase()} are listed with their status, client, and linked
          resources.
        </Paragraph>
        <GoToButton path="/framework-versions" label={`Go to ${LABELS.stylistVersions}`} />
      </>
    ),
  },
  {
    title: 'Create a new version',
    description: (
      <>
        <Paragraph style={{ marginBottom: 8 }}>
          Click <Text strong>New version</Text>. Fill in the form:
        </Paragraph>
        <ul style={{ margin: '0 0 8px', paddingLeft: 20 }}>
          <li>
            <Text strong>Client</Text> — the brand this {LABELS.brandAiStylist.toLowerCase()} is for.
          </li>
          <li>
            <Text strong>{LABELS.stylistGroup}</Text> — the product segment (gender, season, category).
          </li>
          <li>
            <Text strong>Name</Text> — a label your team will recognize, e.g. &quot;Spring 2026
            refresh&quot;.
          </li>
        </ul>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Version number and Draft status are assigned automatically.
        </Paragraph>
      </>
    ),
  },
  {
    title: 'Configure domains and AI models',
    description: (
      <>
        <Paragraph style={{ marginBottom: 8 }}>
          Each <Text strong>domain</Text> (such as styling or pose) needs two instruction + model
          pairs:
        </Paragraph>
        <ul style={{ margin: '0 0 8px', paddingLeft: 20 }}>
          <li>
            <Text strong>Description instruction</Text> — how to describe each example image in this
            domain.
          </li>
          <li>
            <Text strong>{LABELS.stylistInstruction}</Text> — how to build the {LABELS.stylistOutput}{' '}
            from those descriptions.
          </li>
        </ul>
        <Paragraph style={{ marginBottom: 0 }}>
          Click the model button next to each instruction to choose the AI provider and model. Use
          &quot;Apply to all&quot; when every domain should share the same model. Add more domains
          with <Text strong>Add domain</Text> if your {LABELS.brandAiStylist.toLowerCase()} covers
          multiple areas.
        </Paragraph>
      </>
    ),
  },
  {
    title: 'Link vocab, registry, and input set',
    description: (
      <>
        <Paragraph style={{ marginBottom: 8 }}>
          Select the three supporting resources you prepared earlier:
        </Paragraph>
        <ul style={{ margin: '0 0 8px', paddingLeft: 20 }}>
          <li>
            <Text strong>{LABELS.stylistVocab}</Text> — output terminology and structure.
          </li>
          <li>
            <Text strong>Category registry</Text> — product category mappings.
          </li>
          <li>
            <Text strong>Input set</Text> — rules and example images for this run (filtered by
            client).
          </li>
        </ul>
        <Paragraph style={{ marginBottom: 0 }}>
          Click <Text strong>Create</Text>. The new version appears in the list as{' '}
          <StatusTag status="draft" />.
        </Paragraph>
      </>
    ),
  },
  {
    title: `Start ${LABELS.brandAiStylist.toLowerCase()} creation`,
    description: (
      <>
        <Paragraph style={{ marginBottom: 8 }}>
          Find your draft version in the table and click <Text strong>Start creation</Text>. Confirm
          when prompted.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          The system will automatically:
        </Paragraph>
        <ul style={{ margin: '0 0 8px', paddingLeft: 20 }}>
          <li>Generate image descriptions for every example image in each domain.</li>
          <li>Group descriptions and build {LABELS.stylistOutput} per domain.</li>
          <li>Move the version to <StatusTag status="in_progress" /> while work is running.</li>
        </ul>
        <Paragraph style={{ marginBottom: 0 }}>
          No further action is needed during this phase — processing happens in the background.
        </Paragraph>
      </>
    ),
  },
  {
    title: 'Review the results',
    description: (
      <>
        <Paragraph style={{ marginBottom: 8 }}>
          When all domains finish, the status changes to <StatusTag status="in_review" />{' '}
          automatically. Click <Text strong>View descriptions</Text> on the version row to read the
          generated output for each domain.
        </Paragraph>
        <Paragraph style={{ marginBottom: 0 }}>
          Share the output with your team for quality review. If something looks wrong, create a new
          version with adjusted rules, examples, or instructions rather than editing the current one.
        </Paragraph>
      </>
    ),
  },
]

const UPDATE_STEPS = [
  {
    title: 'You cannot edit a published version',
    description:
      `Once a ${LABELS.stylistVersion.toLowerCase()} has left Draft, its configuration is locked. To change rules, examples, instructions, or models, create a new version instead.`,
  },
  {
    title: 'Clone or create a new input set',
    description: (
      <>
        If only the rules or example images need to change, open the existing input set and use{' '}
        <Text strong>Clone</Text> to copy it, then adjust the clone. Archived input sets are hidden
        from new {LABELS.stylistVersions.toLowerCase()}.
      </>
    ),
  },
  {
    title: 'Create a new version in the same group',
    description: (
      <>
        Go to <Text strong>{LABELS.stylistVersions} → New version</Text>, select the same{' '}
        {LABELS.stylistGroup.toLowerCase()},
        and configure the updated settings. The version number increments automatically (v1, v2, v3…)
        so you can compare runs side by side.
      </>
    ),
  },
  {
    title: 'Archive old versions when done',
    description: (
      <>
        After a new version is approved, archive older <StatusTag status="in_review" /> versions
        from the {LABELS.stylistVersions} table to keep the list tidy. Archived versions keep their
        generated data.
      </>
    ),
  },
]

const LIFECYCLE_STATUSES = ['draft', 'in_progress', 'in_review', 'approved', 'promoted', 'archived']

function GoToButton({ path, label }) {
  const navigate = useNavigate()

  return (
    <Button type="link" icon={<RightOutlined />} onClick={() => navigate(path)} style={{ padding: 0 }}>
      {label}
    </Button>
  )
}

function StatusTag({ status }) {
  return (
    <Tag color={FRAMEWORK_VERSION_STATUS_COLORS[status] ?? 'default'} style={{ marginInline: 0 }}>
      {FRAMEWORK_VERSION_STATUS_LABELS[status] ?? status}
    </Tag>
  )
}

function PrerequisitePanel({ item }) {
  const navigate = useNavigate()

  return (
    <Flex vertical gap={8}>
      <Paragraph type="secondary" style={{ marginBottom: 0 }}>
        {item.summary}
      </Paragraph>
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        {item.details.map((line) => (
          <li key={line}>
            <Text>{line}</Text>
          </li>
        ))}
      </ul>
      <Button
        type="primary"
        ghost
        size="small"
        icon={<RightOutlined />}
        onClick={() => navigate(item.path)}
        style={{ alignSelf: 'flex-start', marginTop: 4 }}
      >
        Open {item.title.toLowerCase()}
      </Button>
    </Flex>
  )
}

export function FrameworkWorkflowGuide() {
  const navigate = useNavigate()

  const prerequisiteItems = PREREQUISITES.map((item) => ({
    key: item.key,
    label: (
      <Flex align="center" gap={8}>
        <span style={{ color: '#64748b' }}>{item.icon}</span>
        <Text strong>{item.title}</Text>
      </Flex>
    ),
    children: <PrerequisitePanel item={item} />,
  }))

  return (
    <Flex vertical gap={24}>
      <div>
        <Paragraph type="secondary" style={{ fontSize: 15, maxWidth: 720, marginBottom: 0 }}>
          A <Text strong>{LABELS.brandAiStylist}</Text> is an AI-generated styling guide built from
          your rules, example images, and reference files. Follow the steps below to set up
          everything you need, then create and review a {LABELS.stylistVersion.toLowerCase()}.
        </Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card
            hoverable
            size="small"
            onClick={() => navigate('/framework-versions')}
            styles={{ body: { padding: 16 } }}
          >
            <Flex align="center" gap={12}>
              <BranchesOutlined style={{ fontSize: 22, color: '#2563eb' }} />
              <div>
                <Text strong>Create a {LABELS.brandAiStylist.toLowerCase()}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Start a new version
                </Text>
              </div>
            </Flex>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card
            hoverable
            size="small"
            onClick={() => navigate('/input-sets/new')}
            styles={{ body: { padding: 16 } }}
          >
            <Flex align="center" gap={12}>
              <InboxOutlined style={{ fontSize: 22, color: '#2563eb' }} />
              <div>
                <Text strong>Build an input set</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Rules + example images
                </Text>
              </div>
            </Flex>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card
            hoverable
            size="small"
            onClick={() => navigate('/framework-groups')}
            styles={{ body: { padding: 16 } }}
          >
            <Flex align="center" gap={12}>
              <AppstoreOutlined style={{ fontSize: 22, color: '#2563eb' }} />
              <div>
                <Text strong>Manage groups</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Product segments per client
                </Text>
              </div>
            </Flex>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card
            hoverable
            size="small"
            onClick={() => navigate('/angles')}
            styles={{ body: { padding: 16 } }}
          >
            <Flex align="center" gap={12}>
              <AimOutlined style={{ fontSize: 22, color: '#2563eb' }} />
              <div>
                <Text strong>Set up angles</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Base angles, client angles & presets
                </Text>
              </div>
            </Flex>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card
            hoverable
            size="small"
            onClick={() => navigate('/angle-technical-specifications')}
            styles={{ body: { padding: 16 } }}
          >
            <Flex align="center" gap={12}>
              <SettingOutlined style={{ fontSize: 22, color: '#2563eb' }} />
              <div>
                <Text strong>Angle specifications</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Output dimensions & file formats
                </Text>
              </div>
            </Flex>
          </Card>
        </Col>
      </Row>

      <Card>
        <Title level={4} style={{ marginTop: 0 }}>
          Before you begin — one-time setup
        </Title>
        <Paragraph type="secondary">
          Complete these steps once per client (or whenever you need new reference files). You can
          reuse the same vocab, registry, and instructions across multiple{' '}
          {LABELS.stylistVersions.toLowerCase()}.
        </Paragraph>
        <Collapse items={prerequisiteItems} bordered={false} style={{ background: 'transparent' }} />
      </Card>

      <Card>
        <Title level={4} style={{ marginTop: 0 }}>
          How to create a new {LABELS.brandAiStylist.toLowerCase()}
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 24 }}>
          Once the setup above is done, follow these steps in order.
        </Paragraph>
        <Steps
          direction="vertical"
          size="small"
          current={-1}
          items={CREATE_STEPS.map((step) => ({
            title: step.title,
            description: step.description,
          }))}
        />
      </Card>

      <Card>
        <Title level={4} style={{ marginTop: 0 }}>
          How to update a {LABELS.brandAiStylist.toLowerCase()}
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 24 }}>
          Need to change rules, swap example images, or try different AI models? Create a new
          version rather than modifying an existing one.
        </Paragraph>
        <Steps
          direction="vertical"
          size="small"
          current={-1}
          items={UPDATE_STEPS.map((step) => ({
            title: step.title,
            description: step.description,
          }))}
        />
      </Card>

      <Card>
        <Title level={4} style={{ marginTop: 0 }}>
          Version status lifecycle
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 16 }}>
          Each {LABELS.stylistVersion.toLowerCase()} moves through these statuses. You will mostly
          interact with Draft,
          In progress, and In review.
        </Paragraph>
        <Flex wrap="wrap" gap={8} style={{ marginBottom: 16 }}>
          {LIFECYCLE_STATUSES.map((status) => (
            <StatusTag key={status} status={status} />
          ))}
        </Flex>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>
            <Text strong>Draft</Text> — configured but not started. You can still delete or abandon
            it.
          </li>
          <li>
            <Text strong>In progress</Text> — AI is generating descriptions and {LABELS.stylistOutput}
            .
            Wait for it to finish.
          </li>
          <li>
            <Text strong>In review</Text> — output is ready. Use View descriptions to inspect and
            share with reviewers.
          </li>
          <li>
            <Text strong>Approved / Promoted</Text> — set by your team when the{' '}
            {LABELS.brandAiStylist.toLowerCase()} is ready for production use.
          </li>
          <li>
            <Text strong>Archived</Text> — retired version. Data is kept but hidden from active
            workflows.
          </li>
        </ul>
      </Card>
    </Flex>
  )
}
