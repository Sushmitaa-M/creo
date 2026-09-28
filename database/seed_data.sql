-- =============================================================================
-- CREO PLATFORM — POSTGRESQL PRODUCTION SEED DATA
-- =============================================================================
-- Database: PostgreSQL 15+ / 16+ / 17+ (Supabase compatible)
-- Description: Idempotent core baseline seed data for subscription plans
--              and primary agency staff accounts (Fresh start: 0 clients, 0 income).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. DEFAULT AGENCY & TEAMS
-- -----------------------------------------------------------------------------
INSERT INTO agencies (
    id, name, slug, status, plan_tier, max_clients, max_staff, branding, timezone
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Creo Digital',
    'creo',
    'active',
    'enterprise',
    100,
    100,
    '{}'::jsonb,
    'Asia/Kolkata'
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    status = EXCLUDED.status,
    plan_tier = EXCLUDED.plan_tier;

-- -----------------------------------------------------------------------------
-- 1. SUBSCRIPTION PLANS
-- -----------------------------------------------------------------------------
INSERT INTO plans (
    id, agency_id, name, display_name, price_minor, currency, monthly_price,
    poster_quota, reel_quota, story_quota, revision_rounds,
    has_dedicated_manager, scarcity_slots, highlights, is_recommended, is_active
) VALUES
(
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000001',
    'starter',
    'Starter Growth',
    2500000,
    'INR',
    25000.00,
    8,
    4,
    10,
    1,
    false,
    5,
    '[
        "8 Static brand posters (1:1 & 4:5)",
        "4 High-impact 9:16 mobile reels",
        "10 Story creatives with engagement stickers",
        "1 Round of creative revisions",
        "Instagram auto-scheduling & dispatch",
        "Live analytics dashboard access"
    ]'::jsonb,
    false,
    true
),
(
    '00000000-0000-0000-0000-000000000020',
    '00000000-0000-0000-0000-000000000001',
    'growth',
    'Brand Accelerator',
    5000000,
    'INR',
    50000.00,
    15,
    8,
    20,
    2,
    true,
    3,
    '[
        "15 Static brand posters (multi-format)",
        "8 Cinematic 9:16 reels with audio sync",
        "20 Interactive story creatives",
        "2 Rounds of creative revisions",
        "Dedicated creative director & copywriter",
        "Instagram & Facebook cross-publishing",
        "Weekly performance reviews & hashtag matrix"
    ]'::jsonb,
    true,
    true
),
(
    '00000000-0000-0000-0000-000000000030',
    '00000000-0000-0000-0000-000000000001',
    'pro',
    'Enterprise Domination',
    9500000,
    'INR',
    95000.00,
    30,
    16,
    40,
    3,
    true,
    2,
    '[
        "30 Static brand posters & custom carousel decks",
        "16 High-production 4K reels & UGC composites",
        "40 Story creatives & interactive poll sets",
        "3 Rounds of creative revisions",
        "Dedicated Senior Account Director & VFX lead",
        "Multichannel distribution & ad asset prep",
        "On-demand custom revisions & priority 24h turnaround"
    ]'::jsonb,
    false,
    true
)
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    price_minor = EXCLUDED.price_minor,
    monthly_price = EXCLUDED.monthly_price,
    poster_quota = EXCLUDED.poster_quota,
    reel_quota = EXCLUDED.reel_quota,
    story_quota = EXCLUDED.story_quota,
    highlights = EXCLUDED.highlights,
    is_recommended = EXCLUDED.is_recommended;

-- -----------------------------------------------------------------------------
-- 2. CORE USERS & LOGINS (Password for all: Admin123!)
-- Hash: $2b$12$4lmZSL2E1NcdI71mrdQtoutEfXPilLObmHfj7oE7X2SIhwqk7UFSm
-- -----------------------------------------------------------------------------
INSERT INTO users (
    id, agency_id, auth_id, email, full_name, hashed_password, role, account_status, email_verified_at, must_reset_password
) VALUES
-- Super Admin
(
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'auth-super-admin-001',
    'admin@creo.agency',
    'Ashok Kumar (Executive Super Admin)',
    '$2b$12$4lmZSL2E1NcdI71mrdQtoutEfXPilLObmHfj7oE7X2SIhwqk7UFSm',
    'super_admin',
    'active',
    NOW(),
    FALSE
),
-- Agency Operations & Creative Admins
(
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'auth-ops-admin-002',
    'ops.admin@creo.agency',
    'Aarav Sharma (Operations Admin)',
    '$2b$12$4lmZSL2E1NcdI71mrdQtoutEfXPilLObmHfj7oE7X2SIhwqk7UFSm',
    'admin',
    'active',
    NOW(),
    FALSE
),
(
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'auth-creative-admin-003',
    'creative.admin@creo.agency',
    'Pooja Nambiar (Creative Admin)',
    '$2b$12$4lmZSL2E1NcdI71mrdQtoutEfXPilLObmHfj7oE7X2SIhwqk7UFSm',
    'admin',
    'active',
    NOW(),
    FALSE
),

