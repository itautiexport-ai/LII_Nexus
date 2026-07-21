CREATE TABLE fms_managers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sop_video_link VARCHAR(255),
    description TEXT NOT NULL,
    global_pc VARCHAR(255),
    t_field VARCHAR(255),
    conditional_step BOOLEAN DEFAULT FALSE,
    consolidated_entry BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
