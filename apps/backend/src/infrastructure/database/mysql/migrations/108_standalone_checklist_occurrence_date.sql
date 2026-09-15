-- Migration 108: Add occurrence_date column to standalone_checklist_completions
ALTER TABLE standalone_checklist_completions 
  ADD COLUMN occurrence_date DATE NULL AFTER checklist_id,
  ADD INDEX idx_chk_comp_occ (checklist_id, occurrence_date);
