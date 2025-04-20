ALTER DATABASE test CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

ALTER TABLE user CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Użytkownicy
INSERT INTO user (name, surname, email, username, password) VALUES
                                                                ('John', 'Doe', 'john.doe@example.com', 'john_doe', '$2a$10$E7VuT4hQOo7k6X5L1UOzEeWf4QJ3gYb7d6N1JmKv8wL2aV1sS5rG'),
                                                                ('Jane', 'Smith', 'jane.smith@example.net', 'jane_smith', '$2a$10$E7VuT4hQOo7k6X5L1UOzEeWf4QJ3gYb7d6N1JmKv8wL2aV1sS5rG'),
                                                                ('Mike', 'Jones', 'mike.jones@demo.org', 'mike_jones', '$2a$10$E7VuT4hQOo7k6X5L1UOzEeWf4QJ3gYb7d6N1JmKv8wL2aV1sS5rG');

-- Grupy
INSERT INTO groups (id, name)
VALUES (1, 'Ekipa Z Gwiazdozbioru Raka');

-- Relacje grupowe (jeśli masz osobną tabelę)
INSERT INTO group_users (group_id, user_id)
VALUES (1, 1);
INSERT INTO group_users (group_id, user_id)
VALUES (1, 2);
INSERT INTO group_users (group_id, user_id)
VALUES (1, 3);

-- Wydatki
INSERT INTO expense (id, amount, date, payer_id, group_id)
VALUES (1, 120.00, '2025-04-13T10:00:00', 1, 1);

-- Podział wydatku (split)
INSERT INTO expense_split (id, amount_owed, expense_id, user_id)
VALUES (1, 40.00, 1, 1),
       (2, 40.00, 1, 2),
       (3, 40.00, 1, 3);
