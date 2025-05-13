-- First check if the role column already exists
SET @column_exists = 0;
SELECT COUNT(*) INTO @column_exists
FROM information_schema.columns 
WHERE table_schema = DATABASE()
AND table_name = 'users' 
AND column_name = 'role';

-- Add the role column if it doesn't exist
SET @query = IF(@column_exists = 0, 
                'ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT "user" AFTER email',
                'SELECT "Role column already exists" AS message');

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create admin user if not exists (for testing only)
-- In production, you would manage roles through application logic
INSERT INTO users (firebase_uid, username, email, role, created_at)
SELECT 'admin_user_id', 'admin', 'admin@example.com', 'admin', NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE role = 'admin'
) LIMIT 1; 