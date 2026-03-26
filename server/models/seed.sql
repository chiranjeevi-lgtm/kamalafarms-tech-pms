-- =====================================================
-- Kamalafarms Tech Performance Management System - Seed Data
-- =====================================================

BEGIN;

-- =====================================================
-- USERS
-- bcrypt hash of 'password123': $2a$10$K7pmGtDGZwBcrfKR7NotFOhuyNJ4EH1g2CxZ7m/6iD6WkHc2uf87C
-- =====================================================
INSERT INTO users (id, email, password_hash, role, name, created_at) VALUES
(1, 'admin@kamalafarms.com',  '$2a$10$K7pmGtDGZwBcrfKR7NotFOhuyNJ4EH1g2CxZ7m/6iD6WkHc2uf87C', 'admin',    'System Admin',  '2025-01-01 00:00:00'),
(2, 'ceo@kamalafarms.com',    '$2a$10$K7pmGtDGZwBcrfKR7NotFOhuyNJ4EH1g2CxZ7m/6iD6WkHc2uf87C', 'manager',  'Rajesh Kumar',  '2025-01-01 00:00:00'),
(3, 'cso@kamalafarms.com',    '$2a$10$K7pmGtDGZwBcrfKR7NotFOhuyNJ4EH1g2CxZ7m/6iD6WkHc2uf87C', 'manager',  'Priya Sharma',  '2025-01-01 00:00:00'),
(4, 'cto@kamalafarms.com',    '$2a$10$K7pmGtDGZwBcrfKR7NotFOhuyNJ4EH1g2CxZ7m/6iD6WkHc2uf87C', 'manager',  'Vikram Singh',  '2025-01-01 00:00:00'),
(5, 'amit@kamalafarms.com',   '$2a$10$K7pmGtDGZwBcrfKR7NotFOhuyNJ4EH1g2CxZ7m/6iD6WkHc2uf87C', 'employee', 'Amit Patel',    '2025-02-01 00:00:00'),
(6, 'sneha@kamalafarms.com',  '$2a$10$K7pmGtDGZwBcrfKR7NotFOhuyNJ4EH1g2CxZ7m/6iD6WkHc2uf87C', 'employee', 'Sneha Reddy',   '2025-02-01 00:00:00'),
(7, 'ravi@kamalafarms.com',   '$2a$10$K7pmGtDGZwBcrfKR7NotFOhuyNJ4EH1g2CxZ7m/6iD6WkHc2uf87C', 'employee', 'Ravi Krishnan', '2025-03-01 00:00:00'),
(8, 'lakshmi@kamalafarms.com','$2a$10$K7pmGtDGZwBcrfKR7NotFOhuyNJ4EH1g2CxZ7m/6iD6WkHc2uf87C', 'employee', 'Lakshmi Devi',  '2025-03-01 00:00:00'),
(9, 'suresh@kamalafarms.com', '$2a$10$K7pmGtDGZwBcrfKR7NotFOhuyNJ4EH1g2CxZ7m/6iD6WkHc2uf87C', 'employee', 'Suresh Babu',   '2025-03-01 00:00:00'),
(10,'ankit@kamalafarms.com',  '$2a$10$K7pmGtDGZwBcrfKR7NotFOhuyNJ4EH1g2CxZ7m/6iD6WkHc2uf87C', 'employee', 'Ankit Mehta',   '2025-04-01 00:00:00'),
(11,'pooja@kamalafarms.com',  '$2a$10$K7pmGtDGZwBcrfKR7NotFOhuyNJ4EH1g2CxZ7m/6iD6WkHc2uf87C', 'employee', 'Pooja Nair',    '2025-04-01 00:00:00'),
(12,'karthik@kamalafarms.com','$2a$10$K7pmGtDGZwBcrfKR7NotFOhuyNJ4EH1g2CxZ7m/6iD6WkHc2uf87C', 'employee', 'Karthik Iyer',  '2025-05-01 00:00:00'),
(13,'divya@kamalafarms.com',  '$2a$10$K7pmGtDGZwBcrfKR7NotFOhuyNJ4EH1g2CxZ7m/6iD6WkHc2uf87C', 'employee', 'Divya Joshi',   '2025-05-01 00:00:00');

SELECT setval('users_id_seq', 13);

-- =====================================================
-- EMPLOYEES
-- Managers first (no reporting_manager_id), then staff
-- =====================================================

-- CEO (emp 1), CSO (emp 2), CTO (emp 3) - no reporting manager
INSERT INTO employees (id, user_id, name, role_title, department, employee_category, email, phone, joining_date, reporting_manager_id, salary_fixed, salary_variable, salary_incentive, is_active, created_at) VALUES
(1,  2,  'Rajesh Kumar',   'CEO',                  NULL,              'permanent', 'ceo@kamalafarms.com',     '+91-9876543210', '2024-01-01', NULL, 150000.00, 50000.00, 0.00, true, '2025-01-01 00:00:00'),
(2,  3,  'Priya Sharma',   'Chief Sales Officer',  NULL,              'permanent', 'cso@kamalafarms.com',     '+91-9876543211', '2024-01-15', 1,    120000.00, 40000.00, 0.00, true, '2025-01-01 00:00:00'),
(3,  4,  'Vikram Singh',   'CTO',                  NULL,              'permanent', 'cto@kamalafarms.com',     '+91-9876543212', '2024-02-01', 1,    130000.00, 45000.00, 0.00, true, '2025-01-01 00:00:00'),
-- Field Sales (reporting to CSO = emp 2)
(4,  5,  'Amit Patel',     'Senior Sales Executive','field_sales',    'permanent', 'amit@kamalafarms.com',    '+91-9012345671', '2025-02-01', 2,    55000.00,  12000.00, 0.00, true, '2025-02-01 00:00:00'),
(5,  6,  'Sneha Reddy',    'Sales Executive',       'inhouse_sales',  'permanent', 'sneha@kamalafarms.com',   '+91-9012345672', '2025-02-15', 2,    45000.00,  10000.00, 0.00, true, '2025-02-01 00:00:00'),
-- Farm Execution (reporting to CEO = emp 1)
(6,  7,  'Ravi Krishnan',  'Farm Operations Lead',  'farm_execution', 'permanent', 'ravi@kamalafarms.com',    '+91-9012345673', '2025-03-01', 1,    50000.00,  10000.00, 0.00, true, '2025-03-01 00:00:00'),
(7,  8,  'Lakshmi Devi',   'Farm Agronomist',       'farm_agronomy',  'permanent', 'lakshmi@kamalafarms.com', '+91-9012345674', '2025-03-15', 1,    38000.00,   8000.00, 0.00, true, '2025-03-01 00:00:00'),
(8,  9,  'Suresh Babu',    'Farm Intern',           'farm_execution', 'intern',    'suresh@kamalafarms.com',  '+91-9012345675', '2025-03-20', 1,    32000.00,   6000.00, 0.00, true, '2025-03-01 00:00:00'),
-- Computer Engineering (reporting to CTO = emp 3)
(9,  10, 'Ankit Mehta',    'Technical Lead',        'computer_engineering', 'permanent', 'ankit@kamalafarms.com',   '+91-9012345676', '2025-04-01', 3,    58000.00,  13000.00, 0.00, true, '2025-04-01 00:00:00'),
(10, 11, 'Pooja Nair',     'Support Engineer',      'computer_engineering', 'intern', 'pooja@kamalafarms.com',   '+91-9012345677', '2025-04-15', 3,    42000.00,   9000.00, 0.00, true, '2025-04-01 00:00:00'),
-- Marketing (reporting to CSO = emp 2)
(11, 12, 'Karthik Iyer',   'Marketing Executive',   'marketing',      'permanent', 'karthik@kamalafarms.com', '+91-9012345678', '2025-05-01', 2,    40000.00,   8000.00, 0.00, true, '2025-05-01 00:00:00'),
(12, 13, 'Divya Joshi',    'R&D Scientist',         'research_development', 'permanent', 'divya@kamalafarms.com',   '+91-9012345679', '2025-05-15', 2,    43000.00,   9000.00, 0.00, true, '2025-05-01 00:00:00');

SELECT setval('employees_id_seq', 12);

-- =====================================================
-- TARGETS (Jan-Mar 2026, all approved, set by respective managers)
-- =====================================================

