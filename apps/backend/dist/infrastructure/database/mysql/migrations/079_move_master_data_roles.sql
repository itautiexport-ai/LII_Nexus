UPDATE roles SET name = REPLACE(name, 'Menu: Master Data', 'Menu: Administration -> Master Data') WHERE name LIKE 'Menu: Master Data%';
UPDATE user_roles ur JOIN roles r ON ur.role_id = r.id SET r.name = REPLACE(r.name, 'Menu: Master Data', 'Menu: Administration -> Master Data') WHERE r.name LIKE 'Menu: Master Data%';
