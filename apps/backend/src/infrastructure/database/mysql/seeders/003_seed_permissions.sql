INSERT IGNORE INTO permissions (id, `key`, module, description) VALUES
  (UUID(), 'performance.goal.view', 'performance', 'View goals belonging to other employees'),
  (UUID(), 'performance.goal.create', 'performance', 'Create goals for other employees'),
  (UUID(), 'performance.goal.update', 'performance', 'Update goals belonging to other employees'),
  (UUID(), 'performance.goal.delete', 'performance', 'Cancel/delete goals belonging to other employees'),
  (UUID(), 'performance.review.view', 'performance', 'View reviews belonging to other employees'),
  (UUID(), 'performance.review.create', 'performance', 'Initiate a review for other employees'),
  (UUID(), 'performance.review.manager_submit', 'performance', 'Submit the manager assessment on behalf of another manager');