-- Sales targets - Amit Patel (emp 4)
INSERT INTO targets (employee_id, month, year, target_type, target_value, status, set_by, notes, created_at) VALUES
(4, 1, 2026, 'revenue_target', 700000.00, 'approved', 3, 'Q1 revenue target', '2025-12-28 00:00:00'),
(4, 1, 2026, 'leads_target',   80.00,     'approved', 3, 'Monthly lead target', '2025-12-28 00:00:00'),
(4, 2, 2026, 'revenue_target', 700000.00, 'approved', 3, NULL, '2026-01-28 00:00:00'),
(4, 2, 2026, 'leads_target',   80.00,     'approved', 3, NULL, '2026-01-28 00:00:00'),
(4, 3, 2026, 'revenue_target', 750000.00, 'approved', 3, 'Slightly raised target', '2026-02-28 00:00:00'),
(4, 3, 2026, 'leads_target',   85.00,     'approved', 3, NULL, '2026-02-28 00:00:00'),
-- Sales targets - Sneha Reddy (emp 5)
(5, 1, 2026, 'revenue_target', 550000.00, 'approved', 3, NULL, '2025-12-28 00:00:00'),
(5, 1, 2026, 'leads_target',   60.00,     'approved', 3, NULL, '2025-12-28 00:00:00'),
(5, 2, 2026, 'revenue_target', 550000.00, 'approved', 3, NULL, '2026-01-28 00:00:00'),
(5, 2, 2026, 'leads_target',   60.00,     'approved', 3, NULL, '2026-01-28 00:00:00'),
(5, 3, 2026, 'revenue_target', 600000.00, 'approved', 3, NULL, '2026-02-28 00:00:00'),
(5, 3, 2026, 'leads_target',   65.00,     'approved', 3, NULL, '2026-02-28 00:00:00'),
-- Farm Ops targets - Ravi Krishnan (emp 6)
(6, 1, 2026, 'yield_target',  800.00,     'approved', 2, NULL, '2025-12-28 00:00:00'),
(6, 1, 2026, 'budget_cost',   150000.00,  'approved', 2, NULL, '2025-12-28 00:00:00'),
(6, 2, 2026, 'yield_target',  800.00,     'approved', 2, NULL, '2026-01-28 00:00:00'),
(6, 2, 2026, 'budget_cost',   150000.00,  'approved', 2, NULL, '2026-01-28 00:00:00'),
(6, 3, 2026, 'yield_target',  850.00,     'approved', 2, NULL, '2026-02-28 00:00:00'),
(6, 3, 2026, 'budget_cost',   155000.00,  'approved', 2, NULL, '2026-02-28 00:00:00'),
-- Farm Ops targets - Lakshmi Devi (emp 7)
(7, 1, 2026, 'yield_target',  600.00,     'approved', 2, NULL, '2025-12-28 00:00:00'),
(7, 1, 2026, 'budget_cost',   120000.00,  'approved', 2, NULL, '2025-12-28 00:00:00'),
(7, 2, 2026, 'yield_target',  600.00,     'approved', 2, NULL, '2026-01-28 00:00:00'),
(7, 2, 2026, 'budget_cost',   120000.00,  'approved', 2, NULL, '2026-01-28 00:00:00'),
(7, 3, 2026, 'yield_target',  650.00,     'approved', 2, NULL, '2026-02-28 00:00:00'),
(7, 3, 2026, 'budget_cost',   125000.00,  'approved', 2, NULL, '2026-02-28 00:00:00'),
-- Farm Ops targets - Suresh Babu (emp 8)
(8, 1, 2026, 'yield_target',  500.00,     'approved', 2, NULL, '2025-12-28 00:00:00'),
(8, 1, 2026, 'budget_cost',   100000.00,  'approved', 2, NULL, '2025-12-28 00:00:00'),
(8, 2, 2026, 'yield_target',  500.00,     'approved', 2, NULL, '2026-01-28 00:00:00'),
(8, 2, 2026, 'budget_cost',   100000.00,  'approved', 2, NULL, '2026-01-28 00:00:00'),
(8, 3, 2026, 'yield_target',  500.00,     'approved', 2, NULL, '2026-02-28 00:00:00'),
(8, 3, 2026, 'budget_cost',   100000.00,  'approved', 2, NULL, '2026-02-28 00:00:00'),
-- Technical targets - Ankit Mehta (emp 9)
(9, 1, 2026, 'installation_target', 8.00,  'approved', 4, NULL, '2025-12-28 00:00:00'),
(9, 1, 2026, 'ticket_target',       30.00, 'approved', 4, NULL, '2025-12-28 00:00:00'),
(9, 2, 2026, 'installation_target', 8.00,  'approved', 4, NULL, '2026-01-28 00:00:00'),
(9, 2, 2026, 'ticket_target',       30.00, 'approved', 4, NULL, '2026-01-28 00:00:00'),
(9, 3, 2026, 'installation_target', 9.00,  'approved', 4, NULL, '2026-02-28 00:00:00'),
(9, 3, 2026, 'ticket_target',       32.00, 'approved', 4, NULL, '2026-02-28 00:00:00'),
-- Technical targets - Pooja Nair (emp 10)
(10, 1, 2026, 'installation_target', 6.00,  'approved', 4, NULL, '2025-12-28 00:00:00'),
(10, 1, 2026, 'ticket_target',       25.00, 'approved', 4, NULL, '2025-12-28 00:00:00'),
(10, 2, 2026, 'installation_target', 6.00,  'approved', 4, NULL, '2026-01-28 00:00:00'),
(10, 2, 2026, 'ticket_target',       25.00, 'approved', 4, NULL, '2026-01-28 00:00:00'),
(10, 3, 2026, 'installation_target', 7.00,  'approved', 4, NULL, '2026-02-28 00:00:00'),
(10, 3, 2026, 'ticket_target',       28.00, 'approved', 4, NULL, '2026-02-28 00:00:00'),
-- Marketing targets - Karthik Iyer (emp 11)
(11, 1, 2026, 'leads_target', 300.00,  'approved', 3, NULL, '2025-12-28 00:00:00'),
(11, 1, 2026, 'target_cpl',   150.00,  'approved', 3, NULL, '2025-12-28 00:00:00'),
(11, 2, 2026, 'leads_target', 300.00,  'approved', 3, NULL, '2026-01-28 00:00:00'),
(11, 2, 2026, 'target_cpl',   150.00,  'approved', 3, NULL, '2026-01-28 00:00:00'),
(11, 3, 2026, 'leads_target', 350.00,  'approved', 3, NULL, '2026-02-28 00:00:00'),
(11, 3, 2026, 'target_cpl',   140.00,  'approved', 3, NULL, '2026-02-28 00:00:00'),
-- Marketing targets - Divya Joshi (emp 12)
(12, 1, 2026, 'leads_target', 250.00,  'approved', 3, NULL, '2025-12-28 00:00:00'),
(12, 1, 2026, 'target_cpl',   160.00,  'approved', 3, NULL, '2025-12-28 00:00:00'),
(12, 2, 2026, 'leads_target', 250.00,  'approved', 3, NULL, '2026-01-28 00:00:00'),
(12, 2, 2026, 'target_cpl',   160.00,  'approved', 3, NULL, '2026-01-28 00:00:00'),
(12, 3, 2026, 'leads_target', 280.00,  'approved', 3, NULL, '2026-02-28 00:00:00'),
(12, 3, 2026, 'target_cpl',   150.00,  'approved', 3, NULL, '2026-02-28 00:00:00');


-- =====================================================
-- KPI ENTRIES
-- =====================================================

-- ----- SALES: Amit Patel (emp 4) - HIGH PERFORMER (green) -----
-- Jan 2026
INSERT INTO kpi_entries (employee_id, month, year, department, metric_name, metric_value, created_at) VALUES
(4, 1, 2026, 'field_sales', 'leads_assigned',        80.00,     '2026-02-01 00:00:00'),
(4, 1, 2026, 'field_sales', 'leads_contacted',        76.00,     '2026-02-01 00:00:00'),
(4, 1, 2026, 'field_sales', 'site_visits',            30.00,     '2026-02-01 00:00:00'),
(4, 1, 2026, 'field_sales', 'deals_closed',           12.00,     '2026-02-01 00:00:00'),
(4, 1, 2026, 'field_sales', 'revenue_generated',  750000.00,     '2026-02-01 00:00:00'),
(4, 1, 2026, 'field_sales', 'revenue_target',     700000.00,     '2026-02-01 00:00:00'),
(4, 1, 2026, 'field_sales', 'collection_efficiency',  95.00,     '2026-02-01 00:00:00'),
(4, 1, 2026, 'field_sales', 'crm_updates',            98.00,     '2026-02-01 00:00:00'),
-- Feb 2026
(4, 2, 2026, 'field_sales', 'leads_assigned',        80.00,     '2026-03-01 00:00:00'),
(4, 2, 2026, 'field_sales', 'leads_contacted',        78.00,     '2026-03-01 00:00:00'),
(4, 2, 2026, 'field_sales', 'site_visits',            32.00,     '2026-03-01 00:00:00'),
(4, 2, 2026, 'field_sales', 'deals_closed',           14.00,     '2026-03-01 00:00:00'),
(4, 2, 2026, 'field_sales', 'revenue_generated',  780000.00,     '2026-03-01 00:00:00'),
(4, 2, 2026, 'field_sales', 'revenue_target',     700000.00,     '2026-03-01 00:00:00'),
(4, 2, 2026, 'field_sales', 'collection_efficiency',  96.00,     '2026-03-01 00:00:00'),
(4, 2, 2026, 'field_sales', 'crm_updates',            99.00,     '2026-03-01 00:00:00'),
-- Mar 2026
(4, 3, 2026, 'field_sales', 'leads_assigned',        85.00,     '2026-03-31 00:00:00'),
(4, 3, 2026, 'field_sales', 'leads_contacted',        82.00,     '2026-03-31 00:00:00'),
(4, 3, 2026, 'field_sales', 'site_visits',            35.00,     '2026-03-31 00:00:00'),
(4, 3, 2026, 'field_sales', 'deals_closed',           15.00,     '2026-03-31 00:00:00'),
(4, 3, 2026, 'field_sales', 'revenue_generated',  820000.00,     '2026-03-31 00:00:00'),
(4, 3, 2026, 'field_sales', 'revenue_target',     750000.00,     '2026-03-31 00:00:00'),
(4, 3, 2026, 'field_sales', 'collection_efficiency',  97.00,     '2026-03-31 00:00:00'),
(4, 3, 2026, 'field_sales', 'crm_updates',           100.00,     '2026-03-31 00:00:00');

