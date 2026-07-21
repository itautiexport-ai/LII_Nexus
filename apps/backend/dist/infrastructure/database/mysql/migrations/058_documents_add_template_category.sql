ALTER TABLE documents MODIFY COLUMN category ENUM('sop','drawing','work_instruction','qc_format','policy','contract','buyer_document','machine_manual','training_video','template') NOT NULL;
