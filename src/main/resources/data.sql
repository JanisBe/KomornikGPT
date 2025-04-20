-- Insert sample users
INSERT INTO users (username, email, password, name, surname, role) VALUES
('john_doe', 'john@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'John', 'Doe', 'USER'),
('jane_smith', 'jane@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Jane', 'Smith', 'USER'),
('admin', 'admin@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Admin', 'User', 'ADMIN');

-- Insert sample group
INSERT INTO groups (name, description) VALUES
('Family', 'Family expenses group');

-- Add users to the group
INSERT INTO group_users (group_id, user_id) VALUES
(1, 1), -- John Doe
(1, 2), -- Jane Smith
(1, 3); -- Admin

-- Insert sample expenses
INSERT INTO expenses (amount, description, date, payer_id, group_id) VALUES
(100.00, 'Groceries', CURRENT_DATE, 1, 1),
(50.00, 'Restaurant', CURRENT_DATE, 2, 1),
(200.00, 'Utilities', CURRENT_DATE, 3, 1);

-- Insert expense splits
INSERT INTO expense_splits (amount, expense_id, user_id) VALUES
(50.00, 1, 1), -- John paid 50 for groceries
(50.00, 1, 2), -- Jane paid 50 for groceries
(25.00, 2, 1), -- John paid 25 for restaurant
(25.00, 2, 2), -- Jane paid 25 for restaurant
(100.00, 3, 1), -- John paid 100 for utilities
(100.00, 3, 2); -- Jane paid 100 for utilities 