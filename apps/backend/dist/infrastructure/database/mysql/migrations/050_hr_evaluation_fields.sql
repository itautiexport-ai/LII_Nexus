ALTER TABLE hr_evaluations 
  ADD COLUMN attendance_punctuality DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN discipline DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN behaviour_attitude DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN communication DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN responsibility_accountability DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN work_ethics DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN team_contribution DECIMAL(5,2) DEFAULT 0;
