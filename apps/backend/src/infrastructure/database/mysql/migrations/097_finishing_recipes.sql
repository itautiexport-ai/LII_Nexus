CREATE TABLE IF NOT EXISTS finishing_recipes (
    id VARCHAR(36) PRIMARY KEY,
    item_code VARCHAR(100) NOT NULL,
    finish_code VARCHAR(100) NOT NULL,
    item_description VARCHAR(255) NOT NULL,
    created_on DATE NOT NULL,
    buyer_code VARCHAR(100),
    gloss_level VARCHAR(100),
    wood_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS finishing_recipe_steps (
    id VARCHAR(36) PRIMARY KEY,
    recipe_id VARCHAR(36) NOT NULL,
    step_no INT NOT NULL,
    process_material VARCHAR(255),
    tool_machine VARCHAR(255),
    grit_quantity VARCHAR(100),
    drying_time VARCHAR(100),
    notes TEXT,
    no_of_coats VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_finishing_recipe_steps_recipe_id FOREIGN KEY (recipe_id) REFERENCES finishing_recipes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
