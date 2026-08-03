-- LII Performance Nexus — Consolidated Database Schema
-- Generated from the actual applied schema after running every migration
-- (001 through 021, in `apps/backend/src/infrastructure/database/mysql/migrations/`)
-- against a real MySQL 8.0 instance, via:
--   mysqldump --no-data lii_nexus
--
-- This file is a convenience snapshot for reference or bulk import into a
-- fresh database. It is NOT the source of truth for schema changes - the
-- numbered migration files are, and `npm run migrate` (idempotent via a
-- `schema_migrations` tracking table) is the supported way to build or
-- upgrade a schema. See INSTALLATION_GUIDE.md for the full setup sequence.
--
-- Regenerate this file after adding a new migration:
--   mysqldump -u <user> -p --no-data --skip-comments <database> > database/schema.sql


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` char(36) NOT NULL,
  `actor_user_id` char(36) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entity_type` varchar(100) NOT NULL,
  `entity_id` varchar(100) DEFAULT NULL,
  `before_state` json DEFAULT NULL,
  `after_state` json DEFAULT NULL,
  `ip_address` varchar(64) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `behaviour_components`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `behaviour_components` (
  `id` char(36) NOT NULL,
  `component_key` enum('on_time_completion','delay_frequency','average_delay','task_consistency','checklist_discipline','delegation_discipline','followup_discipline','crm_discipline','attendance_impact','improvement_trend','manager_feedback') NOT NULL,
  `label` varchar(150) NOT NULL,
  `weight` decimal(5,2) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `component_key` (`component_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `checklist_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `checklist_assignments` (
  `id` char(36) NOT NULL,
  `template_id` char(36) NOT NULL,
  `employee_id` char(36) DEFAULT NULL,
  `role_id` char(36) DEFAULT NULL,
  `assigned_by` char(36) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `template_id` (`template_id`),
  KEY `employee_id` (`employee_id`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `checklist_assignments_ibfk_1` FOREIGN KEY (`template_id`) REFERENCES `checklist_templates` (`id`) ON DELETE CASCADE,
  CONSTRAINT `checklist_assignments_ibfk_2` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `checklist_assignments_ibfk_3` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_assignment_target` CHECK ((((`employee_id` is not null) and (`role_id` is null)) or ((`employee_id` is null) and (`role_id` is not null))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `checklist_instance_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `checklist_instance_items` (
  `id` char(36) NOT NULL,
  `instance_id` char(36) NOT NULL,
  `template_item_id` char(36) NOT NULL,
  `is_checked` tinyint(1) NOT NULL DEFAULT '0',
  `checked_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `instance_id` (`instance_id`),
  KEY `template_item_id` (`template_item_id`),
  CONSTRAINT `checklist_instance_items_ibfk_1` FOREIGN KEY (`instance_id`) REFERENCES `checklist_instances` (`id`) ON DELETE CASCADE,
  CONSTRAINT `checklist_instance_items_ibfk_2` FOREIGN KEY (`template_item_id`) REFERENCES `checklist_template_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `checklist_instances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `checklist_instances` (
  `id` char(36) NOT NULL,
  `template_id` char(36) NOT NULL,
  `employee_id` char(36) NOT NULL,
  `period_key` varchar(20) NOT NULL,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_instance_period` (`template_id`,`employee_id`,`period_key`),
  KEY `idx_checklist_instances_employee_period` (`employee_id`,`period_start`,`period_end`),
  CONSTRAINT `checklist_instances_ibfk_1` FOREIGN KEY (`template_id`) REFERENCES `checklist_templates` (`id`) ON DELETE CASCADE,
  CONSTRAINT `checklist_instances_ibfk_2` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `checklist_template_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `checklist_template_items` (
  `id` char(36) NOT NULL,
  `template_id` char(36) NOT NULL,
  `label` varchar(255) NOT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `template_id` (`template_id`),
  CONSTRAINT `checklist_template_items_ibfk_1` FOREIGN KEY (`template_id`) REFERENCES `checklist_templates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `checklist_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `checklist_templates` (
  `id` char(36) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` varchar(1000) DEFAULT NULL,
  `frequency` enum('daily','weekly','monthly') NOT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_by` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `contractors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contractors` (
  `id` char(36) NOT NULL,
  `name` varchar(200) NOT NULL,
  `contact_person` varchar(150) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `crm_lead_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `crm_lead_files` (
  `id` char(36) NOT NULL,
  `lead_id` char(36) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_url` varchar(1000) NOT NULL,
  `uploaded_by` char(36) DEFAULT NULL,
  `uploaded_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `lead_id` (`lead_id`),
  CONSTRAINT `crm_lead_files_ibfk_1` FOREIGN KEY (`lead_id`) REFERENCES `crm_leads` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `crm_lead_followups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `crm_lead_followups` (
  `id` char(36) NOT NULL,
  `lead_id` char(36) NOT NULL,
  `due_date` date NOT NULL,
  `completed_at` datetime DEFAULT NULL,
  `on_time` tinyint(1) DEFAULT NULL,
  `remarks` varchar(1000) DEFAULT NULL,
  `next_action` varchar(500) DEFAULT NULL,
  `logged_by` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `logged_by` (`logged_by`),
  KEY `idx_crm_followups_lead` (`lead_id`),
  KEY `idx_crm_followups_due` (`due_date`),
  CONSTRAINT `crm_lead_followups_ibfk_1` FOREIGN KEY (`lead_id`) REFERENCES `crm_leads` (`id`) ON DELETE CASCADE,
  CONSTRAINT `crm_lead_followups_ibfk_2` FOREIGN KEY (`logged_by`) REFERENCES `employees` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `crm_leads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `crm_leads` (
  `id` char(36) NOT NULL,
  `lead_code` varchar(30) NOT NULL,
  `inquiry_date` date NOT NULL,
  `contact_name` varchar(150) NOT NULL,
  `company_name` varchar(200) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `lead_source` enum('trade_fair','whatsapp','email','website','referral','other') NOT NULL,
  `lead_category` enum('export','domestic','hotel_restaurant_project','buyer_agent','repeat_customer') NOT NULL,
  `product_category` varchar(150) DEFAULT NULL,
  `inquiry_details` varchar(2000) DEFAULT NULL,
  `assigned_merchant_id` char(36) DEFAULT NULL,
  `sales_stage` enum('new_inquiry','discovery','qualification','product_shared','quotation_sent','negotiation','sample_discussion','sample_under_development','order_expected','order_won','order_lost','dead_dormant') NOT NULL DEFAULT 'new_inquiry',
  `forecast_amount` decimal(15,2) DEFAULT NULL,
  `win_probability` decimal(5,2) DEFAULT NULL,
  `weighted_forecast` decimal(15,2) DEFAULT NULL,
  `expected_close_date` date DEFAULT NULL,
  `next_follow_up_date` date DEFAULT NULL,
  `follow_up_remarks` varchar(1000) DEFAULT NULL,
  `next_action` varchar(500) DEFAULT NULL,
  `status` enum('active','won','lost','dead','dormant') NOT NULL DEFAULT 'active',
  `priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `lead_code` (`lead_code`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  KEY `idx_crm_leads_merchant` (`assigned_merchant_id`),
  KEY `idx_crm_leads_status` (`status`),
  KEY `idx_crm_leads_stage` (`sales_stage`),
  KEY `idx_crm_leads_source` (`lead_source`),
  KEY `idx_crm_leads_category` (`lead_category`),
  KEY `idx_crm_leads_followup` (`next_follow_up_date`),
  KEY `idx_crm_leads_inquiry_date` (`inquiry_date`),
  CONSTRAINT `crm_leads_ibfk_1` FOREIGN KEY (`assigned_merchant_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
  CONSTRAINT `crm_leads_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `employees` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `crm_leads_ibfk_3` FOREIGN KEY (`updated_by`) REFERENCES `employees` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `dashboard_widgets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dashboard_widgets` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `report_type` enum('employee_performance','department_performance','office_performance','factory_performance','workflow_reports','checklist_reports','delegation_reports','crm_reports','sales_pipeline','merchant_performance','production_reports','executive_reports') NOT NULL,
  `saved_report_id` char(36) DEFAULT NULL,
  `chart_type` enum('bar','line','pie','area','heatmap','gauge','treemap','table') NOT NULL DEFAULT 'table',
  `title` varchar(150) NOT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `saved_report_id` (`saved_report_id`),
  KEY `idx_dashboard_widgets_user` (`user_id`,`sort_order`),
  CONSTRAINT `dashboard_widgets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `dashboard_widgets_ibfk_2` FOREIGN KEY (`saved_report_id`) REFERENCES `saved_reports` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `delegated_task_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `delegated_task_files` (
  `id` char(36) NOT NULL,
  `task_id` char(36) NOT NULL,
  `kind` enum('attachment','proof') NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_url` varchar(1000) NOT NULL,
  `uploaded_by` char(36) NOT NULL,
  `uploaded_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `task_id` (`task_id`),
  CONSTRAINT `delegated_task_files_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `delegated_tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `delegated_tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `delegated_tasks` (
  `id` char(36) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` varchar(1000) DEFAULT NULL,
  `assigned_by` char(36) NOT NULL,
  `assigned_to` char(36) NOT NULL,
  `due_date` date NOT NULL,
  `priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  `base_status` enum('pending','running','completed') NOT NULL DEFAULT 'pending',
  `remarks` varchar(1000) DEFAULT NULL,
  `escalated_to` char(36) DEFAULT NULL,
  `escalated_at` datetime DEFAULT NULL,
  `escalation_notes` varchar(500) DEFAULT NULL,
  `started_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `assigned_by` (`assigned_by`),
  KEY `escalated_to` (`escalated_to`),
  KEY `idx_delegated_tasks_assignee` (`assigned_to`),
  KEY `idx_delegated_tasks_due` (`due_date`),
  CONSTRAINT `delegated_tasks_ibfk_1` FOREIGN KEY (`assigned_by`) REFERENCES `employees` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `delegated_tasks_ibfk_2` FOREIGN KEY (`assigned_to`) REFERENCES `employees` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `delegated_tasks_ibfk_3` FOREIGN KEY (`escalated_to`) REFERENCES `employees` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `id` char(36) NOT NULL,
  `name` varchar(150) NOT NULL,
  `code` varchar(30) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `designations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `designations` (
  `id` char(36) NOT NULL,
  `title` varchar(150) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `title` (`title`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `document_folders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_folders` (
  `id` char(36) NOT NULL,
  `name` varchar(150) NOT NULL,
  `parent_folder_id` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `parent_folder_id` (`parent_folder_id`),
  CONSTRAINT `document_folders_ibfk_1` FOREIGN KEY (`parent_folder_id`) REFERENCES `document_folders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `document_links`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_links` (
  `id` char(36) NOT NULL,
  `document_id` char(36) NOT NULL,
  `entity_type` enum('employee','machine','product','department','workflow','crm_lead') NOT NULL,
  `entity_id` char(36) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_document_link` (`document_id`,`entity_type`,`entity_id`),
  KEY `idx_document_links_entity` (`entity_type`,`entity_id`),
  CONSTRAINT `document_links_ibfk_1` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `document_tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_tags` (
  `id` char(36) NOT NULL,
  `document_id` char(36) NOT NULL,
  `tag` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_document_tag` (`document_id`,`tag`),
  KEY `idx_document_tags_tag` (`tag`),
  CONSTRAINT `document_tags_ibfk_1` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `document_versions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_versions` (
  `id` char(36) NOT NULL,
  `document_id` char(36) NOT NULL,
  `version_number` int NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_url` varchar(1000) NOT NULL,
  `change_notes` varchar(1000) DEFAULT NULL,
  `approval_status` enum('pending_approval','approved','rejected') NOT NULL DEFAULT 'pending_approval',
  `reviewed_by` char(36) DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `rejection_reason` varchar(500) DEFAULT NULL,
  `uploaded_by` char(36) DEFAULT NULL,
  `uploaded_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_document_version` (`document_id`,`version_number`),
  KEY `uploaded_by` (`uploaded_by`),
  KEY `reviewed_by` (`reviewed_by`),
  CONSTRAINT `document_versions_ibfk_1` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE,
  CONSTRAINT `document_versions_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
  CONSTRAINT `document_versions_ibfk_3` FOREIGN KEY (`reviewed_by`) REFERENCES `employees` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `documents` (
  `id` char(36) NOT NULL,
  `title` varchar(200) NOT NULL,
  `category` enum('sop','drawing','work_instruction','qc_format','policy','contract','buyer_document','machine_manual','training_video') NOT NULL,
  `folder_id` char(36) DEFAULT NULL,
  `owner_id` char(36) DEFAULT NULL,
  `status` enum('draft','pending_approval','approved','rejected') NOT NULL DEFAULT 'draft',
  `expiry_date` date DEFAULT NULL,
  `is_confidential` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `folder_id` (`folder_id`),
  KEY `owner_id` (`owner_id`),
  KEY `idx_documents_category` (`category`),
  KEY `idx_documents_status` (`status`),
  KEY `idx_documents_expiry` (`expiry_date`),
  CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`folder_id`) REFERENCES `document_folders` (`id`) ON DELETE SET NULL,
  CONSTRAINT `documents_ibfk_2` FOREIGN KEY (`owner_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `employee_behaviour_scores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_behaviour_scores` (
  `id` char(36) NOT NULL,
  `employee_id` char(36) NOT NULL,
  `period_type` enum('monthly','yearly') NOT NULL,
  `period_key` varchar(10) NOT NULL,
  `overall_index` decimal(5,2) DEFAULT NULL,
  `component_scores` json NOT NULL,
  `computed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_employee_period` (`employee_id`,`period_type`,`period_key`),
  KEY `idx_behaviour_scores_period` (`period_type`,`period_key`),
  CONSTRAINT `employee_behaviour_scores_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `employee_composite_scores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_composite_scores` (
  `id` char(36) NOT NULL,
  `employee_id` char(36) NOT NULL,
  `period_type` enum('monthly','yearly') NOT NULL,
  `period_key` varchar(10) NOT NULL,
  `overall_score` decimal(5,2) DEFAULT NULL,
  `computed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_employee_period` (`employee_id`,`period_type`,`period_key`),
  KEY `idx_ecs_period` (`period_type`,`period_key`),
  CONSTRAINT `employee_composite_scores_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `employee_kpi_scores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_kpi_scores` (
  `id` char(36) NOT NULL,
  `employee_id` char(36) NOT NULL,
  `kpi_definition_id` char(36) NOT NULL,
  `period_type` enum('monthly','yearly') NOT NULL,
  `period_key` varchar(10) NOT NULL,
  `raw_score` decimal(5,2) DEFAULT NULL,
  `weightage_used` decimal(5,2) NOT NULL,
  `source` enum('auto','manual') NOT NULL,
  `entered_by` char(36) DEFAULT NULL,
  `computed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_employee_kpi_period` (`employee_id`,`kpi_definition_id`,`period_type`,`period_key`),
  KEY `kpi_definition_id` (`kpi_definition_id`),
  KEY `entered_by` (`entered_by`),
  KEY `idx_eks_period` (`period_type`,`period_key`),
  CONSTRAINT `employee_kpi_scores_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `employee_kpi_scores_ibfk_2` FOREIGN KEY (`kpi_definition_id`) REFERENCES `kpi_definitions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `employee_kpi_scores_ibfk_3` FOREIGN KEY (`entered_by`) REFERENCES `employees` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `id` char(36) NOT NULL,
  `employee_code` varchar(50) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `department_id` char(36) DEFAULT NULL,
  `designation_id` char(36) DEFAULT NULL,
  `manager_id` char(36) DEFAULT NULL,
  `user_id` char(36) DEFAULT NULL,
  `date_of_joining` date DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_code` (`employee_code`),
  KEY `user_id` (`user_id`),
  KEY `idx_employees_department` (`department_id`),
  KEY `idx_employees_designation` (`designation_id`),
  KEY `manager_id` (`manager_id`),
  CONSTRAINT `employees_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `employees_ibfk_2` FOREIGN KEY (`designation_id`) REFERENCES `designations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `employees_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `employees_ibfk_4` FOREIGN KEY (`manager_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `escalation_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `escalation_rules` (
  `id` char(36) NOT NULL,
  `level` int NOT NULL,
  `level_label` enum('supervisor','hod','coo','ceo') NOT NULL,
  `target_role_id` char(36) DEFAULT NULL,
  `escalate_after_hours` int NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `level` (`level`),
  KEY `target_role_id` (`target_role_id`),
  CONSTRAINT `escalation_rules_ibfk_1` FOREIGN KEY (`target_role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `factory_departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `factory_departments` (
  `id` char(36) NOT NULL,
  `name` varchar(150) NOT NULL,
  `production_method` enum('finished_sku','component_level') NOT NULL DEFAULT 'finished_sku',
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `factory_production_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `factory_production_entries` (
  `id` char(36) NOT NULL,
  `entry_date` date NOT NULL,
  `shift_id` char(36) NOT NULL,
  `factory_department_id` char(36) NOT NULL,
  `order_reference` varchar(100) DEFAULT NULL,
  `production_method` enum('finished_sku','component_level') NOT NULL,
  `sku_code` varchar(100) DEFAULT NULL,
  `component_name` varchar(150) DEFAULT NULL,
  `target_qty` decimal(15,2) DEFAULT NULL,
  `actual_qty` decimal(15,2) DEFAULT NULL,
  `target_cbm` decimal(15,3) DEFAULT NULL,
  `actual_cbm` decimal(15,3) DEFAULT NULL,
  `target_labour_hours` decimal(10,2) DEFAULT NULL,
  `actual_labour_hours` decimal(10,2) DEFAULT NULL,
  `delay_minutes` int NOT NULL DEFAULT '0',
  `delay_reason` varchar(500) DEFAULT NULL,
  `rejection_qty` decimal(15,2) NOT NULL DEFAULT '0.00',
  `rework_qty` decimal(15,2) NOT NULL DEFAULT '0.00',
  `supervisor_id` char(36) NOT NULL,
  `contractor_id` char(36) DEFAULT NULL,
  `remarks` varchar(1000) DEFAULT NULL,
  `status` enum('submitted','approved','rejected') NOT NULL DEFAULT 'submitted',
  `submitted_by` char(36) NOT NULL,
  `submitted_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reviewed_by` char(36) DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `rejection_reason` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `shift_id` (`shift_id`),
  KEY `contractor_id` (`contractor_id`),
  KEY `submitted_by` (`submitted_by`),
  KEY `reviewed_by` (`reviewed_by`),
  KEY `idx_fpe_department_date` (`factory_department_id`,`entry_date`),
  KEY `idx_fpe_status` (`status`),
  KEY `idx_fpe_supervisor` (`supervisor_id`),
  CONSTRAINT `factory_production_entries_ibfk_1` FOREIGN KEY (`shift_id`) REFERENCES `shifts` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `factory_production_entries_ibfk_2` FOREIGN KEY (`factory_department_id`) REFERENCES `factory_departments` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `factory_production_entries_ibfk_3` FOREIGN KEY (`supervisor_id`) REFERENCES `employees` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `factory_production_entries_ibfk_4` FOREIGN KEY (`contractor_id`) REFERENCES `contractors` (`id`) ON DELETE SET NULL,
  CONSTRAINT `factory_production_entries_ibfk_5` FOREIGN KEY (`submitted_by`) REFERENCES `employees` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `factory_production_entries_ibfk_6` FOREIGN KEY (`reviewed_by`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_entry_method_target` CHECK ((((`production_method` = _utf8mb4'finished_sku') and (`sku_code` is not null) and (`component_name` is null)) or ((`production_method` = _utf8mb4'component_level') and (`component_name` is not null) and (`sku_code` is null))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `factory_production_entry_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `factory_production_entry_files` (
  `id` char(36) NOT NULL,
  `entry_id` char(36) NOT NULL,
  `kind` enum('photo','attachment') NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_url` varchar(1000) NOT NULL,
  `uploaded_by` char(36) NOT NULL,
  `uploaded_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `entry_id` (`entry_id`),
  CONSTRAINT `factory_production_entry_files_ibfk_1` FOREIGN KEY (`entry_id`) REFERENCES `factory_production_entries` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `favourite_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `favourite_reports` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `report_type` enum('employee_performance','department_performance','office_performance','factory_performance','workflow_reports','checklist_reports','delegation_reports','crm_reports','sales_pipeline','merchant_performance','production_reports','executive_reports') NOT NULL,
  `saved_report_id` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_favourite` (`user_id`,`report_type`,`saved_report_id`),
  KEY `saved_report_id` (`saved_report_id`),
  CONSTRAINT `favourite_reports_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `favourite_reports_ibfk_2` FOREIGN KEY (`saved_report_id`) REFERENCES `saved_reports` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `flowchart_tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `flowchart_tasks` (
  `id` char(36) NOT NULL,
  `workflow_run_id` char(36) NOT NULL,
  `stage_id` char(36) NOT NULL,
  `assigned_to` char(36) DEFAULT NULL,
  `assigned_by` char(36) DEFAULT NULL,
  `assigned_at` datetime DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `base_status` enum('pending','running','completed') NOT NULL DEFAULT 'pending',
  `started_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `remarks` varchar(1000) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `stage_id` (`stage_id`),
  KEY `idx_flowchart_tasks_run` (`workflow_run_id`),
  KEY `idx_flowchart_tasks_assignee` (`assigned_to`),
  KEY `idx_flowchart_tasks_due` (`due_date`),
  CONSTRAINT `flowchart_tasks_ibfk_1` FOREIGN KEY (`workflow_run_id`) REFERENCES `workflow_runs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `flowchart_tasks_ibfk_2` FOREIGN KEY (`stage_id`) REFERENCES `workflow_stages` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `flowchart_tasks_ibfk_3` FOREIGN KEY (`assigned_to`) REFERENCES `employees` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `generated_insights`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `generated_insights` (
  `id` char(36) NOT NULL,
  `rule_key` varchar(50) NOT NULL,
  `severity` enum('info','warning','critical') NOT NULL DEFAULT 'info',
  `message` varchar(500) NOT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` varchar(100) DEFAULT NULL,
  `period_type` enum('monthly','yearly') NOT NULL,
  `period_key` varchar(10) NOT NULL,
  `generated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_generated_insights_period` (`period_type`,`period_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `insight_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `insight_rules` (
  `id` char(36) NOT NULL,
  `rule_key` enum('productivity_drop','merchant_followups_missed','department_declining','consistency_improved','repeat_defaulter','delay_spike') NOT NULL,
  `label` varchar(200) NOT NULL,
  `threshold_value` decimal(6,2) NOT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT '1',
  `description` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `rule_key` (`rule_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `kpi_definitions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kpi_definitions` (
  `id` char(36) NOT NULL,
  `name` varchar(150) NOT NULL,
  `category` enum('office','factory','crm') NOT NULL,
  `calculation_type` enum('flowchart','checklist','delegation','target_achievement','quality','timeliness','manual','crm_followup_discipline','crm_conversion','crm_pipeline_value','crm_delay_control','crm_data_discipline') NOT NULL,
  `default_weightage` decimal(5,2) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `kpi_department_weightages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kpi_department_weightages` (
  `id` char(36) NOT NULL,
  `kpi_definition_id` char(36) NOT NULL,
  `department_id` char(36) NOT NULL,
  `weightage` decimal(5,2) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_kpi_department` (`kpi_definition_id`,`department_id`),
  KEY `department_id` (`department_id`),
  CONSTRAINT `kpi_department_weightages_ibfk_1` FOREIGN KEY (`kpi_definition_id`) REFERENCES `kpi_definitions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `kpi_department_weightages_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `kpi_engine_definitions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kpi_engine_definitions` (
  `id` char(36) NOT NULL,
  `name` varchar(150) NOT NULL,
  `category` enum('office','factory','crm','purchase','quality','hr') NOT NULL,
  `formula` varchar(255) NOT NULL,
  `weightage` decimal(5,2) NOT NULL DEFAULT '10.00',
  `frequency` enum('daily','weekly','monthly','quarterly','yearly') NOT NULL DEFAULT 'monthly',
  `responsible_employee_id` char(36) DEFAULT NULL,
  `department_id` char(36) DEFAULT NULL,
  `green_threshold` decimal(6,2) NOT NULL DEFAULT '90.00',
  `amber_threshold` decimal(6,2) NOT NULL DEFAULT '70.00',
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_kpi_engine_definition_name` (`name`),
  KEY `responsible_employee_id` (`responsible_employee_id`),
  KEY `idx_kpi_engine_definitions_category` (`category`),
  KEY `idx_kpi_engine_definitions_department` (`department_id`),
  CONSTRAINT `kpi_engine_definitions_ibfk_1` FOREIGN KEY (`responsible_employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
  CONSTRAINT `kpi_engine_definitions_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `kpi_engine_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kpi_engine_entries` (
  `id` char(36) NOT NULL,
  `kpi_definition_id` char(36) NOT NULL,
  `period_key` varchar(10) NOT NULL,
  `target` decimal(15,4) NOT NULL,
  `actual` decimal(15,4) NOT NULL,
  `computed_score` decimal(8,2) DEFAULT NULL,
  `traffic_light` enum('red','amber','green') DEFAULT NULL,
  `weightage_used` decimal(5,2) NOT NULL,
  `entered_by` char(36) DEFAULT NULL,
  `entered_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_kpi_entry_period` (`kpi_definition_id`,`period_key`),
  KEY `entered_by` (`entered_by`),
  KEY `idx_kpi_engine_entries_period` (`period_key`),
  CONSTRAINT `kpi_engine_entries_ibfk_1` FOREIGN KEY (`kpi_definition_id`) REFERENCES `kpi_engine_definitions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `kpi_engine_entries_ibfk_2` FOREIGN KEY (`entered_by`) REFERENCES `employees` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `machines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `machines` (
  `id` char(36) NOT NULL,
  `name` varchar(150) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `factory_department_id` char(36) DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `factory_department_id` (`factory_department_id`),
  CONSTRAINT `machines_ibfk_1` FOREIGN KEY (`factory_department_id`) REFERENCES `factory_departments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `manager_feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `manager_feedback` (
  `id` char(36) NOT NULL,
  `employee_id` char(36) NOT NULL,
  `submitted_by` char(36) DEFAULT NULL,
  `period_type` enum('monthly','yearly') NOT NULL,
  `period_key` varchar(10) NOT NULL,
  `rating` tinyint NOT NULL,
  `comments` varchar(1000) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_feedback_period` (`employee_id`,`period_type`,`period_key`),
  KEY `submitted_by` (`submitted_by`),
  CONSTRAINT `manager_feedback_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `manager_feedback_ibfk_2` FOREIGN KEY (`submitted_by`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_rating_range` CHECK ((`rating` between 1 and 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `meeting_actions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meeting_actions` (
  `id` char(36) NOT NULL,
  `meeting_id` char(36) NOT NULL,
  `description` varchar(500) NOT NULL,
  `assigned_to` char(36) NOT NULL,
  `target_date` date NOT NULL,
  `priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  `linked_delegated_task_id` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `meeting_id` (`meeting_id`),
  KEY `assigned_to` (`assigned_to`),
  KEY `linked_delegated_task_id` (`linked_delegated_task_id`),
  CONSTRAINT `meeting_actions_ibfk_1` FOREIGN KEY (`meeting_id`) REFERENCES `meetings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `meeting_actions_ibfk_2` FOREIGN KEY (`assigned_to`) REFERENCES `employees` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `meeting_actions_ibfk_3` FOREIGN KEY (`linked_delegated_task_id`) REFERENCES `delegated_tasks` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `meeting_agenda_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meeting_agenda_items` (
  `id` char(36) NOT NULL,
  `meeting_id` char(36) NOT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `item_text` varchar(500) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `meeting_id` (`meeting_id`),
  CONSTRAINT `meeting_agenda_items_ibfk_1` FOREIGN KEY (`meeting_id`) REFERENCES `meetings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `meeting_attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meeting_attachments` (
  `id` char(36) NOT NULL,
  `meeting_id` char(36) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_url` varchar(1000) NOT NULL,
  `uploaded_by` char(36) DEFAULT NULL,
  `uploaded_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `meeting_id` (`meeting_id`),
  CONSTRAINT `meeting_attachments_ibfk_1` FOREIGN KEY (`meeting_id`) REFERENCES `meetings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `meeting_attendees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meeting_attendees` (
  `id` char(36) NOT NULL,
  `meeting_id` char(36) NOT NULL,
  `employee_id` char(36) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_meeting_attendee` (`meeting_id`,`employee_id`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `meeting_attendees_ibfk_1` FOREIGN KEY (`meeting_id`) REFERENCES `meetings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `meeting_attendees_ibfk_2` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `meeting_decisions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meeting_decisions` (
  `id` char(36) NOT NULL,
  `meeting_id` char(36) NOT NULL,
  `decision_text` varchar(1000) NOT NULL,
  `decided_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `meeting_id` (`meeting_id`),
  CONSTRAINT `meeting_decisions_ibfk_1` FOREIGN KEY (`meeting_id`) REFERENCES `meetings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `meeting_review_sections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meeting_review_sections` (
  `id` char(36) NOT NULL,
  `meeting_id` char(36) NOT NULL,
  `review_type` enum('department','performance','factory','crm','sales','production','quality','purchase','hr') NOT NULL,
  `report_type_ref` varchar(50) DEFAULT NULL,
  `notes` text,
  PRIMARY KEY (`id`),
  KEY `meeting_id` (`meeting_id`),
  CONSTRAINT `meeting_review_sections_ibfk_1` FOREIGN KEY (`meeting_id`) REFERENCES `meetings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `meetings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meetings` (
  `id` char(36) NOT NULL,
  `meeting_type` enum('daily_production','weekly_executive','monthly_management_review','quarterly_review') NOT NULL,
  `title` varchar(200) NOT NULL,
  `meeting_date` date NOT NULL,
  `status` enum('scheduled','completed','cancelled') NOT NULL DEFAULT 'scheduled',
  `organized_by` char(36) DEFAULT NULL,
  `discussion_notes` text,
  `previous_meeting_id` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `organized_by` (`organized_by`),
  KEY `previous_meeting_id` (`previous_meeting_id`),
  KEY `idx_meetings_type_date` (`meeting_type`,`meeting_date`),
  CONSTRAINT `meetings_ibfk_1` FOREIGN KEY (`organized_by`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
  CONSTRAINT `meetings_ibfk_2` FOREIGN KEY (`previous_meeting_id`) REFERENCES `meetings` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `notification_deliveries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_deliveries` (
  `id` char(36) NOT NULL,
  `notification_id` char(36) NOT NULL,
  `channel` enum('in_app','email','whatsapp','sms','push') NOT NULL,
  `delivery_status` enum('delivered','simulated','failed') NOT NULL DEFAULT 'simulated',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `notification_id` (`notification_id`),
  CONSTRAINT `notification_deliveries_ibfk_1` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `notification_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_templates` (
  `id` char(36) NOT NULL,
  `notification_type` enum('new_task_assigned','task_due_today','task_overdue','workflow_stage_assigned','workflow_approved','workflow_rejected','delegation_assigned','checklist_missed','daily_dpr_pending','factory_delay','machine_breakdown','crm_followup_due','crm_followup_missed','lead_assigned','lead_won','lead_lost','executive_meeting_reminder') NOT NULL,
  `module` enum('office','factory','crm','workflow','general') NOT NULL,
  `default_title` varchar(255) NOT NULL,
  `default_description` varchar(1000) DEFAULT NULL,
  `default_priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  `default_action_label` varchar(100) DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `notification_type` (`notification_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` char(36) NOT NULL,
  `notification_type` enum('new_task_assigned','task_due_today','task_overdue','workflow_stage_assigned','workflow_approved','workflow_rejected','delegation_assigned','checklist_missed','daily_dpr_pending','factory_delay','machine_breakdown','crm_followup_due','crm_followup_missed','lead_assigned','lead_won','lead_lost','executive_meeting_reminder') NOT NULL,
  `module` enum('office','factory','crm','workflow','general') NOT NULL,
  `reference_type` varchar(100) DEFAULT NULL,
  `reference_id` char(36) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` varchar(1000) DEFAULT NULL,
  `priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  `assigned_user_id` char(36) NOT NULL,
  `created_by` char(36) DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `status` enum('pending','actioned','dismissed') NOT NULL DEFAULT 'pending',
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `read_at` datetime DEFAULT NULL,
  `action_label` varchar(100) DEFAULT NULL,
  `action_url` varchar(500) DEFAULT NULL,
  `escalation_level` int NOT NULL DEFAULT '1',
  `last_escalated_at` datetime DEFAULT NULL,
  `parent_notification_id` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `parent_notification_id` (`parent_notification_id`),
  KEY `idx_notifications_assigned_user` (`assigned_user_id`,`is_read`),
  KEY `idx_notifications_status` (`status`),
  KEY `idx_notifications_due_date` (`due_date`),
  KEY `idx_notifications_reference` (`module`,`reference_type`,`reference_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`assigned_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `notifications_ibfk_3` FOREIGN KEY (`parent_notification_id`) REFERENCES `notifications` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `performance_goal_progress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `performance_goal_progress` (
  `id` char(36) NOT NULL,
  `goal_id` char(36) NOT NULL,
  `value` decimal(15,2) NOT NULL,
  `note` varchar(500) DEFAULT NULL,
  `recorded_by` char(36) NOT NULL,
  `recorded_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `goal_id` (`goal_id`),
  CONSTRAINT `performance_goal_progress_ibfk_1` FOREIGN KEY (`goal_id`) REFERENCES `performance_goals` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `performance_goals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `performance_goals` (
  `id` char(36) NOT NULL,
  `employee_id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` varchar(1000) DEFAULT NULL,
  `unit` varchar(50) DEFAULT NULL,
  `target_value` decimal(15,2) DEFAULT NULL,
  `current_value` decimal(15,2) NOT NULL DEFAULT '0.00',
  `weight` decimal(5,2) NOT NULL DEFAULT '0.00',
  `status` enum('active','completed','cancelled') NOT NULL DEFAULT 'active',
  `start_date` date DEFAULT NULL,
  `target_date` date DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_performance_goals_employee` (`employee_id`),
  CONSTRAINT `performance_goals_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `performance_review_goal_scores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `performance_review_goal_scores` (
  `id` char(36) NOT NULL,
  `review_id` char(36) NOT NULL,
  `goal_id` char(36) NOT NULL,
  `goal_title_snapshot` varchar(255) NOT NULL,
  `weight` decimal(5,2) NOT NULL,
  `target_value` decimal(15,2) DEFAULT NULL,
  `achieved_value` decimal(15,2) DEFAULT NULL,
  `achievement_percentage` decimal(5,2) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `review_id` (`review_id`),
  KEY `goal_id` (`goal_id`),
  CONSTRAINT `performance_review_goal_scores_ibfk_1` FOREIGN KEY (`review_id`) REFERENCES `performance_reviews` (`id`) ON DELETE CASCADE,
  CONSTRAINT `performance_review_goal_scores_ibfk_2` FOREIGN KEY (`goal_id`) REFERENCES `performance_goals` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `performance_reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `performance_reviews` (
  `id` char(36) NOT NULL,
  `employee_id` char(36) NOT NULL,
  `manager_id` char(36) DEFAULT NULL,
  `status` enum('self_pending','manager_pending','completed') NOT NULL DEFAULT 'self_pending',
  `self_summary` text,
  `self_submitted_at` datetime DEFAULT NULL,
  `manager_summary` text,
  `manager_score` decimal(5,2) DEFAULT NULL,
  `manager_submitted_at` datetime DEFAULT NULL,
  `goal_score` decimal(5,2) DEFAULT NULL,
  `overall_score` decimal(5,2) DEFAULT NULL,
  `initiated_by` char(36) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_performance_reviews_employee` (`employee_id`),
  KEY `idx_performance_reviews_manager` (`manager_id`),
  CONSTRAINT `performance_reviews_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `performance_reviews_ibfk_2` FOREIGN KEY (`manager_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` char(36) NOT NULL,
  `key` varchar(150) NOT NULL,
  `module` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `production_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `production_entries` (
  `id` char(36) NOT NULL,
  `employee_id` char(36) NOT NULL,
  `line_id` char(36) NOT NULL,
  `shift_id` char(36) NOT NULL,
  `entry_date` date NOT NULL,
  `quantity_produced` decimal(15,2) NOT NULL,
  `target_quantity` decimal(15,2) DEFAULT NULL,
  `notes` varchar(500) DEFAULT NULL,
  `recorded_by` char(36) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_entry_per_worker_per_slot` (`employee_id`,`line_id`,`shift_id`,`entry_date`),
  KEY `shift_id` (`shift_id`),
  KEY `idx_production_entries_line_shift_date` (`line_id`,`shift_id`,`entry_date`),
  KEY `idx_production_entries_employee` (`employee_id`),
  CONSTRAINT `production_entries_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `production_entries_ibfk_2` FOREIGN KEY (`line_id`) REFERENCES `production_lines` (`id`) ON DELETE CASCADE,
  CONSTRAINT `production_entries_ibfk_3` FOREIGN KEY (`shift_id`) REFERENCES `shifts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `production_lines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `production_lines` (
  `id` char(36) NOT NULL,
  `name` varchar(150) NOT NULL,
  `code` varchar(30) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` char(36) NOT NULL,
  `name` varchar(200) NOT NULL,
  `sku` varchar(100) DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `refresh_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refresh_tokens` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `ip_address` varchar(64) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `refresh_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `report_run_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `report_run_history` (
  `id` char(36) NOT NULL,
  `scheduled_report_id` char(36) DEFAULT NULL,
  `report_type` enum('employee_performance','department_performance','office_performance','factory_performance','workflow_reports','checklist_reports','delegation_reports','crm_reports','sales_pipeline','merchant_performance','production_reports','executive_reports') NOT NULL,
  `run_by` char(36) DEFAULT NULL,
  `row_count` int NOT NULL DEFAULT '0',
  `ran_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `scheduled_report_id` (`scheduled_report_id`),
  KEY `run_by` (`run_by`),
  CONSTRAINT `report_run_history_ibfk_1` FOREIGN KEY (`scheduled_report_id`) REFERENCES `scheduled_reports` (`id`) ON DELETE CASCADE,
  CONSTRAINT `report_run_history_ibfk_2` FOREIGN KEY (`run_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `role_id` char(36) NOT NULL,
  `permission_id` char(36) NOT NULL,
  PRIMARY KEY (`role_id`,`permission_id`),
  KEY `permission_id` (`permission_id`),
  CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` char(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `is_system_role` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `saved_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `saved_reports` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `report_type` enum('employee_performance','department_performance','office_performance','factory_performance','workflow_reports','checklist_reports','delegation_reports','crm_reports','sales_pipeline','merchant_performance','production_reports','executive_reports') NOT NULL,
  `name` varchar(150) NOT NULL,
  `filters` json NOT NULL,
  `chart_type` enum('bar','line','pie','area','heatmap','gauge','treemap','table') NOT NULL DEFAULT 'table',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_saved_reports_user` (`user_id`,`report_type`),
  CONSTRAINT `saved_reports_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `scheduled_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `scheduled_reports` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `report_type` enum('employee_performance','department_performance','office_performance','factory_performance','workflow_reports','checklist_reports','delegation_reports','crm_reports','sales_pipeline','merchant_performance','production_reports','executive_reports') NOT NULL,
  `name` varchar(150) NOT NULL,
  `filters` json NOT NULL,
  `frequency` enum('daily','weekly','monthly') NOT NULL,
  `status` enum('active','paused') NOT NULL DEFAULT 'active',
  `last_run_at` datetime DEFAULT NULL,
  `next_due_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_scheduled_reports_due` (`status`,`next_due_at`),
  CONSTRAINT `scheduled_reports_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `schema_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schema_migrations` (
  `filename` varchar(255) NOT NULL,
  `applied_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`filename`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `shifts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shifts` (
  `id` char(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_roles` (
  `user_id` char(36) NOT NULL,
  `role_id` char(36) NOT NULL,
  `scope_type` varchar(50) NOT NULL DEFAULT 'global',
  `scope_id` char(36) NOT NULL DEFAULT '',
  PRIMARY KEY (`user_id`,`role_id`,`scope_type`,`scope_id`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_roles_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` char(36) NOT NULL,
  `employee_code` varchar(50) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `status` enum('active','suspended','inactive') NOT NULL DEFAULT 'active',
  `last_login_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `employee_code` (`employee_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `workflow_runs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workflow_runs` (
  `id` char(36) NOT NULL,
  `workflow_id` char(36) NOT NULL,
  `reference` varchar(200) NOT NULL,
  `notes` varchar(1000) DEFAULT NULL,
  `status` enum('in_progress','completed','cancelled') NOT NULL DEFAULT 'in_progress',
  `started_by` char(36) NOT NULL,
  `started_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_workflow_runs_workflow` (`workflow_id`),
  KEY `idx_workflow_runs_status` (`status`),
  CONSTRAINT `workflow_runs_ibfk_1` FOREIGN KEY (`workflow_id`) REFERENCES `workflows` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `workflow_stage_checklist_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workflow_stage_checklist_items` (
  `id` char(36) NOT NULL,
  `stage_id` char(36) NOT NULL,
  `label` varchar(255) NOT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `stage_id` (`stage_id`),
  CONSTRAINT `workflow_stage_checklist_items_ibfk_1` FOREIGN KEY (`stage_id`) REFERENCES `workflow_stages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `workflow_stage_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workflow_stage_documents` (
  `id` char(36) NOT NULL,
  `stage_id` char(36) NOT NULL,
  `document_name` varchar(255) NOT NULL,
  `is_mandatory` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `stage_id` (`stage_id`),
  CONSTRAINT `workflow_stage_documents_ibfk_1` FOREIGN KEY (`stage_id`) REFERENCES `workflow_stages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `workflow_stage_escalation_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workflow_stage_escalation_rules` (
  `id` char(36) NOT NULL,
  `stage_id` char(36) NOT NULL,
  `escalate_after_days` int NOT NULL,
  `escalate_to_role_id` char(36) NOT NULL,
  `escalation_action` enum('notify_only','reassign') NOT NULL DEFAULT 'notify_only',
  `notes` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `stage_id` (`stage_id`),
  KEY `escalate_to_role_id` (`escalate_to_role_id`),
  CONSTRAINT `workflow_stage_escalation_rules_ibfk_1` FOREIGN KEY (`stage_id`) REFERENCES `workflow_stages` (`id`) ON DELETE CASCADE,
  CONSTRAINT `workflow_stage_escalation_rules_ibfk_2` FOREIGN KEY (`escalate_to_role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `workflow_stage_notification_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workflow_stage_notification_rules` (
  `id` char(36) NOT NULL,
  `stage_id` char(36) NOT NULL,
  `trigger_event` enum('on_stage_start','on_due_date','on_overdue','on_completion','on_escalation') NOT NULL,
  `channel` enum('email','sms','in_app') NOT NULL DEFAULT 'in_app',
  `recipient_type` enum('responsible_role','initiator','custom_role') NOT NULL DEFAULT 'responsible_role',
  `custom_role_id` char(36) DEFAULT NULL,
  `message_template` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `stage_id` (`stage_id`),
  KEY `custom_role_id` (`custom_role_id`),
  CONSTRAINT `workflow_stage_notification_rules_ibfk_1` FOREIGN KEY (`stage_id`) REFERENCES `workflow_stages` (`id`) ON DELETE CASCADE,
  CONSTRAINT `workflow_stage_notification_rules_ibfk_2` FOREIGN KEY (`custom_role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `workflow_stages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workflow_stages` (
  `id` char(36) NOT NULL,
  `workflow_id` char(36) NOT NULL,
  `name` varchar(200) NOT NULL,
  `sequence` int NOT NULL,
  `responsible_role_id` char(36) NOT NULL,
  `due_days` int DEFAULT NULL,
  `approval_required` tinyint(1) NOT NULL DEFAULT '0',
  `checklist_required` tinyint(1) NOT NULL DEFAULT '0',
  `can_skip` tinyint(1) NOT NULL DEFAULT '0',
  `completion_mode` enum('manual','approval_only','all_checklist_items','all_of_the_above') NOT NULL DEFAULT 'manual',
  `min_mandatory_documents` int NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_workflow_stage_sequence` (`workflow_id`,`sequence`),
  KEY `responsible_role_id` (`responsible_role_id`),
  KEY `idx_workflow_stages_workflow` (`workflow_id`),
  CONSTRAINT `workflow_stages_ibfk_1` FOREIGN KEY (`workflow_id`) REFERENCES `workflows` (`id`) ON DELETE CASCADE,
  CONSTRAINT `workflow_stages_ibfk_2` FOREIGN KEY (`responsible_role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `workflows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workflows` (
  `id` char(36) NOT NULL,
  `name` varchar(200) NOT NULL,
  `department_id` char(36) DEFAULT NULL,
  `description` varchar(1000) DEFAULT NULL,
  `status` enum('draft','active','inactive','archived') NOT NULL DEFAULT 'draft',
  `version` int NOT NULL DEFAULT '1',
  `created_by` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_workflows_department` (`department_id`),
  KEY `idx_workflows_status` (`status`),
  CONSTRAINT `workflows_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