-- ----- SALES: Sneha Reddy (emp 5) - MIXED yellow/green -----
INSERT INTO kpi_entries (employee_id, month, year, department, metric_name, metric_value, created_at) VALUES
-- Jan 2026 (yellow)
(5, 1, 2026, 'field_sales', 'leads_assigned',        60.00,     '2026-02-01 00:00:00'),
(5, 1, 2026, 'field_sales', 'leads_contacted',        48.00,     '2026-02-01 00:00:00'),
(5, 1, 2026, 'field_sales', 'site_visits',            18.00,     '2026-02-01 00:00:00'),
(5, 1, 2026, 'field_sales', 'deals_closed',            6.00,     '2026-02-01 00:00:00'),
(5, 1, 2026, 'field_sales', 'revenue_generated',  420000.00,     '2026-02-01 00:00:00'),
(5, 1, 2026, 'field_sales', 'revenue_target',     550000.00,     '2026-02-01 00:00:00'),
(5, 1, 2026, 'field_sales', 'collection_efficiency',  82.00,     '2026-02-01 00:00:00'),
(5, 1, 2026, 'field_sales', 'crm_updates',            85.00,     '2026-02-01 00:00:00'),
-- Feb 2026 (green)
(5, 2, 2026, 'field_sales', 'leads_assigned',        60.00,     '2026-03-01 00:00:00'),
(5, 2, 2026, 'field_sales', 'leads_contacted',        55.00,     '2026-03-01 00:00:00'),
(5, 2, 2026, 'field_sales', 'site_visits',            24.00,     '2026-03-01 00:00:00'),
(5, 2, 2026, 'field_sales', 'deals_closed',            9.00,     '2026-03-01 00:00:00'),
(5, 2, 2026, 'field_sales', 'revenue_generated',  570000.00,     '2026-03-01 00:00:00'),
(5, 2, 2026, 'field_sales', 'revenue_target',     550000.00,     '2026-03-01 00:00:00'),
(5, 2, 2026, 'field_sales', 'collection_efficiency',  90.00,     '2026-03-01 00:00:00'),
(5, 2, 2026, 'field_sales', 'crm_updates',            92.00,     '2026-03-01 00:00:00'),
-- Mar 2026 (yellow)
(5, 3, 2026, 'field_sales', 'leads_assigned',        65.00,     '2026-03-31 00:00:00'),
(5, 3, 2026, 'field_sales', 'leads_contacted',        52.00,     '2026-03-31 00:00:00'),
(5, 3, 2026, 'field_sales', 'site_visits',            20.00,     '2026-03-31 00:00:00'),
(5, 3, 2026, 'field_sales', 'deals_closed',            7.00,     '2026-03-31 00:00:00'),
(5, 3, 2026, 'field_sales', 'revenue_generated',  480000.00,     '2026-03-31 00:00:00'),
(5, 3, 2026, 'field_sales', 'revenue_target',     600000.00,     '2026-03-31 00:00:00'),
(5, 3, 2026, 'field_sales', 'collection_efficiency',  85.00,     '2026-03-31 00:00:00'),
(5, 3, 2026, 'field_sales', 'crm_updates',            88.00,     '2026-03-31 00:00:00');

-- ----- FARM OPS: Ravi Krishnan (emp 6) - green/yellow mix -----
INSERT INTO kpi_entries (employee_id, month, year, department, metric_name, metric_value, created_at) VALUES
-- Jan 2026 (green)
(6, 1, 2026, 'farm_execution', 'yield_achieved',        780.00,    '2026-02-01 00:00:00'),
(6, 1, 2026, 'farm_execution', 'target_yield',           800.00,    '2026-02-01 00:00:00'),
(6, 1, 2026, 'farm_execution', 'input_cost',          140000.00,    '2026-02-01 00:00:00'),
(6, 1, 2026, 'farm_execution', 'budget_cost',         150000.00,    '2026-02-01 00:00:00'),
(6, 1, 2026, 'farm_execution', 'contamination_incidents',  1.00,    '2026-02-01 00:00:00'),
(6, 1, 2026, 'farm_execution', 'max_contamination',        3.00,    '2026-02-01 00:00:00'),
(6, 1, 2026, 'farm_execution', 'harvest_efficiency',      92.00,    '2026-02-01 00:00:00'),
(6, 1, 2026, 'farm_execution', 'downtime_hours',          10.00,    '2026-02-01 00:00:00'),
(6, 1, 2026, 'farm_execution', 'max_downtime',            20.00,    '2026-02-01 00:00:00'),
-- Feb 2026 (yellow)
(6, 2, 2026, 'farm_execution', 'yield_achieved',        680.00,    '2026-03-01 00:00:00'),
(6, 2, 2026, 'farm_execution', 'target_yield',           800.00,    '2026-03-01 00:00:00'),
(6, 2, 2026, 'farm_execution', 'input_cost',          155000.00,    '2026-03-01 00:00:00'),
(6, 2, 2026, 'farm_execution', 'budget_cost',         150000.00,    '2026-03-01 00:00:00'),
(6, 2, 2026, 'farm_execution', 'contamination_incidents',  2.00,    '2026-03-01 00:00:00'),
(6, 2, 2026, 'farm_execution', 'max_contamination',        3.00,    '2026-03-01 00:00:00'),
(6, 2, 2026, 'farm_execution', 'harvest_efficiency',      85.00,    '2026-03-01 00:00:00'),
(6, 2, 2026, 'farm_execution', 'downtime_hours',          16.00,    '2026-03-01 00:00:00'),
(6, 2, 2026, 'farm_execution', 'max_downtime',            20.00,    '2026-03-01 00:00:00'),
-- Mar 2026 (green)
(6, 3, 2026, 'farm_execution', 'yield_achieved',        830.00,    '2026-03-31 00:00:00'),
(6, 3, 2026, 'farm_execution', 'target_yield',           850.00,    '2026-03-31 00:00:00'),
(6, 3, 2026, 'farm_execution', 'input_cost',          148000.00,    '2026-03-31 00:00:00'),
(6, 3, 2026, 'farm_execution', 'budget_cost',         155000.00,    '2026-03-31 00:00:00'),
(6, 3, 2026, 'farm_execution', 'contamination_incidents',  0.00,    '2026-03-31 00:00:00'),
(6, 3, 2026, 'farm_execution', 'max_contamination',        3.00,    '2026-03-31 00:00:00'),
(6, 3, 2026, 'farm_execution', 'harvest_efficiency',      94.00,    '2026-03-31 00:00:00'),
(6, 3, 2026, 'farm_execution', 'downtime_hours',           8.00,    '2026-03-31 00:00:00'),
(6, 3, 2026, 'farm_execution', 'max_downtime',            20.00,    '2026-03-31 00:00:00');

-- ----- FARM OPS: Lakshmi Devi (emp 7) - green/yellow mix -----
INSERT INTO kpi_entries (employee_id, month, year, department, metric_name, metric_value, created_at) VALUES
-- Jan 2026 (yellow)
(7, 1, 2026, 'farm_execution', 'yield_achieved',        510.00,    '2026-02-01 00:00:00'),
(7, 1, 2026, 'farm_execution', 'target_yield',           600.00,    '2026-02-01 00:00:00'),
(7, 1, 2026, 'farm_execution', 'input_cost',          118000.00,    '2026-02-01 00:00:00'),
(7, 1, 2026, 'farm_execution', 'budget_cost',         120000.00,    '2026-02-01 00:00:00'),
(7, 1, 2026, 'farm_execution', 'contamination_incidents',  2.00,    '2026-02-01 00:00:00'),
(7, 1, 2026, 'farm_execution', 'max_contamination',        3.00,    '2026-02-01 00:00:00'),
(7, 1, 2026, 'farm_execution', 'harvest_efficiency',      80.00,    '2026-02-01 00:00:00'),
(7, 1, 2026, 'farm_execution', 'downtime_hours',          15.00,    '2026-02-01 00:00:00'),
(7, 1, 2026, 'farm_execution', 'max_downtime',            20.00,    '2026-02-01 00:00:00'),
-- Feb 2026 (green)
(7, 2, 2026, 'farm_execution', 'yield_achieved',        580.00,    '2026-03-01 00:00:00'),
(7, 2, 2026, 'farm_execution', 'target_yield',           600.00,    '2026-03-01 00:00:00'),
(7, 2, 2026, 'farm_execution', 'input_cost',          112000.00,    '2026-03-01 00:00:00'),
(7, 2, 2026, 'farm_execution', 'budget_cost',         120000.00,    '2026-03-01 00:00:00'),
(7, 2, 2026, 'farm_execution', 'contamination_incidents',  1.00,    '2026-03-01 00:00:00'),
(7, 2, 2026, 'farm_execution', 'max_contamination',        3.00,    '2026-03-01 00:00:00'),
(7, 2, 2026, 'farm_execution', 'harvest_efficiency',      90.00,    '2026-03-01 00:00:00'),
(7, 2, 2026, 'farm_execution', 'downtime_hours',          12.00,    '2026-03-01 00:00:00'),
(7, 2, 2026, 'farm_execution', 'max_downtime',            20.00,    '2026-03-01 00:00:00'),
-- Mar 2026 (green)
(7, 3, 2026, 'farm_execution', 'yield_achieved',        620.00,    '2026-03-31 00:00:00'),
(7, 3, 2026, 'farm_execution', 'target_yield',           650.00,    '2026-03-31 00:00:00'),
(7, 3, 2026, 'farm_execution', 'input_cost',          115000.00,    '2026-03-31 00:00:00'),
(7, 3, 2026, 'farm_execution', 'budget_cost',         125000.00,    '2026-03-31 00:00:00'),
(7, 3, 2026, 'farm_execution', 'contamination_incidents',  1.00,    '2026-03-31 00:00:00'),
(7, 3, 2026, 'farm_execution', 'max_contamination',        3.00,    '2026-03-31 00:00:00'),
(7, 3, 2026, 'farm_execution', 'harvest_efficiency',      91.00,    '2026-03-31 00:00:00'),
(7, 3, 2026, 'farm_execution', 'downtime_hours',          10.00,    '2026-03-31 00:00:00'),
(7, 3, 2026, 'farm_execution', 'max_downtime',            20.00,    '2026-03-31 00:00:00');