-- Pod A (Pod Alpha)
(
    '00000000-0000-0000-0000-0000000000a1',
    '00000000-0000-0000-0000-000000000001',
    'auth-lead-alpha-001',
    'lead.alpha@creo.agency',
    'Vikram Malhotra (Lead - Pod Alpha)',
    '$2b$12$4lmZSL2E1NcdI71mrdQtoutEfXPilLObmHfj7oE7X2SIhwqk7UFSm',
    'team_lead',
    'active',
    NOW(),
    FALSE
),
(
    '00000000-0000-0000-0000-0000000000a2',
    '00000000-0000-0000-0000-000000000001',
    'auth-editor-alpha-002',
    'editor.alpha@creo.agency',
    'Karthik Raja (Editor - Pod Alpha)',
    '$2b$12$4lmZSL2E1NcdI71mrdQtoutEfXPilLObmHfj7oE7X2SIhwqk7UFSm',
    'editor',
    'active',
    NOW(),
    FALSE
),
(
    '00000000-0000-0000-0000-0000000000a3',
    '00000000-0000-0000-0000-000000000001',
    'auth-designer-alpha-003',
    'designer.alpha@creo.agency',
    'Ananya Deshmukh (Designer - Pod Alpha)',
    '$2b$12$4lmZSL2E1NcdI71mrdQtoutEfXPilLObmHfj7oE7X2SIhwqk7UFSm',
    'designer',
    'active',
    NOW(),
    FALSE
),

-- Pod B (Pod Beta)
(
    '00000000-0000-0000-0000-0000000000b1',
    '00000000-0000-0000-0000-000000000001',
    'auth-lead-beta-001',
    'lead.beta@creo.agency',
    'Sarah Connor (Lead - Pod B)',
    '$2b$12$4lmZSL2E1NcdI71mrdQtoutEfXPilLObmHfj7oE7X2SIhwqk7UFSm',
    'team_lead',
    'active',
    NOW(),
    FALSE
),
(
    '00000000-0000-0000-0000-0000000000b4',
    '00000000-0000-0000-0000-000000000001',
    'auth-lead-alias-004',
    'lead@creo.agency',
    'Sarah Connor (Lead - Pod B)',
    '$2b$12$4lmZSL2E1NcdI71mrdQtoutEfXPilLObmHfj7oE7X2SIhwqk7UFSm',
    'team_lead',
    'active',
    NOW(),
    FALSE
),
(
    '00000000-0000-0000-0000-0000000000b2',
    '00000000-0000-0000-0000-000000000001',
    'auth-editor-beta-002',
    'editor.beta@creo.agency',
    'David Kim (Editor - Pod B)',
    '$2b$12$4lmZSL2E1NcdI71mrdQtoutEfXPilLObmHfj7oE7X2SIhwqk7UFSm',
    'editor',
    'active',
    NOW(),
    FALSE
),
(
    '00000000-0000-0000-0000-0000000000b5',
    '00000000-0000-0000-0000-000000000001',
    'auth-member-alias-005',
    'member@creo.agency',
    'David Kim (Editor - Pod B)',
    '$2b$12$4lmZSL2E1NcdI71mrdQtoutEfXPilLObmHfj7oE7X2SIhwqk7UFSm',
    'editor',
    'active',
    NOW(),
    FALSE
),
(
    '00000000-0000-0000-0000-0000000000b3',
    '00000000-0000-0000-0000-000000000001',
    'auth-designer-beta-003',
    'designer.beta@creo.agency',
    'Elena Rostova (Designer - Pod B)',
    '$2b$12$4lmZSL2E1NcdI71mrdQtoutEfXPilLObmHfj7oE7X2SIhwqk7UFSm',
    'designer',
    'active',
    NOW(),
    FALSE
),

-- Pod C (Pod Gamma)
(
    '00000000-0000-0000-0000-0000000000c1',
    '00000000-0000-0000-0000-000000000001',
    'auth-lead-gamma-001',
    'lead.gamma@creo.agency',
    'Rohan Mehta (Lead - Pod C)',
    '$2b$12$4lmZSL2E1NcdI71mrdQtoutEfXPilLObmHfj7oE7X2SIhwqk7UFSm',
    'team_lead',
    'active',
    NOW(),
    FALSE
),
(
    '00000000-0000-0000-0000-0000000000c2',
    '00000000-0000-0000-0000-000000000001',
    'auth-editor-gamma-002',
    'editor.gamma@creo.agency',
    'Tanvi Sen (Editor - Pod C)',
    '$2b$12$4lmZSL2E1NcdI71mrdQtoutEfXPilLObmHfj7oE7X2SIhwqk7UFSm',
    'editor',
    'active',
    NOW(),
    FALSE
),
(
    '00000000-0000-0000-0000-0000000000c3',
    '00000000-0000-0000-0000-000000000001',
    'auth-designer-gamma-003',
    'designer.gamma@creo.agency',
    'Arjun Nair (Designer - Pod C)',
    '$2b$12$4lmZSL2E1NcdI71mrdQtoutEfXPilLObmHfj7oE7X2SIhwqk7UFSm',
    'designer',
    'active',
    NOW(),
    FALSE
),

