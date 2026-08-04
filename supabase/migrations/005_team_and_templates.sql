-- 005_team_and_templates.sql
-- Creates team_members and wa_templates tables with RLS.
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New query).

BEGIN;

-- ═══════════════════════════════════════════════════════════════
-- 1. team_members
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS team_members (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name          TEXT        NOT NULL,
  email         TEXT        NOT NULL,
  role          TEXT        NOT NULL DEFAULT 'Sales Rep',
  status        TEXT        NOT NULL DEFAULT 'invited',
  avatar        TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_members_select" ON team_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "team_members_insert" ON team_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "team_members_update" ON team_members FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "team_members_delete" ON team_members FOR DELETE USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- 2. wa_templates
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS wa_templates (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name             TEXT        NOT NULL,
  category         TEXT        NOT NULL DEFAULT 'Booking',
  body             TEXT        NOT NULL,
  lang             TEXT        NOT NULL DEFAULT 'en',
  status           TEXT        NOT NULL DEFAULT 'pending',
  variables        TEXT[]      DEFAULT '{}',
  rejection_reason TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE wa_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wa_templates_select" ON wa_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wa_templates_insert" ON wa_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wa_templates_update" ON wa_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "wa_templates_delete" ON wa_templates FOR DELETE USING (auth.uid() = user_id);

COMMIT;
