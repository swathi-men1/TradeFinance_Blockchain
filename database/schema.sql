
-- PostgreSQL Database Setup Script for Trade Finance Explorer
-- This script creates the database and all required tables

-- Step 1: Create database (run this as postgres user first)
-- Connect to postgres database, then run:
-- CREATE DATABASE trade_finance_db;

-- Step 2: Connect to trade_finance_db and run the rest

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS risk_scores CASCADE;
DROP TABLE IF EXISTS trade_transactions CASCADE;
DROP TABLE IF EXISTS ledger_entries CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Drop existing types if they exist
DROP TYPE IF EXISTS role_enum CASCADE;
DROP TYPE IF EXISTS doc_type_enum CASCADE;
DROP TYPE IF EXISTS ledger_action_enum CASCADE;
DROP TYPE IF EXISTS doc_status_enum CASCADE;

-- Create enum types
CREATE TYPE role_enum AS ENUM ('bank', 'corporate', 'auditor', 'admin');
CREATE TYPE doc_type_enum AS ENUM ('LOC', 'INVOICE', 'BILL_OF_LADING', 'PO', 'COO', 'INSURANCE_CERT');
CREATE TYPE doc_status_enum AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');
CREATE TYPE ledger_action_enum AS ENUM ('ISSUED', 'AMENDED', 'SHIPPED', 'RECEIVED', 'PAID', 'CANCELLED', 'VERIFIED', 'SUSPECTED_TAMPERING');

-- User Profiles Table
CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role role_enum NOT NULL,
    org_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents Table
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER REFERENCES user_profiles(id) ON DELETE CASCADE,
    doc_type doc_type_enum NOT NULL,
    doc_number VARCHAR(100) UNIQUE NOT NULL,
    file_url TEXT,
    hash VARCHAR(64) NOT NULL,
    status doc_status_enum DEFAULT 'PENDING',
    issued_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ledger Entries Table (Immutable audit trail)
CREATE TABLE ledger_entries (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    action ledger_action_enum NOT NULL,
    actor_id INTEGER REFERENCES user_profiles(id),
    metadata JSONB,
    hash VARCHAR(64),
    previous_hash VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trade Transactions Table
CREATE TABLE trade_transactions (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id),
    buyer_id INTEGER REFERENCES user_profiles(id),
    seller_id INTEGER REFERENCES user_profiles(id),
    amount DECIMAL(15, 2),
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Risk Scores Table
CREATE TABLE risk_scores (
    id SERIAL PRIMARY KEY,
    entity_id INTEGER REFERENCES user_profiles(id),
    score NUMERIC(5, 2),
    rationale TEXT,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs Table
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES user_profiles(id),
    action VARCHAR(255) NOT NULL,
    target_type VARCHAR(100),
    target_id INTEGER,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_documents_owner ON documents(owner_id);
CREATE INDEX idx_documents_type ON documents(doc_type);
CREATE INDEX idx_ledger_document ON ledger_entries(document_id);
CREATE INDEX idx_ledger_created ON ledger_entries(created_at);
CREATE INDEX idx_users_email ON user_profiles(email);
CREATE INDEX idx_users_role ON user_profiles(role);

-- Grant permissions (if needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database schema created successfully!';
    RAISE NOTICE 'Tables: user_profiles, documents, ledger_entries, trade_transactions, risk_scores, audit_logs';
END $$;
