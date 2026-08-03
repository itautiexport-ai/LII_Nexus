INSERT IGNORE INTO roles (id, name, description, is_system_role) VALUES 
(UUID(), 'User Dashboard Access', 'Grants access to the User Dashboard', 0),
(UUID(), 'Help Ticket Access', 'Grants access to Help Tickets', 0),
(UUID(), 'Machine Efficiency Access', 'Grants access to Machine Efficiency', 0);