-- Standard Client (Ryze Mushroom Coffee)
(
    '00000000-0000-0000-0000-0000000000d1',
    '00000000-0000-0000-0000-000000000001',
    'auth-client-ryze-001',
    'client@creo.agency',
    'Sushmitaa (Ryze Mushroom Coffee)',
    '$2b$12$4lmZSL2E1NcdI71mrdQtoutEfXPilLObmHfj7oE7X2SIhwqk7UFSm',
    'client',
    'active',
    NOW(),
    FALSE
)
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    hashed_password = EXCLUDED.hashed_password,
    role = EXCLUDED.role,
    account_status = EXCLUDED.account_status,
    must_reset_password = EXCLUDED.must_reset_password;

-- -----------------------------------------------------------------------------
-- 3. TEAMS (Strictly 3 Pods: Pod Alpha, Pod Beta, Pod Gamma)
-- -----------------------------------------------------------------------------
INSERT INTO teams (id, agency_id, name, lead_id, is_active)
VALUES
(
    '00000000-0000-0000-0000-0000000000a0',
    '00000000-0000-0000-0000-000000000001',
    'Pod Alpha',
    '00000000-0000-0000-0000-0000000000a1',
    true
),
(
    '00000000-0000-0000-0000-0000000000b0',
    '00000000-0000-0000-0000-000000000001',
    'Pod Beta',
    '00000000-0000-0000-0000-0000000000b1',
    true
),
(
    '00000000-0000-0000-0000-0000000000c0',
    '00000000-0000-0000-0000-000000000001',
    'Pod Gamma',
    '00000000-0000-0000-0000-0000000000c1',
    true
)
ON CONFLICT (agency_id, name) DO UPDATE SET
    lead_id = EXCLUDED.lead_id,
    is_active = EXCLUDED.is_active;

-- Team Members mapping
INSERT INTO team_members (agency_id, team_id, user_id, is_home)
VALUES
-- Pod Alpha
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a0', '00000000-0000-0000-0000-0000000000a1', true),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a0', '00000000-0000-0000-0000-0000000000a2', true),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a0', '00000000-0000-0000-0000-0000000000a3', true),
-- Pod Beta
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000b0', '00000000-0000-0000-0000-0000000000b1', true),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000b0', '00000000-0000-0000-0000-0000000000b2', true),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000b0', '00000000-0000-0000-0000-0000000000b3', true),
-- Pod Gamma
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000c0', '00000000-0000-0000-0000-0000000000c1', true),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000c0', '00000000-0000-0000-0000-0000000000c2', true),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000c0', '00000000-0000-0000-0000-0000000000c3', true)
ON CONFLICT (team_id, user_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 4. STAFF PROFILES (Department, Skills, Capacity)
-- -----------------------------------------------------------------------------
INSERT INTO staff_profiles (
    user_id, agency_id, department, skills, weekly_capacity_hours, daily_capacity_hours, team_lead_id
) VALUES
('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000001', 'Creative Direction', '["creative_direction", "brand_systems", "sprint_planning"]'::jsonb, 40, 8, NULL),
('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-000000000001', 'Video Production', '["premiere_pro", "after_effects", "reels_editing", "sound_design"]'::jsonb, 40, 8, '00000000-0000-0000-0000-0000000000a1'),
('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-000000000001', 'Visual Design', '["figma", "brand_guidelines", "typography", "social_banners"]'::jsonb, 40, 8, '00000000-0000-0000-0000-0000000000a1'),

('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000001', 'Creative Direction', '["campaign_strategy", "creative_direction", "growth_marketing"]'::jsonb, 40, 8, NULL),
('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000001', 'Video Production', '["davinci_resolve", "capcut_mastery", "9_16_reels", "cinematics"]'::jsonb, 40, 8, '00000000-0000-0000-0000-0000000000b1'),
('00000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-000000000001', 'Visual Design', '["carousel_design", "posters", "product_mockups", "figma"]'::jsonb, 40, 8, '00000000-0000-0000-0000-0000000000b1'),

('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-000000000001', 'Creative Direction', '["art_direction", "luxury_aesthetics", "creative_direction"]'::jsonb, 40, 8, NULL),
('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-000000000001', 'Video Production', '["motion_graphics", "short_form_editing", "color_grading"]'::jsonb, 40, 8, '00000000-0000-0000-0000-0000000000c1'),
('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-000000000001', 'Visual Design', '["modern_minimalism", "illustrations", "figma", "social_banners"]'::jsonb, 40, 8, '00000000-0000-0000-0000-0000000000c1')
ON CONFLICT (user_id) DO UPDATE SET
    department = EXCLUDED.department,
    skills = EXCLUDED.skills,
    weekly_capacity_hours = EXCLUDED.weekly_capacity_hours,
    daily_capacity_hours = EXCLUDED.daily_capacity_hours,
    team_lead_id = EXCLUDED.team_lead_id;

-- -----------------------------------------------------------------------------
-- 5. REFRESH MATERIALIZED VIEW
-- -----------------------------------------------------------------------------
REFRESH MATERIALIZED VIEW mv_exec_kpis;