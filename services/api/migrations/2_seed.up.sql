-- Seed demo users and files

INSERT INTO users (id, email, password_hash, role, plan, created_at)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'demo@example.com', 'password123', 'user', 'free', NOW()),
    ('00000000-0000-0000-0000-000000000002', 'pro@example.com', 'password123', 'user', 'pro', NOW()),
    ('00000000-0000-0000-0000-000000000003', 'admin@example.com', 'adminpassword', 'admin', 'pro', NOW());

-- Seed an example file (metadata only); actual file should be uploaded via API.
INSERT INTO files (id, owner_id, name, size, storage_key, created_at)
VALUES
    ('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000001', 'sample.pdf', 0, 'sample.pdf', NOW());