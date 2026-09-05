import { Modal } from 'antd'

export function FullPageMarkdownModal({ title, onClose, footer, children }) {
  return (
    <Modal
      title={title}
      open
      onCancel={onClose}
      footer={footer}
      destroyOnHidden
      width="100%"
      centered={false}
      classNames={{ root: 'full-page-markdown-modal' }}
    >
      <div className="full-page-markdown-modal__inner">{children}</div>
    </Modal>
  )
}
