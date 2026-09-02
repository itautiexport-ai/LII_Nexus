-- Migration 106: Add building, floor, and location to machines table

ALTER TABLE `machines` ADD COLUMN `building` VARCHAR(50) DEFAULT NULL;
ALTER TABLE `machines` ADD COLUMN `floor` VARCHAR(50) DEFAULT NULL;
ALTER TABLE `machines` ADD COLUMN `location` VARCHAR(150) DEFAULT NULL;