-- ----- FARM OPS: Suresh Babu (emp 8) - CONSISTENTLY RED (layoff candidate) -----
INSERT INTO kpi_entries (employee_id, month, year, department, metric_name, metric_value, created_at) VALUES
-- Jan 2026 (red)
(8, 1, 2026, 'farm_execution', 'yield_achieved',        250.00,    '2026-02-01 00:00:00'),
(8, 1, 2026, 'farm_execution', 'target_yield',           500.00,    '2026-02-01 00:00:00'),
(8, 1, 2026, 'farm_execution', 'input_cost',          130000.00,    '2026-02-01 00:00:00'),
(8, 1, 2026, 'farm_execution', 'budget_cost',         100000.00,    '2026-02-01 00:00:00'),
(8, 1, 2026, 'farm_execution', 'contamination_incidents',  3.00,    '2026-02-01 00:00:00'),
(8, 1, 2026, 'farm_execution', 'max_contamination',        3.00,    '2026-02-01 00:00:00'),
(8, 1, 2026, 'farm_execution', 'harvest_efficiency',      55.00,    '2026-02-01 00:00:00'),
(8, 1, 2026, 'farm_execution', 'downtime_hours',          20.00,    '2026-02-01 00:00:00'),
(8, 1, 2026, 'farm_execution', 'max_downtime',            20.00,    '2026-02-01 00:00:00'),
-- Feb 2026 (red)
(8, 2, 2026, 'farm_execution', 'yield_achieved',        270.00,    '2026-03-01 00:00:00'),
(8, 2, 2026, 'farm_execution', 'target_yield',           500.00,    '2026-03-01 00:00:00'),
(8, 2, 2026, 'farm_execution', 'input_cost',          125000.00,    '2026-03-01 00:00:00'),
(8, 2, 2026, 'farm_execution', 'budget_cost',         100000.00,    '2026-03-01 00:00:00'),
(8, 2, 2026, 'farm_execution', 'contamination_incidents',  3.00,    '2026-03-01 00:00:00'),
(8, 2, 2026, 'farm_execution', 'max_contamination',        3.00,    '2026-03-01 00:00:00'),
(8, 2, 2026, 'farm_execution', 'harvest_efficiency',      58.00,    '2026-03-01 00:00:00'),
(8, 2, 2026, 'farm_execution', 'downtime_hours',          19.00,    '2026-03-01 00:00:00'),
(8, 2, 2026, 'farm_execution', 'max_downtime',            20.00,    '2026-03-01 00:00:00'),
-- Mar 2026 (red)
(8, 3, 2026, 'farm_execution', 'yield_achieved',        260.00,    '2026-03-31 00:00:00'),
(8, 3, 2026, 'farm_execution', 'target_yield',           500.00,    '2026-03-31 00:00:00'),
(8, 3, 2026, 'farm_execution', 'input_cost',          128000.00,    '2026-03-31 00:00:00'),
(8, 3, 2026, 'farm_execution', 'budget_cost',         100000.00,    '2026-03-31 00:00:00'),
(8, 3, 2026, 'farm_execution', 'contamination_incidents',  3.00,    '2026-03-31 00:00:00'),
(8, 3, 2026, 'farm_execution', 'max_contamination',        3.00,    '2026-03-31 00:00:00'),
(8, 3, 2026, 'farm_execution', 'harvest_efficiency',      52.00,    '2026-03-31 00:00:00'),
(8, 3, 2026, 'farm_execution', 'downtime_hours',          20.00,    '2026-03-31 00:00:00'),
(8, 3, 2026, 'farm_execution', 'max_downtime',            20.00,    '2026-03-31 00:00:00');

-- ----- TECHNICAL: Ankit Mehta (emp 9) - green/yellow mix -----
INSERT INTO kpi_entries (employee_id, month, year, department, metric_name, metric_value, created_at) VALUES
-- Jan 2026 (green)
(9, 1, 2026, 'computer_engineering', 'installations_completed',   8.00,   '2026-02-01 00:00:00'),
(9, 1, 2026, 'computer_engineering', 'target_installations',      8.00,   '2026-02-01 00:00:00'),
(9, 1, 2026, 'computer_engineering', 'tickets_resolved',         28.00,   '2026-02-01 00:00:00'),
(9, 1, 2026, 'computer_engineering', 'total_tickets',            30.00,   '2026-02-01 00:00:00'),
(9, 1, 2026, 'computer_engineering', 'avg_resolution_time',      18.00,   '2026-02-01 00:00:00'),
(9, 1, 2026, 'computer_engineering', 'target_resolution_time',   24.00,   '2026-02-01 00:00:00'),
(9, 1, 2026, 'computer_engineering', 'csat_score',               92.00,   '2026-02-01 00:00:00'),
(9, 1, 2026, 'computer_engineering', 'system_uptime',            99.50,   '2026-02-01 00:00:00'),
-- Feb 2026 (green)
(9, 2, 2026, 'computer_engineering', 'installations_completed',   7.00,   '2026-03-01 00:00:00'),
(9, 2, 2026, 'computer_engineering', 'target_installations',      8.00,   '2026-03-01 00:00:00'),
(9, 2, 2026, 'computer_engineering', 'tickets_resolved',         27.00,   '2026-03-01 00:00:00'),
(9, 2, 2026, 'computer_engineering', 'total_tickets',            30.00,   '2026-03-01 00:00:00'),
(9, 2, 2026, 'computer_engineering', 'avg_resolution_time',      20.00,   '2026-03-01 00:00:00'),
(9, 2, 2026, 'computer_engineering', 'target_resolution_time',   24.00,   '2026-03-01 00:00:00'),
(9, 2, 2026, 'computer_engineering', 'csat_score',               90.00,   '2026-03-01 00:00:00'),
(9, 2, 2026, 'computer_engineering', 'system_uptime',            99.20,   '2026-03-01 00:00:00'),
-- Mar 2026 (yellow)
(9, 3, 2026, 'computer_engineering', 'installations_completed',   7.00,   '2026-03-31 00:00:00'),
(9, 3, 2026, 'computer_engineering', 'target_installations',      9.00,   '2026-03-31 00:00:00'),
(9, 3, 2026, 'computer_engineering', 'tickets_resolved',         26.00,   '2026-03-31 00:00:00'),
(9, 3, 2026, 'computer_engineering', 'total_tickets',            32.00,   '2026-03-31 00:00:00'),
(9, 3, 2026, 'computer_engineering', 'avg_resolution_time',      22.00,   '2026-03-31 00:00:00'),
(9, 3, 2026, 'computer_engineering', 'target_resolution_time',   24.00,   '2026-03-31 00:00:00'),
(9, 3, 2026, 'computer_engineering', 'csat_score',               85.00,   '2026-03-31 00:00:00'),
(9, 3, 2026, 'computer_engineering', 'system_uptime',            98.50,   '2026-03-31 00:00:00');

-- ----- TECHNICAL: Pooja Nair (emp 10) - yellow/green mix -----
INSERT INTO kpi_entries (employee_id, month, year, department, metric_name, metric_value, created_at) VALUES
-- Jan 2026 (yellow)
(10, 1, 2026, 'computer_engineering', 'installations_completed',   5.00,   '2026-02-01 00:00:00'),
(10, 1, 2026, 'computer_engineering', 'target_installations',      6.00,   '2026-02-01 00:00:00'),
(10, 1, 2026, 'computer_engineering', 'tickets_resolved',         20.00,   '2026-02-01 00:00:00'),
(10, 1, 2026, 'computer_engineering', 'total_tickets',            25.00,   '2026-02-01 00:00:00'),
(10, 1, 2026, 'computer_engineering', 'avg_resolution_time',      26.00,   '2026-02-01 00:00:00'),
(10, 1, 2026, 'computer_engineering', 'target_resolution_time',   24.00,   '2026-02-01 00:00:00'),
(10, 1, 2026, 'computer_engineering', 'csat_score',               78.00,   '2026-02-01 00:00:00'),
(10, 1, 2026, 'computer_engineering', 'system_uptime',            97.50,   '2026-02-01 00:00:00'),
-- Feb 2026 (green)
(10, 2, 2026, 'computer_engineering', 'installations_completed',   6.00,   '2026-03-01 00:00:00'),
(10, 2, 2026, 'computer_engineering', 'target_installations',      6.00,   '2026-03-01 00:00:00'),
(10, 2, 2026, 'computer_engineering', 'tickets_resolved',         24.00,   '2026-03-01 00:00:00'),
(10, 2, 2026, 'computer_engineering', 'total_tickets',            25.00,   '2026-03-01 00:00:00'),
(10, 2, 2026, 'computer_engineering', 'avg_resolution_time',      20.00,   '2026-03-01 00:00:00'),
(10, 2, 2026, 'computer_engineering', 'target_resolution_time',   24.00,   '2026-03-01 00:00:00'),
(10, 2, 2026, 'computer_engineering', 'csat_score',               88.00,   '2026-03-01 00:00:00'),
(10, 2, 2026, 'computer_engineering', 'system_uptime',            99.00,   '2026-03-01 00:00:00'),
-- Mar 2026 (yellow)
(10, 3, 2026, 'computer_engineering', 'installations_completed',   5.00,   '2026-03-31 00:00:00'),
(10, 3, 2026, 'computer_engineering', 'target_installations',      7.00,   '2026-03-31 00:00:00'),
(10, 3, 2026, 'computer_engineering', 'tickets_resolved',         22.00,   '2026-03-31 00:00:00'),
(10, 3, 2026, 'computer_engineering', 'total_tickets',            28.00,   '2026-03-31 00:00:00'),
(10, 3, 2026, 'computer_engineering', 'avg_resolution_time',      25.00,   '2026-03-31 00:00:00'),
(10, 3, 2026, 'computer_engineering', 'target_resolution_time',   24.00,   '2026-03-31 00:00:00'),
(10, 3, 2026, 'computer_engineering', 'csat_score',               80.00,   '2026-03-31 00:00:00'),
(10, 3, 2026, 'computer_engineering', 'system_uptime',            98.00,   '2026-03-31 00:00:00');

