ALTER TABLE hod_evaluations 
  ADD COLUMN quality_of_work DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN technical_competence DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN leadership DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN team_behaviour DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN initiative DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN cost_saving DECIMAL(5,2) DEFAULT 0;
