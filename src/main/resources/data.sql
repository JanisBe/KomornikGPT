TRUNCATE TABLE expense_splits, expenses, group_users, groups, users RESTART IDENTITY CASCADE;
-- Insert sample users
INSERT INTO users (username, email, password, name, surname, role)
VALUES ('a', 'john@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyea7wdtWgtb7pfXoReLE2qQR2N4VuAbtO', 'John', 'Doe',
        'USER'),
       ('jane_smith', 'jane@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyea7wdtWgtb7pfXoReLE2qQR2N4VuAbtO', 'Jane',
        'Smith', 'USER'),
       ('admin', 'admin@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyea7wdtWgtb7pfXoReLE2qQR2N4VuAbtO', 'Admin', 'User',
        'ADMIN');

-- Insert sample group
INSERT INTO groups (name, description, created_at, created_by_id)
VALUES ('Family Trip', 'Expenses from our summer vacation', NOW(), 1);

-- Insert group members
INSERT INTO group_users (group_id, user_id)
VALUES (1, 1),
       (1, 2),
       (1, 3);

-- Insert sample expenses
INSERT INTO expenses (amount, description, date, group_id, payer_id, currency)
VALUES
-- Original expenses
-- Additional expenses (40 more with different dates)
(75.50, 'Grocery shopping', '2024-04-20 10:30:00', 1, 1, 'PLN'),
(120.00, 'Cinema tickets', '2024-04-20 18:45:00', 1, 2, 'PLN'),
(45.00, 'Pizza delivery', '2024-04-20 20:15:00', 1, 3, 'PLN'),
(89.99, 'Gas station', '2024-04-19 11:20:00', 1, 1, 'PLN'),
(35.00, 'Parking fee', '2024-04-19 14:30:00', 1, 2, 'PLN'),
(150.00, 'Concert tickets', '2024-04-19 16:00:00', 1, 3, 'PLN'),
(65.00, 'Taxi ride', '2024-04-18 22:45:00', 1, 1, 'PLN'),
(42.50, 'Coffee shop', '2024-04-18 09:15:00', 1, 2, 'PLN'),
(180.00, 'Spa treatment', '2024-04-18 15:30:00', 1, 3, 'PLN'),
(95.00, 'Sports equipment rental', '2024-04-17 13:20:00', 1, 1, 'PLN'),
(25.00, 'Ice cream for everyone', '2024-04-17 16:45:00', 1, 2, 'PLN'),
(145.00, 'Theater tickets', '2024-04-17 19:00:00', 1, 3, 'PLN'),
(55.00, 'Board game café', '2024-04-16 14:30:00', 1, 1, 'PLN'),
(110.00, 'Wine tasting', '2024-04-16 17:15:00', 1, 2, 'PLN'),
(78.50, 'Bowling night', '2024-04-16 20:00:00', 1, 3, 'PLN'),
(220.00, 'Amusement park tickets', '2024-04-15 11:00:00', 1, 1, 'PLN'),
(45.00, 'Street food lunch', '2024-04-15 13:30:00', 1, 2, 'PLN'),
(165.00, 'Escape room', '2024-04-15 16:45:00', 1, 3, 'PLN'),
(85.00, 'Boat rental', '2024-04-14 10:15:00', 1, 1, 'PLN'),
(32.50, 'Snacks and drinks', '2024-04-14 15:30:00', 1, 2, 'PLN'),
(195.00, 'Cooking class', '2024-04-14 18:00:00', 1, 3, 'PLN'),
(70.00, 'Mini golf', '2024-04-13 14:20:00', 1, 1, 'PLN'),
(130.00, 'Art gallery tickets', '2024-04-13 16:30:00', 1, 2, 'PLN'),
(88.00, 'Karaoke night', '2024-04-13 21:00:00', 1, 3, 'PLN'),
(175.00, 'Bike rental', '2024-04-12 09:45:00', 1, 1, 'PLN'),
(40.00, 'Beach umbrella rental', '2024-04-12 11:30:00', 1, 2, 'PLN'),
(155.00, 'Sunset cruise', '2024-04-12 17:45:00', 1, 3, 'PLN'),
(92.50, 'Souvenir shopping', '2024-04-11 13:15:00', 1, 1, 'PLN'),
(28.00, 'Public transport passes', '2024-04-11 10:00:00', 1, 2, 'PLN'),
(135.00, 'Pottery workshop', '2024-04-11 15:30:00', 1, 3, 'PLN'),
(82.00, 'Arcade games', '2024-04-10 16:20:00', 1, 1, 'PLN'),
(145.00, 'Zoo tickets', '2024-04-10 11:45:00', 1, 2, 'PLN'),
(67.50, 'Food truck festival', '2024-04-10 19:00:00', 1, 3, 'PLN'),
(225.00, 'Helicopter tour', '2024-04-09 14:30:00', 1, 1, 'PLN'),
(38.00, 'Museum gift shop', '2024-04-09 16:15:00', 1, 2, 'PLN'),
(168.00, 'Aquarium visit', '2024-04-09 11:00:00', 1, 3, 'PLN'),
(79.00, 'Laser tag game', '2024-04-08 18:30:00', 1, 1, 'PLN'),
(142.00, 'Dinner cruise', '2024-04-08 19:45:00', 1, 2, 'PLN'),
(93.50, 'Rock climbing', '2024-04-08 15:20:00', 1, 3, 'PLN'),
(185.00, 'Safari park tickets', '2024-04-07 10:30:00', 1, 1, 'PLN'),
(48.00, 'Board game purchase', '2024-04-07 14:15:00', 1, 2, 'PLN'),
(159.00, 'VR gaming session', '2024-04-07 16:45:00', 1, 3, 'PLN');

-- Insert expense splits
INSERT INTO expense_splits (expense_id, user_id, amount_owed, is_paid)
SELECT e.id,
       u.id,
       ROUND(e.amount / 3, 2) +
       CASE
           WHEN u.id = (SELECT MIN(user_id) FROM group_users WHERE group_id = 1) AND e.amount % 3 != 0
               THEN 0.01
           ELSE 0
           END,
       false
FROM expenses e
         CROSS JOIN users u
WHERE u.id IN (SELECT user_id FROM group_users WHERE group_id = 1)
ORDER BY e.id, u.id;