-- ----- MARKETING: Karthik Iyer (emp 11) - IMPROVING red -> yellow -> green (recovered) -----
INSERT INTO kpi_entries (employee_id, month, year, department, metric_name, metric_value, created_at) VALUES
-- Jan 2026 (red - poor performance)
(11, 1, 2026, 'marketing', 'leads_generated',      120.00,    '2026-02-01 00:00:00'),
(11, 1, 2026, 'marketing', 'target_leads',          300.00,    '2026-02-01 00:00:00'),
(11, 1, 2026, 'marketing', 'cost_per_lead',         280.00,    '2026-02-01 00:00:00'),
(11, 1, 2026, 'marketing', 'target_cpl',            150.00,    '2026-02-01 00:00:00'),
(11, 1, 2026, 'marketing', 'roi',                     1.20,    '2026-02-01 00:00:00'),
(11, 1, 2026, 'marketing', 'content_output',         10.00,    '2026-02-01 00:00:00'),
(11, 1, 2026, 'marketing', 'engagement_rate',         1.80,    '2026-02-01 00:00:00'),
-- Feb 2026 (yellow - improving)
(11, 2, 2026, 'marketing', 'leads_generated',      220.00,    '2026-03-01 00:00:00'),
(11, 2, 2026, 'marketing', 'target_leads',          300.00,    '2026-03-01 00:00:00'),
(11, 2, 2026, 'marketing', 'cost_per_lead',         180.00,    '2026-03-01 00:00:00'),
(11, 2, 2026, 'marketing', 'target_cpl',            150.00,    '2026-03-01 00:00:00'),
(11, 2, 2026, 'marketing', 'roi',                     2.50,    '2026-03-01 00:00:00'),
(11, 2, 2026, 'marketing', 'content_output',         18.00,    '2026-03-01 00:00:00'),
(11, 2, 2026, 'marketing', 'engagement_rate',         3.20,    '2026-03-01 00:00:00'),
-- Mar 2026 (green - recovered)
(11, 3, 2026, 'marketing', 'leads_generated',      360.00,    '2026-03-31 00:00:00'),
(11, 3, 2026, 'marketing', 'target_leads',          350.00,    '2026-03-31 00:00:00'),
(11, 3, 2026, 'marketing', 'cost_per_lead',         130.00,    '2026-03-31 00:00:00'),
(11, 3, 2026, 'marketing', 'target_cpl',            140.00,    '2026-03-31 00:00:00'),
(11, 3, 2026, 'marketing', 'roi',                     4.20,    '2026-03-31 00:00:00'),
(11, 3, 2026, 'marketing', 'content_output',         25.00,    '2026-03-31 00:00:00'),
(11, 3, 2026, 'marketing', 'engagement_rate',         5.00,    '2026-03-31 00:00:00');

-- ----- MARKETING: Divya Joshi (emp 12) - green/yellow mix -----
INSERT INTO kpi_entries (employee_id, month, year, department, metric_name, metric_value, created_at) VALUES
-- Jan 2026 (green)
(12, 1, 2026, 'marketing', 'leads_generated',      270.00,    '2026-02-01 00:00:00'),
(12, 1, 2026, 'marketing', 'target_leads',          250.00,    '2026-02-01 00:00:00'),
(12, 1, 2026, 'marketing', 'cost_per_lead',         140.00,    '2026-02-01 00:00:00'),
(12, 1, 2026, 'marketing', 'target_cpl',            160.00,    '2026-02-01 00:00:00'),
(12, 1, 2026, 'marketing', 'roi',                     3.80,    '2026-02-01 00:00:00'),
(12, 1, 2026, 'marketing', 'content_output',         22.00,    '2026-02-01 00:00:00'),
(12, 1, 2026, 'marketing', 'engagement_rate',         4.50,    '2026-02-01 00:00:00'),
-- Feb 2026 (yellow)
(12, 2, 2026, 'marketing', 'leads_generated',      200.00,    '2026-03-01 00:00:00'),
(12, 2, 2026, 'marketing', 'target_leads',          250.00,    '2026-03-01 00:00:00'),
(12, 2, 2026, 'marketing', 'cost_per_lead',         175.00,    '2026-03-01 00:00:00'),
(12, 2, 2026, 'marketing', 'target_cpl',            160.00,    '2026-03-01 00:00:00'),
(12, 2, 2026, 'marketing', 'roi',                     2.60,    '2026-03-01 00:00:00'),
(12, 2, 2026, 'marketing', 'content_output',         16.00,    '2026-03-01 00:00:00'),
(12, 2, 2026, 'marketing', 'engagement_rate',         3.00,    '2026-03-01 00:00:00'),
-- Mar 2026 (green)
(12, 3, 2026, 'marketing', 'leads_generated',      300.00,    '2026-03-31 00:00:00'),
(12, 3, 2026, 'marketing', 'target_leads',          280.00,    '2026-03-31 00:00:00'),
(12, 3, 2026, 'marketing', 'cost_per_lead',         135.00,    '2026-03-31 00:00:00'),
(12, 3, 2026, 'marketing', 'target_cpl',            150.00,    '2026-03-31 00:00:00'),
(12, 3, 2026, 'marketing', 'roi',                     4.00,    '2026-03-31 00:00:00'),
(12, 3, 2026, 'marketing', 'content_output',         24.00,    '2026-03-31 00:00:00'),
(12, 3, 2026, 'marketing', 'engagement_rate',         4.80,    '2026-03-31 00:00:00');


-- =====================================================
-- KPI SCORES
-- Zone thresholds: green >= 80, yellow >= 60, red < 60
-- =====================================================

INSERT INTO kpi_scores (employee_id, month, year, total_score, zone, breakdown, calculated_at) VALUES
-- Amit Patel (emp 4) - consistently green
(4, 1, 2026, 88.50, 'green',  '{"lead_conversion": 95.0, "revenue_achievement": 107.1, "collection": 95.0, "crm_compliance": 98.0, "site_visit_ratio": 39.5}', '2026-02-01 10:00:00'),
(4, 2, 2026, 91.20, 'green',  '{"lead_conversion": 97.5, "revenue_achievement": 111.4, "collection": 96.0, "crm_compliance": 99.0, "site_visit_ratio": 41.0}', '2026-03-01 10:00:00'),
(4, 3, 2026, 92.80, 'green',  '{"lead_conversion": 96.5, "revenue_achievement": 109.3, "collection": 97.0, "crm_compliance": 100.0, "site_visit_ratio": 42.7}', '2026-03-31 10:00:00'),

-- Sneha Reddy (emp 5) - yellow/green/yellow
(5, 1, 2026, 65.30, 'yellow', '{"lead_conversion": 80.0, "revenue_achievement": 76.4, "collection": 82.0, "crm_compliance": 85.0, "site_visit_ratio": 37.5}', '2026-02-01 10:00:00'),
(5, 2, 2026, 82.10, 'green',  '{"lead_conversion": 91.7, "revenue_achievement": 103.6, "collection": 90.0, "crm_compliance": 92.0, "site_visit_ratio": 43.6}', '2026-03-01 10:00:00'),
(5, 3, 2026, 68.40, 'yellow', '{"lead_conversion": 80.0, "revenue_achievement": 80.0, "collection": 85.0, "crm_compliance": 88.0, "site_visit_ratio": 38.5}', '2026-03-31 10:00:00'),

-- Ravi Krishnan (emp 6) - green/yellow/green
(6, 1, 2026, 85.60, 'green',  '{"yield_pct": 97.5, "cost_efficiency": 93.3, "contamination": 66.7, "harvest_efficiency": 92.0, "uptime": 50.0}', '2026-02-01 10:00:00'),
(6, 2, 2026, 68.20, 'yellow', '{"yield_pct": 85.0, "cost_efficiency": 96.8, "contamination": 33.3, "harvest_efficiency": 85.0, "uptime": 20.0}', '2026-03-01 10:00:00'),
(6, 3, 2026, 90.50, 'green',  '{"yield_pct": 97.6, "cost_efficiency": 95.5, "contamination": 100.0, "harvest_efficiency": 94.0, "uptime": 60.0}', '2026-03-31 10:00:00'),

