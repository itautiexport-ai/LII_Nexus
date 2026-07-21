ALTER TABLE delegated_tasks ADD COLUMN is_attachment_mandatory BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE delegated_tasks ADD COLUMN is_note_mandatory BOOLEAN NOT NULL DEFAULT FALSE;
