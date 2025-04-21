-- Insert sample users
INSERT INTO test.users (username, email, password, name, surname, role)
VALUES ('a', 'john@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyea7wdtWgtb7pfXoReLE2qQR2N4VuAbtO', 'John', 'Doe',
        'USER'),
       ('jane_smith', 'jane@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyea7wdtWgtb7pfXoReLE2qQR2N4VuAbtO', 'Jane',
        'Smith', 'USER'),
       ('admin', 'admin@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyea7wdtWgtb7pfXoReLE2qQR2N4VuAbtO', 'Admin', 'User',
        'ADMIN');

-- Insert sample group
INSERT INTO test.groups (name, description, created_at, created_by_id)
VALUES ('Family Trip', 'Expenses from our summer vacation', NOW(), 1);

-- Insert group members
INSERT INTO test.group_users (group_id, user_id)
VALUES (1, 1),
       (1, 2),
       (1, 3);

-- Insert sample expenses
INSERT INTO test.expenses (amount, description, date, group_id, paid_by_id)
VALUES (100.00, 'Dinner at restaurant', NOW(), 1, 1),
       (50.00, 'Museum tickets', NOW(), 1, 2),
       (200.00, 'Hotel room', NOW(), 1, 3);

-- Insert expense splits
INSERT INTO test.expense_splits (expense_id, user_id, amount)
VALUES (1, 1, 33.33),
       (1, 2, 33.33),
       (1, 3, 33.34),
       (2, 1, 16.67),
       (2, 2, 16.67),
       (2, 3, 16.66),
       (3, 1, 66.67),
       (3, 2, 66.67),
       (3, 3, 66.66);