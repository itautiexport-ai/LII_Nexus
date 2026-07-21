CREATE TABLE IF NOT EXISTS production_planning_records (
    id CHAR(36) PRIMARY KEY,
    factory_list VARCHAR(255),
    order_date DATE,
    company_details TEXT,
    erp_no VARCHAR(255),
    ex_factory_date DATE,
    total_cbm DECIMAL(10,2),
    created_by CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
