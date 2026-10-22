-- 112_catalogue_shared_decks.sql
-- Supports public shareable catalogue presentation decks and real-time buyer view notifications

ALTER TABLE notifications MODIFY COLUMN notification_type VARCHAR(100) NOT NULL;
ALTER TABLE notifications MODIFY COLUMN module VARCHAR(100) NOT NULL;
ALTER TABLE notification_templates MODIFY COLUMN notification_type VARCHAR(100) NOT NULL;
ALTER TABLE notification_templates MODIFY COLUMN module VARCHAR(100) NOT NULL;

INSERT IGNORE INTO notification_templates (id, notification_type, module, default_title, default_description, default_priority, default_action_label)
VALUES (
  'tpl-catalogue-viewed-001',
  'catalogue_deck_viewed',
  'crm',
  'Buyer Opened Presentation',
  'A buyer has opened your shared catalogue presentation link.',
  'high',
  'View Catalogue'
);

CREATE TABLE IF NOT EXISTS catalogue_shared_decks (
  id VARCHAR(36) PRIMARY KEY,
  token VARCHAR(64) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255) NOT NULL DEFAULT '',
  theme_id VARCHAR(50) NOT NULL DEFAULT 'obsidian',
  include_pricing TINYINT(1) NOT NULL DEFAULT 1,
  products_json LONGTEXT NOT NULL,
  created_by_user_id CHAR(36) NOT NULL,
  created_by_name VARCHAR(255) NOT NULL DEFAULT '',
  view_count INT NOT NULL DEFAULT 0,
  last_viewed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_shared_decks_token (token),
  INDEX idx_shared_decks_user (created_by_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS catalogue_deck_views (
  id VARCHAR(36) PRIMARY KEY,
  deck_id VARCHAR(36) NOT NULL,
  viewer_ip VARCHAR(64) NULL,
  user_agent VARCHAR(500) NULL,
  viewed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_deck_views_deck (deck_id),
  CONSTRAINT fk_deck_views_deck FOREIGN KEY (deck_id) REFERENCES catalogue_shared_decks (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
