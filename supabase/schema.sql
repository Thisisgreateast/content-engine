-- ContentEngine — Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor to set up the database.

-- =============================================
-- Table: users
-- Stores user profile and subscription data
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL DEFAULT '',
  industry TEXT NOT NULL DEFAULT '',
  target_audience TEXT NOT NULL DEFAULT '',
  brand_voice TEXT NOT NULL DEFAULT 'professional',
  platforms TEXT[] NOT NULL DEFAULT '{}',
  plan TEXT CHECK (plan IN ('starter', 'pro', 'agency')) DEFAULT NULL,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for users
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);

-- =============================================
-- Table: clients (for Agency tier)
-- Agency users can manage multiple client accounts
-- =============================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  industry TEXT NOT NULL DEFAULT '',
  target_audience TEXT NOT NULL DEFAULT '',
  brand_voice TEXT NOT NULL DEFAULT 'professional',
  platforms TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for clients
CREATE INDEX IF NOT EXISTS idx_clients_agency_user ON clients(agency_user_id);

-- =============================================
-- Table: generated_posts
-- Stores AI-generated social media posts
-- =============================================
CREATE TABLE IF NOT EXISTS generated_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'linkedin', 'instagram', 'facebook', 'tiktok')),
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  content TEXT NOT NULL,
  hashtags TEXT[] NOT NULL DEFAULT '{}',
  image_suggestion TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'edited')),
  original_content TEXT NOT NULL,
  edited_content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for generated_posts
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON generated_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_platform ON generated_posts(platform);
CREATE INDEX IF NOT EXISTS idx_posts_status ON generated_posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_day ON generated_posts(day_of_week);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON generated_posts(created_at DESC);

-- =============================================
-- Table: edit_history
-- Tracks user edits to posts so the AI can learn
-- =============================================
CREATE TABLE IF NOT EXISTS edit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES generated_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original TEXT NOT NULL,
  edited TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for edit_history
CREATE INDEX IF NOT EXISTS idx_edit_history_user ON edit_history(user_id);
CREATE INDEX IF NOT EXISTS idx_edit_history_post ON edit_history(post_id);
CREATE INDEX IF NOT EXISTS idx_edit_history_created ON edit_history(created_at DESC);

-- =============================================
-- Table: token_usage
-- Tracks OpenAI API token usage per user for billing
-- =============================================
CREATE TABLE IF NOT EXISTS token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  model TEXT NOT NULL DEFAULT 'gpt-4o',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_token_usage_user ON token_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_date ON token_usage(created_at);

-- =============================================
-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
-- =============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE edit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies to avoid "already exists" errors on re-run
DO $$ 
BEGIN
    -- Users policies
    DROP POLICY IF EXISTS "Users can read own data" ON users;
    DROP POLICY IF EXISTS "Users can update own data" ON users;
    
    -- Posts policies
    DROP POLICY IF EXISTS "Users can read own posts" ON generated_posts;
    DROP POLICY IF EXISTS "Users can insert own posts" ON generated_posts;
    DROP POLICY IF EXISTS "Users can update own posts" ON generated_posts;
    DROP POLICY IF EXISTS "Users can delete own posts" ON generated_posts;
    
    -- Clients policies
    DROP POLICY IF EXISTS "Agency users can read own clients" ON clients;
    DROP POLICY IF EXISTS "Agency users can insert clients" ON clients;
    DROP POLICY IF EXISTS "Agency users can update clients" ON clients;
    DROP POLICY IF EXISTS "Agency users can delete clients" ON clients;
    
    -- Edit history policies
    DROP POLICY IF EXISTS "Users can read own edit history" ON edit_history;
    DROP POLICY IF EXISTS "Users can insert edit history" ON edit_history;
    
    -- Token usage policies
    DROP POLICY IF EXISTS "Users can read own token usage" ON token_usage;
END $$;

-- Users can only read/update their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Users can read/update their own posts
CREATE POLICY "Users can read own posts" ON generated_posts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own posts" ON generated_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON generated_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON generated_posts
  FOR DELETE USING (auth.uid() = user_id);

-- Agency users can manage their clients
CREATE POLICY "Agency users can read own clients" ON clients
  FOR SELECT USING (auth.uid() = agency_user_id);

CREATE POLICY "Agency users can insert clients" ON clients
  FOR INSERT WITH CHECK (auth.uid() = agency_user_id);

CREATE POLICY "Agency users can update clients" ON clients
  FOR UPDATE USING (auth.uid() = agency_user_id);

CREATE POLICY "Agency users can delete clients" ON clients
  FOR DELETE USING (auth.uid() = agency_user_id);

-- Edit history access
CREATE POLICY "Users can read own edit history" ON edit_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert edit history" ON edit_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Token usage access
CREATE POLICY "Users can read own token usage" ON token_usage
  FOR SELECT USING (auth.uid() = user_id);

-- =============================================
-- Functions and Triggers
-- =============================================

-- 1. Sync auth.users to public.users
-- This ensures that when a user signs up, a row is automatically 
-- created in the public.users table.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $
BEGIN
  INSERT INTO public.users (id, business_name)
  VALUES (NEW.id, '');
  RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop triggers if they exist to avoid errors
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_posts_updated_at ON generated_posts;
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON generated_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