-- Lakshmi Devi (emp 7) - yellow/green/green
(7, 1, 2026, 67.80, 'yellow', '{"yield_pct": 85.0, "cost_efficiency": 98.3, "contamination": 33.3, "harvest_efficiency": 80.0, "uptime": 25.0}', '2026-02-01 10:00:00'),
(7, 2, 2026, 83.40, 'green',  '{"yield_pct": 96.7, "cost_efficiency": 93.3, "contamination": 66.7, "harvest_efficiency": 90.0, "uptime": 40.0}', '2026-03-01 10:00:00'),
(7, 3, 2026, 85.10, 'green',  '{"yield_pct": 95.4, "cost_efficiency": 92.0, "contamination": 66.7, "harvest_efficiency": 91.0, "uptime": 50.0}', '2026-03-31 10:00:00'),

-- Suresh Babu (emp 8) - consistently red
(8, 1, 2026, 35.20, 'red',    '{"yield_pct": 50.0, "cost_efficiency": 76.9, "contamination": 0.0, "harvest_efficiency": 55.0, "uptime": 0.0}', '2026-02-01 10:00:00'),
(8, 2, 2026, 38.50, 'red',    '{"yield_pct": 54.0, "cost_efficiency": 80.0, "contamination": 0.0, "harvest_efficiency": 58.0, "uptime": 5.0}', '2026-03-01 10:00:00'),
(8, 3, 2026, 33.80, 'red',    '{"yield_pct": 52.0, "cost_efficiency": 78.1, "contamination": 0.0, "harvest_efficiency": 52.0, "uptime": 0.0}', '2026-03-31 10:00:00'),

-- Ankit Mehta (emp 9) - green/green/yellow
(9, 1, 2026, 89.30, 'green',  '{"installation_rate": 100.0, "ticket_resolution": 93.3, "resolution_time": 75.0, "csat": 92.0, "uptime": 99.5}', '2026-02-01 10:00:00'),
(9, 2, 2026, 85.70, 'green',  '{"installation_rate": 87.5, "ticket_resolution": 90.0, "resolution_time": 83.3, "csat": 90.0, "uptime": 99.2}', '2026-03-01 10:00:00'),
(9, 3, 2026, 74.60, 'yellow', '{"installation_rate": 77.8, "ticket_resolution": 81.3, "resolution_time": 91.7, "csat": 85.0, "uptime": 98.5}', '2026-03-31 10:00:00'),

-- Pooja Nair (emp 10) - yellow/green/yellow
(10, 1, 2026, 66.50, 'yellow', '{"installation_rate": 83.3, "ticket_resolution": 80.0, "resolution_time": 92.3, "csat": 78.0, "uptime": 97.5}', '2026-02-01 10:00:00'),
(10, 2, 2026, 86.80, 'green',  '{"installation_rate": 100.0, "ticket_resolution": 96.0, "resolution_time": 83.3, "csat": 88.0, "uptime": 99.0}', '2026-03-01 10:00:00'),
(10, 3, 2026, 68.20, 'yellow', '{"installation_rate": 71.4, "ticket_resolution": 78.6, "resolution_time": 96.0, "csat": 80.0, "uptime": 98.0}', '2026-03-31 10:00:00'),

-- Karthik Iyer (emp 11) - red/yellow/green (improving -> recovered)
(11, 1, 2026, 38.50, 'red',    '{"lead_achievement": 40.0, "cpl_efficiency": 53.6, "roi": 1.2, "content_output": 10.0, "engagement": 1.8}', '2026-02-01 10:00:00'),
(11, 2, 2026, 65.80, 'yellow', '{"lead_achievement": 73.3, "cpl_efficiency": 83.3, "roi": 2.5, "content_output": 18.0, "engagement": 3.2}', '2026-03-01 10:00:00'),
(11, 3, 2026, 88.90, 'green',  '{"lead_achievement": 102.9, "cpl_efficiency": 107.7, "roi": 4.2, "content_output": 25.0, "engagement": 5.0}', '2026-03-31 10:00:00'),

-- Divya Joshi (emp 12) - green/yellow/green
(12, 1, 2026, 84.20, 'green',  '{"lead_achievement": 108.0, "cpl_efficiency": 114.3, "roi": 3.8, "content_output": 22.0, "engagement": 4.5}', '2026-02-01 10:00:00'),
(12, 2, 2026, 64.50, 'yellow', '{"lead_achievement": 80.0, "cpl_efficiency": 91.4, "roi": 2.6, "content_output": 16.0, "engagement": 3.0}', '2026-03-01 10:00:00'),
(12, 3, 2026, 87.30, 'green',  '{"lead_achievement": 107.1, "cpl_efficiency": 111.1, "roi": 4.0, "content_output": 24.0, "engagement": 4.8}', '2026-03-31 10:00:00');


-- =====================================================
-- PERFORMANCE HISTORY
-- =====================================================

INSERT INTO performance_history (employee_id, month, year, score, zone, consecutive_red_count, status, created_at) VALUES
-- Amit Patel (emp 4) - consistently green
(4, 1, 2026, 88.50, 'green', 0, 'active', '2026-02-01 10:00:00'),
(4, 2, 2026, 91.20, 'green', 0, 'active', '2026-03-01 10:00:00'),
(4, 3, 2026, 92.80, 'green', 0, 'active', '2026-03-31 10:00:00'),

-- Sneha Reddy (emp 5)
(5, 1, 2026, 65.30, 'yellow', 0, 'active', '2026-02-01 10:00:00'),
(5, 2, 2026, 82.10, 'green',  0, 'active', '2026-03-01 10:00:00'),
(5, 3, 2026, 68.40, 'yellow', 0, 'active', '2026-03-31 10:00:00'),

-- Ravi Krishnan (emp 6)
(6, 1, 2026, 85.60, 'green',  0, 'active', '2026-02-01 10:00:00'),
(6, 2, 2026, 68.20, 'yellow', 0, 'active', '2026-03-01 10:00:00'),
(6, 3, 2026, 90.50, 'green',  0, 'active', '2026-03-31 10:00:00'),

-- Lakshmi Devi (emp 7)
(7, 1, 2026, 67.80, 'yellow', 0, 'active', '2026-02-01 10:00:00'),
(7, 2, 2026, 83.40, 'green',  0, 'active', '2026-03-01 10:00:00'),
(7, 3, 2026, 85.10, 'green',  0, 'active', '2026-03-31 10:00:00'),

-- Suresh Babu (emp 8) - 3 consecutive reds -> layoff_recommended
(8, 1, 2026, 35.20, 'red', 1, 'active',              '2026-02-01 10:00:00'),
(8, 2, 2026, 38.50, 'red', 2, 'at_risk',             '2026-03-01 10:00:00'),
(8, 3, 2026, 33.80, 'red', 3, 'layoff_recommended',  '2026-03-31 10:00:00'),

-- Ankit Mehta (emp 9)
(9, 1, 2026, 89.30, 'green',  0, 'active', '2026-02-01 10:00:00'),
(9, 2, 2026, 85.70, 'green',  0, 'active', '2026-03-01 10:00:00'),
(9, 3, 2026, 74.60, 'yellow', 0, 'active', '2026-03-31 10:00:00'),

-- Pooja Nair (emp 10)
(10, 1, 2026, 66.50, 'yellow', 0, 'active', '2026-02-01 10:00:00'),
(10, 2, 2026, 86.80, 'green',  0, 'active', '2026-03-01 10:00:00'),
(10, 3, 2026, 68.20, 'yellow', 0, 'active', '2026-03-31 10:00:00'),

-- Karthik Iyer (emp 11) - red -> yellow -> green = recovered
(11, 1, 2026, 38.50, 'red',    1, 'active',    '2026-02-01 10:00:00'),
(11, 2, 2026, 65.80, 'yellow', 0, 'active',    '2026-03-01 10:00:00'),
(11, 3, 2026, 88.90, 'green',  0, 'recovered', '2026-03-31 10:00:00'),

-- Divya Joshi (emp 12)
(12, 1, 2026, 84.20, 'green',  0, 'active', '2026-02-01 10:00:00'),
(12, 2, 2026, 64.50, 'yellow', 0, 'active', '2026-03-01 10:00:00'),
(12, 3, 2026, 87.30, 'green',  0, 'active', '2026-03-31 10:00:00');


-- =====================================================
-- INCENTIVES
-- Green zone: 1.2x multiplier, Yellow: 0.8x, Red: 0x
-- Base = salary_variable
-- =====================================================

INSERT INTO incentives (employee_id, month, year, base_amount, multiplier, final_amount, incentive_type, details, created_at) VALUES
-- Amit Patel (emp 4, variable=12000) - all green
(4, 1, 2026, 12000.00, 1.20, 14400.00, 'performance', '{"zone": "green", "score": 88.50, "department": "sales"}',    '2026-02-01 12:00:00'),
(4, 2, 2026, 12000.00, 1.20, 14400.00, 'performance', '{"zone": "green", "score": 91.20, "department": "sales"}',    '2026-03-01 12:00:00'),
(4, 3, 2026, 12000.00, 1.20, 14400.00, 'performance', '{"zone": "green", "score": 92.80, "department": "sales"}',    '2026-03-31 12:00:00'),

