-- Use the database
USE mobile_app_db;

-- Create table for Plaid items (linked bank accounts)
CREATE TABLE IF NOT EXISTS plaid_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    item_id VARCHAR(128) NOT NULL,
    access_token VARCHAR(128) NOT NULL,
    institution_id VARCHAR(64),
    institution_name VARCHAR(128),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (user_id, item_id)
);

-- Create table for Plaid accounts
CREATE TABLE IF NOT EXISTS plaid_accounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    plaid_item_id INT NOT NULL,
    user_id INT NOT NULL,
    account_id VARCHAR(128) NOT NULL,
    account_name VARCHAR(128),
    account_type VARCHAR(64),
    account_subtype VARCHAR(64),
    mask VARCHAR(16),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (plaid_item_id) REFERENCES plaid_items(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (user_id, account_id)
);

-- Create indexes for performance
CREATE INDEX idx_plaid_items_user ON plaid_items(user_id);
CREATE INDEX idx_plaid_accounts_user ON plaid_accounts(user_id);
CREATE INDEX idx_plaid_accounts_item ON plaid_accounts(plaid_item_id); 