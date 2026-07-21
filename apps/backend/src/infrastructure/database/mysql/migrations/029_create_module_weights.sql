CREATE TABLE IF NOT EXISTS module_weights (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fms_weight DECIMAL(5,2) NOT NULL DEFAULT 50.00,
    checklist_weight DECIMAL(5,2) NOT NULL DEFAULT 30.00,
    delegation_weight DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO module_weights (fms_weight, checklist_weight, delegation_weight)
SELECT 50.00, 30.00, 20.00
WHERE NOT EXISTS (SELECT 1 FROM module_weights);