-- Sneha Reddy (emp 5, variable=10000) - yellow/green/yellow
(5, 1, 2026, 10000.00, 0.80,  8000.00, 'performance', '{"zone": "yellow", "score": 65.30, "department": "sales"}',   '2026-02-01 12:00:00'),
(5, 2, 2026, 10000.00, 1.20, 12000.00, 'performance', '{"zone": "green", "score": 82.10, "department": "sales"}',    '2026-03-01 12:00:00'),
(5, 3, 2026, 10000.00, 0.80,  8000.00, 'performance', '{"zone": "yellow", "score": 68.40, "department": "sales"}',   '2026-03-31 12:00:00'),

-- Ravi Krishnan (emp 6, variable=10000) - green/yellow/green
(6, 1, 2026, 10000.00, 1.20, 12000.00, 'performance', '{"zone": "green", "score": 85.60, "department": "farm_execution"}',  '2026-02-01 12:00:00'),
(6, 2, 2026, 10000.00, 0.80,  8000.00, 'performance', '{"zone": "yellow", "score": 68.20, "department": "farm_execution"}', '2026-03-01 12:00:00'),
(6, 3, 2026, 10000.00, 1.20, 12000.00, 'performance', '{"zone": "green", "score": 90.50, "department": "farm_execution"}',  '2026-03-31 12:00:00'),

-- Lakshmi Devi (emp 7, variable=8000) - yellow/green/green
(7, 1, 2026,  8000.00, 0.80,  6400.00, 'performance', '{"zone": "yellow", "score": 67.80, "department": "farm_execution"}', '2026-02-01 12:00:00'),
(7, 2, 2026,  8000.00, 1.20,  9600.00, 'performance', '{"zone": "green", "score": 83.40, "department": "farm_execution"}',  '2026-03-01 12:00:00'),
(7, 3, 2026,  8000.00, 1.20,  9600.00, 'performance', '{"zone": "green", "score": 85.10, "department": "farm_execution"}',  '2026-03-31 12:00:00'),

-- Suresh Babu (emp 8, variable=6000) - all red = 0 incentive
(8, 1, 2026,  6000.00, 0.00,     0.00, 'performance', '{"zone": "red", "score": 35.20, "department": "farm_execution"}',    '2026-02-01 12:00:00'),
(8, 2, 2026,  6000.00, 0.00,     0.00, 'performance', '{"zone": "red", "score": 38.50, "department": "farm_execution"}',    '2026-03-01 12:00:00'),
(8, 3, 2026,  6000.00, 0.00,     0.00, 'performance', '{"zone": "red", "score": 33.80, "department": "farm_execution"}',    '2026-03-31 12:00:00'),

-- Ankit Mehta (emp 9, variable=13000) - green/green/yellow
(9, 1, 2026, 13000.00, 1.20, 15600.00, 'performance', '{"zone": "green", "score": 89.30, "department": "computer_engineering"}',  '2026-02-01 12:00:00'),
(9, 2, 2026, 13000.00, 1.20, 15600.00, 'performance', '{"zone": "green", "score": 85.70, "department": "computer_engineering"}',  '2026-03-01 12:00:00'),
(9, 3, 2026, 13000.00, 0.80, 10400.00, 'performance', '{"zone": "yellow", "score": 74.60, "department": "computer_engineering"}', '2026-03-31 12:00:00'),

-- Pooja Nair (emp 10, variable=9000) - yellow/green/yellow
(10, 1, 2026,  9000.00, 0.80,  7200.00, 'performance', '{"zone": "yellow", "score": 66.50, "department": "computer_engineering"}', '2026-02-01 12:00:00'),
(10, 2, 2026,  9000.00, 1.20, 10800.00, 'performance', '{"zone": "green", "score": 86.80, "department": "computer_engineering"}',  '2026-03-01 12:00:00'),
(10, 3, 2026,  9000.00, 0.80,  7200.00, 'performance', '{"zone": "yellow", "score": 68.20, "department": "computer_engineering"}', '2026-03-31 12:00:00'),

-- Karthik Iyer (emp 11, variable=8000) - red/yellow/green
(11, 1, 2026,  8000.00, 0.00,     0.00, 'performance', '{"zone": "red", "score": 38.50, "department": "marketing"}',    '2026-02-01 12:00:00'),
(11, 2, 2026,  8000.00, 0.80,  6400.00, 'performance', '{"zone": "yellow", "score": 65.80, "department": "marketing"}', '2026-03-01 12:00:00'),
(11, 3, 2026,  8000.00, 1.20,  9600.00, 'performance', '{"zone": "green", "score": 88.90, "department": "marketing"}',  '2026-03-31 12:00:00'),

-- Divya Joshi (emp 12, variable=9000) - green/yellow/green
(12, 1, 2026,  9000.00, 1.20, 10800.00, 'performance', '{"zone": "green", "score": 84.20, "department": "marketing"}',  '2026-02-01 12:00:00'),
(12, 2, 2026,  9000.00, 0.80,  7200.00, 'performance', '{"zone": "yellow", "score": 64.50, "department": "marketing"}', '2026-03-01 12:00:00'),
(12, 3, 2026,  9000.00, 1.20, 10800.00, 'performance', '{"zone": "green", "score": 87.30, "department": "marketing"}',  '2026-03-31 12:00:00');


-- =====================================================
-- REVIEWS
-- =====================================================

INSERT INTO reviews (employee_id, month, year, kpi_score, zone, incentive_earned, manager_comments, ai_feedback, email_sent, sent_at, created_at) VALUES
-- Amit Patel (emp 4)
(4, 1, 2026, 88.50, 'green', 14400.00,
 'Excellent performance. Amit continues to exceed revenue targets consistently.',
 'Strong performance in lead conversion and revenue generation. Lead contact rate at 95% demonstrates excellent follow-through. Continue focusing on maintaining high collection efficiency and CRM compliance. Consider mentoring junior team members.',
 true, '2026-02-02 09:00:00', '2026-02-01 12:00:00'),
(4, 2, 2026, 91.20, 'green', 14400.00,
 'Outstanding month. Revenue 11% above target.',
 'Exceptional month with revenue at 111% of target. All core metrics are above benchmarks. The combination of high lead conversion (97.5%) and strong deal closing continues to drive results. Recommend for leadership development program.',
 true, '2026-03-02 09:00:00', '2026-03-01 12:00:00'),
(4, 3, 2026, 92.80, 'green', 14400.00,
 'Top performer for Q1. Recommend for quarterly bonus.',
 'Consistently the top performer in the sales department for Q1 2026. Revenue achievement of 109% with perfect CRM compliance. Strong candidate for salary increment consideration. Recommend expanding territory or key account responsibility.',
 true, '2026-03-31 12:00:00', '2026-03-31 12:00:00'),

-- Sneha Reddy (emp 5)
(5, 1, 2026, 65.30, 'yellow', 8000.00,
 'Below expectations this month. Need improvement in lead conversion.',
 'Lead conversion and revenue achievement are below target. Only 76.4% of revenue target met. Focus on improving site visit conversion rates and following up on more leads. Collection efficiency of 82% needs attention.',
 true, '2026-02-02 09:00:00', '2026-02-01 12:00:00'),
(5, 2, 2026, 82.10, 'green', 12000.00,
 'Great improvement from last month. Keep it up.',
 'Significant improvement over January. Revenue exceeded target at 103.6%. Lead contact rate improved to 91.7%. Maintaining this trajectory will ensure sustained green zone performance. Continue building on current momentum.',
 true, '2026-03-02 09:00:00', '2026-03-01 12:00:00'),
(5, 3, 2026, 68.40, 'yellow', 8000.00,
 'Dipped back to yellow. Inconsistency is a concern.',
 'Performance has fluctuated over the quarter. Revenue achievement dropped to 80% of target. The pattern of inconsistency between months needs to be addressed. Recommend establishing a more structured daily activity plan to maintain consistent output.',
 true, '2026-03-31 12:00:00', '2026-03-31 12:00:00'),

-- Ravi Krishnan (emp 6)
(6, 1, 2026, 85.60, 'green', 12000.00,
 'Solid performance across all farm operations metrics.',
 'Strong yield achievement at 97.5% of target with good cost management. Contamination kept to minimum levels. Harvest efficiency of 92% is commendable. Continue optimizing operational processes for even better results.',
 true, '2026-02-02 09:00:00', '2026-02-01 12:00:00'),
(6, 2, 2026, 68.20, 'yellow', 8000.00,
 'Yield dropped this month. Weather impact noted but need contingency plans.',
 'Yield achievement dropped to 85% while costs slightly exceeded budget. Contamination incidents doubled from previous month. Recommend implementing better preventive measures and developing weather contingency protocols.',
 true, '2026-03-02 09:00:00', '2026-03-01 12:00:00'),
(6, 3, 2026, 90.50, 'green', 12000.00,
 'Strong bounce back. Zero contamination is impressive.',
 'Excellent recovery from February dip. Yield at 97.6% of target with zero contamination incidents. Cost management improved with input costs well below budget. Demonstrates ability to learn from setbacks and implement corrective actions.',
 true, '2026-03-31 12:00:00', '2026-03-31 12:00:00'),

-- Lakshmi Devi (emp 7)
(7, 1, 2026, 67.80, 'yellow', 6400.00,
 'New to the role. Expected improvement in coming months.',
 'Yield at 85% of target with room for improvement. Cost management is good at 98.3% efficiency. Contamination incidents need attention. As a newer team member, focus on learning best practices from senior staff. Downtime management needs work.',
 true, '2026-02-02 09:00:00', '2026-02-01 12:00:00'),
