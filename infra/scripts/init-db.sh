#!/bin/bash
set -euo pipefail

# PostgreSQL initialization script
# Runs automatically on first container start via /docker-entrypoint-initdb.d/

echo "==> Initializing PostgreSQL database..."

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL

    -- Enable commonly used extensions
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    CREATE EXTENSION IF NOT EXISTS "citext";

    -- Create application schemas
    CREATE SCHEMA IF NOT EXISTS app;
    CREATE SCHEMA IF NOT EXISTS analytics;

    -- Users table
    CREATE TABLE IF NOT EXISTS app.users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email CITEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'student',
        avatar_url TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        email_verified BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Exams table
    CREATE TABLE IF NOT EXISTS app.exams (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(500) NOT NULL,
        description TEXT,
        category VARCHAR(100) NOT NULL,
        difficulty VARCHAR(50) NOT NULL DEFAULT 'medium',
        duration_minutes INTEGER NOT NULL DEFAULT 60,
        total_marks INTEGER NOT NULL,
        passing_marks INTEGER NOT NULL,
        is_published BOOLEAN NOT NULL DEFAULT false,
        created_by UUID REFERENCES app.users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Exam attempts table
    CREATE TABLE IF NOT EXISTS app.exam_attempts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
        exam_id UUID NOT NULL REFERENCES app.exams(id) ON DELETE CASCADE,
        score INTEGER,
        total_marks INTEGER,
        status VARCHAR(50) NOT NULL DEFAULT 'in_progress',
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        submitted_at TIMESTAMPTZ,
        time_spent_seconds INTEGER DEFAULT 0
    );

    -- Analytics: user activity log
    CREATE TABLE IF NOT EXISTS analytics.activity_log (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(100),
        resource_id UUID,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_users_email ON app.users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON app.users(role);
    CREATE INDEX IF NOT EXISTS idx_exams_category ON app.exams(category);
    CREATE INDEX IF NOT EXISTS idx_exams_published ON app.exams(is_published);
    CREATE INDEX IF NOT EXISTS idx_exam_attempts_user ON app.exam_attempts(user_id);
    CREATE INDEX IF NOT EXISTS idx_exam_attempts_exam ON app.exam_attempts(exam_id);
    CREATE INDEX IF NOT EXISTS idx_exam_attempts_status ON app.exam_attempts(status);
    CREATE INDEX IF NOT EXISTS idx_activity_log_user ON analytics.activity_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_activity_log_created ON analytics.activity_log(created_at);

    -- Updated_at trigger function
    CREATE OR REPLACE FUNCTION app.update_updated_at_column()
    RETURNS TRIGGER AS \$\$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    \$\$ LANGUAGE plpgsql;

    -- Apply updated_at triggers
    DROP TRIGGER IF EXISTS trg_users_updated_at ON app.users;
    CREATE TRIGGER trg_users_updated_at
        BEFORE UPDATE ON app.users
        FOR EACH ROW EXECUTE FUNCTION app.update_updated_at_column();

    DROP TRIGGER IF EXISTS trg_exams_updated_at ON app.exams;
    CREATE TRIGGER trg_exams_updated_at
        BEFORE UPDATE ON app.exams
        FOR EACH ROW EXECUTE FUNCTION app.update_updated_at_column();

EOSQL

echo "==> PostgreSQL initialization complete."
