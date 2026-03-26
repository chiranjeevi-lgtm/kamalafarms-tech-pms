-- =====================================================
-- Agritech Performance Management System - Database Schema
-- PostgreSQL 14+
-- =====================================================

BEGIN;

-- =====================================================
-- 1. USERS
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role        VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'employee')),
    name        VARCHAR(255),
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role ON users (role);

-- =====================================================
-- 2. EMPLOYEES
-- =====================================================
CREATE TABLE IF NOT EXISTS employees (
    id                  SERIAL PRIMARY KEY,
    user_id             INT REFERENCES users(id) ON DELETE SET NULL,
    name                VARCHAR(255) NOT NULL,
    role_title          VARCHAR(100),
    department          VARCHAR(50) CHECK (department IN ('operations', 'farm_execution', 'farm_agronomy', 'hr_admin', 'field_sales', 'inhouse_sales', 'marketing', 'computer_engineering', 'research_development')),
    employee_category   VARCHAR(20) DEFAULT 'permanent' CHECK (employee_category IN ('permanent', 'intern')),
    email               VARCHAR(255),
    phone               VARCHAR(20),
    joining_date        DATE,
    reporting_manager_id INT REFERENCES employees(id) ON DELETE SET NULL,
    salary_fixed        NUMERIC(12,2),
    salary_variable     NUMERIC(12,2),
    salary_incentive    NUMERIC(12,2),
    is_active           BOOLEAN DEFAULT true,
    created_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_employees_user_id ON employees (user_id);
CREATE INDEX idx_employees_department ON employees (department);
CREATE INDEX idx_employees_reporting_manager ON employees (reporting_manager_id);
CREATE INDEX idx_employees_is_active ON employees (is_active);

-- =====================================================
-- 3. TARGETS
-- =====================================================
CREATE TABLE IF NOT EXISTS targets (
    id              SERIAL PRIMARY KEY,
    employee_id     INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    month           INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year            INT NOT NULL,
    target_type     VARCHAR(100) NOT NULL,
    target_value    NUMERIC(12,2),
    status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    set_by          INT REFERENCES users(id) ON DELETE SET NULL,
    notes           TEXT,
    created_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE(employee_id, month, year, target_type)
);

CREATE INDEX idx_targets_employee_id ON targets (employee_id);
CREATE INDEX idx_targets_month_year ON targets (month, year);
CREATE INDEX idx_targets_employee_month_year ON targets (employee_id, month, year);

-- =====================================================
-- 4. KPI ENTRIES
-- =====================================================
CREATE TABLE IF NOT EXISTS kpi_entries (
    id              SERIAL PRIMARY KEY,
    employee_id     INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    month           INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year            INT NOT NULL,
    department      VARCHAR(50),
    metric_name     VARCHAR(100) NOT NULL,
    metric_value    NUMERIC(12,2),
    created_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE(employee_id, month, year, metric_name)
);

CREATE INDEX idx_kpi_entries_employee_id ON kpi_entries (employee_id);
CREATE INDEX idx_kpi_entries_month_year ON kpi_entries (month, year);
CREATE INDEX idx_kpi_entries_employee_month_year ON kpi_entries (employee_id, month, year);
CREATE INDEX idx_kpi_entries_department ON kpi_entries (department);

-- =====================================================
-- 5. KPI SCORES
-- =====================================================
CREATE TABLE IF NOT EXISTS kpi_scores (
    id              SERIAL PRIMARY KEY,
    employee_id     INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    month           INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year            INT NOT NULL,
    total_score     NUMERIC(5,2),
    zone            VARCHAR(10) CHECK (zone IN ('green', 'yellow', 'red')),
    breakdown       JSONB,
    calculated_at   TIMESTAMP DEFAULT NOW(),
    UNIQUE(employee_id, month, year)
);

CREATE INDEX idx_kpi_scores_employee_id ON kpi_scores (employee_id);
CREATE INDEX idx_kpi_scores_month_year ON kpi_scores (month, year);
CREATE INDEX idx_kpi_scores_employee_month_year ON kpi_scores (employee_id, month, year);
CREATE INDEX idx_kpi_scores_zone ON kpi_scores (zone);

-- =====================================================
-- 6. PERFORMANCE HISTORY
-- =====================================================
CREATE TABLE IF NOT EXISTS performance_history (
    id                      SERIAL PRIMARY KEY,
    employee_id             INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    month                   INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year                    INT NOT NULL,
    score                   NUMERIC(5,2),
    zone                    VARCHAR(10),
    consecutive_red_count   INT DEFAULT 0,
    status                  VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'at_risk', 'layoff_recommended', 'recovered')),
    created_at              TIMESTAMP DEFAULT NOW(),
    UNIQUE(employee_id, month, year)
);

CREATE INDEX idx_perf_history_employee_id ON performance_history (employee_id);
CREATE INDEX idx_perf_history_month_year ON performance_history (month, year);
CREATE INDEX idx_perf_history_employee_month_year ON performance_history (employee_id, month, year);
CREATE INDEX idx_perf_history_status ON performance_history (status);

-- =====================================================
-- 7. INCENTIVES
-- =====================================================
CREATE TABLE IF NOT EXISTS incentives (
    id              SERIAL PRIMARY KEY,
    employee_id     INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    month           INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year            INT NOT NULL,
    base_amount     NUMERIC(12,2),
    multiplier      NUMERIC(4,2),
    final_amount    NUMERIC(12,2),
    incentive_type  VARCHAR(50),
    details         JSONB,
    created_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE(employee_id, month, year)
);

CREATE INDEX idx_incentives_employee_id ON incentives (employee_id);
CREATE INDEX idx_incentives_month_year ON incentives (month, year);
CREATE INDEX idx_incentives_employee_month_year ON incentives (employee_id, month, year);

-- =====================================================
-- 8. REVIEWS
-- =====================================================
CREATE TABLE IF NOT EXISTS reviews (
    id              SERIAL PRIMARY KEY,
    employee_id     INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    month           INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year            INT NOT NULL,
    kpi_score       NUMERIC(5,2),
    zone            VARCHAR(10),
    incentive_earned NUMERIC(12,2),
    manager_comments TEXT,
    ai_feedback     TEXT,
    email_sent      BOOLEAN DEFAULT false,
    sent_at         TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE(employee_id, month, year)
);

CREATE INDEX idx_reviews_employee_id ON reviews (employee_id);
CREATE INDEX idx_reviews_month_year ON reviews (month, year);
CREATE INDEX idx_reviews_employee_month_year ON reviews (employee_id, month, year);

-- =====================================================
-- 9. SALARY INCREMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS salary_increments (
    id              SERIAL PRIMARY KEY,
    employee_id     INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    quarter         INT NOT NULL CHECK (quarter BETWEEN 1 AND 4),
    year            INT NOT NULL,
    avg_score       NUMERIC(5,2),
    increment_pct   NUMERIC(5,2),
    amount          NUMERIC(12,2),
    applied         BOOLEAN DEFAULT false,
    created_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE(employee_id, quarter, year)
);

CREATE INDEX idx_salary_inc_employee_id ON salary_increments (employee_id);
CREATE INDEX idx_salary_inc_quarter_year ON salary_increments (quarter, year);
CREATE INDEX idx_salary_inc_employee_quarter_year ON salary_increments (employee_id, quarter, year);

COMMIT;