(7, 2, 2026, 83.40, 'green', 9600.00,
 'Nice improvement. Growing into the role well.',
 'Good improvement across all metrics. Yield achievement up to 96.7% and harvest efficiency at 90%. Contamination reduced by half. Continuing this growth trajectory will establish consistent green zone performance.',
 true, '2026-03-02 09:00:00', '2026-03-01 12:00:00'),
(7, 3, 2026, 85.10, 'green', 9600.00,
 'Consistent green performer now. Well done.',
 'Sustained improvement with yield at 95.4% and harvest efficiency at 91%. Demonstrating reliability and growth. Recommend additional training in advanced techniques to push performance even higher in Q2.',
 true, '2026-03-31 12:00:00', '2026-03-31 12:00:00'),

-- Suresh Babu (emp 8) - consistently red, layoff candidate
(8, 1, 2026, 35.20, 'red', 0.00,
 'Serious underperformance. PIP discussion needed.',
 'Critical performance gap with yield at only 50% of target. Input costs 30% over budget. Maximum contamination incidents recorded. Harvest efficiency well below acceptable levels. Immediate intervention required with structured Performance Improvement Plan.',
 true, '2026-02-02 09:00:00', '2026-02-01 12:00:00'),
(8, 2, 2026, 38.50, 'red', 0.00,
 'Second consecutive red. PIP in progress, minimal improvement.',
 'Marginal improvement insufficient to move out of red zone. Yield still at 54% of target. Cost overruns continue at 25% above budget. Contamination remains at maximum threshold. PIP milestones not being met. Escalating to HR for review.',
 true, '2026-03-02 09:00:00', '2026-03-01 12:00:00'),
(8, 3, 2026, 33.80, 'red', 0.00,
 'Third consecutive red month. Recommending separation process.',
 'Three consecutive months in red zone with no meaningful improvement trajectory. Yield at 52%, costs 28% over budget, maximum contamination incidents. Despite PIP support and additional training, performance has not improved. Layoff recommendation submitted per company policy.',
 true, '2026-03-31 12:00:00', '2026-03-31 12:00:00'),

-- Ankit Mehta (emp 9)
(9, 1, 2026, 89.30, 'green', 15600.00,
 'Excellent technical output. Installations on target.',
 'All installations completed on target with 93.3% ticket resolution rate. Average resolution time 25% faster than target. CSAT score of 92% reflects strong customer relationships. System uptime near perfect at 99.5%.',
 true, '2026-02-02 09:00:00', '2026-02-01 12:00:00'),
(9, 2, 2026, 85.70, 'green', 15600.00,
 'Slight dip but still performing well.',
 'Installation rate at 87.5% with strong ticket resolution at 90%. Resolution time remains efficient at 20 hours vs 24 target. CSAT maintained at 90%. Minor dip from January but well within green zone. Monitor workload balance.',
 true, '2026-03-02 09:00:00', '2026-03-01 12:00:00'),
(9, 3, 2026, 74.60, 'yellow', 10400.00,
 'Dropped to yellow. Higher targets but team capacity may be an issue.',
 'Installation rate dropped to 77.8% against raised targets. Ticket resolution down to 81.3%. CSAT declined to 85%. The increased targets may need workload redistribution. Recommend reviewing resource allocation and providing additional support.',
 true, '2026-03-31 12:00:00', '2026-03-31 12:00:00'),

-- Pooja Nair (emp 10)
(10, 1, 2026, 66.50, 'yellow', 7200.00,
 'Settling in. Support resolution times need work.',
 'Installation completion at 83.3% of target. Ticket resolution at 80% needs improvement. Average resolution time slightly above target at 26 hours. CSAT at 78% is below department average. Focus on faster ticket turnaround.',
 true, '2026-02-02 09:00:00', '2026-02-01 12:00:00'),
(10, 2, 2026, 86.80, 'green', 10800.00,
 'Excellent improvement. All targets met this month.',
 'Remarkable improvement with 100% installation completion and 96% ticket resolution. Resolution time improved to well within target. CSAT jumped to 88% showing strong customer focus. System uptime at 99%. Excellent progress.',
 true, '2026-03-02 09:00:00', '2026-03-01 12:00:00'),
(10, 3, 2026, 68.20, 'yellow', 7200.00,
 'Back to yellow. Consistency needs improvement.',
 'Performance dropped with raised targets. Installation rate at 71.4% and ticket resolution at 78.6%. Pattern of inconsistency similar to Q1 fluctuations. Need to develop sustainable work practices that maintain performance even as targets increase.',
 true, '2026-03-31 12:00:00', '2026-03-31 12:00:00'),

-- Karthik Iyer (emp 11) - red -> yellow -> green (recovered)
(11, 1, 2026, 38.50, 'red', 0.00,
 'Very poor first month. Needs immediate mentoring.',
 'Lead generation at only 40% of target with very high cost per lead of Rs 280 vs Rs 150 target. ROI of 1.2x is unsustainable. Content output is minimal. Requires immediate guidance on campaign optimization and budget management.',
 true, '2026-02-02 09:00:00', '2026-02-01 12:00:00'),
(11, 2, 2026, 65.80, 'yellow', 6400.00,
 'Good improvement trajectory. Mentoring is showing results.',
 'Significant improvement with lead generation up to 73.3% of target. CPL reduced from Rs 280 to Rs 180. ROI improved to 2.5x. Content output nearly doubled. The mentoring program is clearly having impact. Continue current improvement trajectory.',
 true, '2026-03-02 09:00:00', '2026-03-01 12:00:00'),
(11, 3, 2026, 88.90, 'green', 9600.00,
 'Outstanding turnaround. From red to green in 3 months. Recovered status.',
 'Remarkable recovery achieving 102.9% of lead target and CPL below target at Rs 130. ROI of 4.2x is among team best. Content output at 25 pieces with 5% engagement rate. This turnaround demonstrates resilience and coachability. Recovered status confirmed.',
 true, '2026-03-31 12:00:00', '2026-03-31 12:00:00'),

-- Divya Joshi (emp 12)
(12, 1, 2026, 84.20, 'green', 10800.00,
 'Strong start to the year. Content strategy is effective.',
 'Exceeding lead targets at 108% with cost per lead well below target. ROI of 3.8x shows efficient spend. Content output of 22 pieces with 4.5% engagement rate demonstrates strong content-audience fit. Maintain this strategic approach.',
 true, '2026-02-02 09:00:00', '2026-02-01 12:00:00'),
(12, 2, 2026, 64.50, 'yellow', 7200.00,
 'Dip in February. Campaign performance inconsistent.',
 'Lead generation dropped to 80% of target with CPL rising above target. ROI declined to 2.6x. Content output decreased by 27%. Possible seasonal factors but need to diversify campaign channels to maintain consistency through fluctuations.',
 true, '2026-03-02 09:00:00', '2026-03-01 12:00:00'),
(12, 3, 2026, 87.30, 'green', 10800.00,
 'Good recovery. Q1 overall performance is satisfactory.',
 'Strong recovery with leads at 107.1% of target and CPL below target. ROI back to 4.0x with excellent content output of 24 pieces. Engagement rate of 4.8% is near team best. Q1 demonstrates ability to recover from dips. Focus on consistency in Q2.',
 true, '2026-03-31 12:00:00', '2026-03-31 12:00:00');


-- =====================================================
-- SALARY INCREMENTS (Q1 2026 based on 3-month avg scores)
-- Green avg (>=80): 5% increment
-- Yellow avg (60-79): 2% increment
-- Red avg (<60): 0% increment
-- =====================================================

INSERT INTO salary_increments (employee_id, quarter, year, avg_score, increment_pct, amount, applied, created_at) VALUES
-- Amit: avg 90.83 -> 5% of 55000 = 2750
(4,  1, 2026, 90.83, 5.00, 2750.00, false, '2026-03-31 15:00:00'),
-- Sneha: avg 71.93 -> 2% of 45000 = 900
(5,  1, 2026, 71.93, 2.00,  900.00, false, '2026-03-31 15:00:00'),
-- Ravi: avg 81.43 -> 5% of 50000 = 2500
(6,  1, 2026, 81.43, 5.00, 2500.00, false, '2026-03-31 15:00:00'),
-- Lakshmi: avg 78.77 -> 2% of 38000 = 760
(7,  1, 2026, 78.77, 2.00,  760.00, false, '2026-03-31 15:00:00'),
-- Suresh: avg 35.83 -> 0%
(8,  1, 2026, 35.83, 0.00,    0.00, false, '2026-03-31 15:00:00'),
-- Ankit: avg 83.20 -> 5% of 58000 = 2900
(9,  1, 2026, 83.20, 5.00, 2900.00, false, '2026-03-31 15:00:00'),
-- Pooja: avg 73.83 -> 2% of 42000 = 840
(10, 1, 2026, 73.83, 2.00,  840.00, false, '2026-03-31 15:00:00'),
-- Karthik: avg 64.40 -> 2% of 40000 = 800
(11, 1, 2026, 64.40, 2.00,  800.00, false, '2026-03-31 15:00:00'),
-- Divya: avg 78.67 -> 2% of 43000 = 860
(12, 1, 2026, 78.67, 2.00,  860.00, false, '2026-03-31 15:00:00');

COMMIT;
