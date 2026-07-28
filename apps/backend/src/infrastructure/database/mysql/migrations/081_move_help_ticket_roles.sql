UPDATE roles SET name = REPLACE(name, 'Menu: Help Ticket', 'Menu: HR -> Help Ticket') WHERE name LIKE 'Menu: Help Ticket%';
UPDATE user_roles ur JOIN roles r ON ur.role_id = r.id SET r.name = REPLACE(r.name, 'Menu: Help Ticket', 'Menu: HR -> Help Ticket') WHERE r.name LIKE 'Menu: Help Ticket%';
