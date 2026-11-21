-- Preserve existing task names while allowing delegation titles up to 500 characters.
ALTER TABLE delegated_tasks
  MODIFY COLUMN title VARCHAR(500) NOT NULL;
