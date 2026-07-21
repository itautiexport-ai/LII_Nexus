INSERT IGNORE INTO permissions (id, `key`, module, description) VALUES
  (UUID(), 'document.view', 'documents', 'View non-confidential documents'),
  (UUID(), 'document.view.confidential', 'documents', 'View documents marked confidential'),
  (UUID(), 'document.create', 'documents', 'Upload new documents and versions'),
  (UUID(), 'document.update', 'documents', 'Edit document metadata, tags, folders, links'),
  (UUID(), 'document.delete', 'documents', 'Delete documents'),
  (UUID(), 'document.approve', 'documents', 'Approve or reject a document version'),
  (UUID(), 'document.folder.manage', 'documents', 'Create and manage document folders'),
  (UUID(), 'machine.manage', 'documents', 'Manage the Machine master'),
  (UUID(), 'product.manage', 'documents', 'Manage the Product master');
