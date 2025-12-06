/*
  # Complete PIXODE Database Schema

  ## Tables Created
  
  1. profiles
    - User profiles with role management
    - Roles: CEO, Co-Founder, Admin, Employee
  
  2. projects
    - Portfolio projects
    - Stored with technologies as text array
  
  3. inquiries
    - Customer inquiries from contact form
    - Status tracking: new, read, archived
  
  4. chats
    - Live support chat sessions
    - Status: open, assigned, closed
  
  5. messages
    - Chat messages
    - Sender types: user, agent, system, ai
  
  6. attendance_records
    - Employee clock in/out tracking
    - Automatic date tracking
  
  7. action_logs
    - Employee action history
    - Only CEO can view all logs
  
  ## Security
  - Row Level Security enabled on all tables
  - Appropriate policies for each user role
  - CEO has full administrative access
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'Employee',
  image text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_role_check CHECK (role IN ('CEO', 'Co-Founder', 'Admin', 'Employee'))
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "CEO can update any profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'CEO')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'CEO');

CREATE POLICY "CEO can delete profiles" ON public.profiles
  FOR DELETE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'CEO');

-- ============================================================================
-- PROJECTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text NOT NULL,
  image text NOT NULL,
  overview text NOT NULL,
  challenges text NULL,
  approach text NULL,
  results text NULL,
  technologies text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT projects_pkey PRIMARY KEY (id)
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view projects" ON public.projects
  FOR SELECT USING (true);

CREATE POLICY "CEO/Admin can manage projects" ON public.projects
  FOR ALL TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('CEO', 'Admin', 'Co-Founder'))
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('CEO', 'Admin', 'Co-Founder'));

-- ============================================================================
-- INQUIRIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.inquiries (
  id bigserial NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inquiries_pkey PRIMARY KEY (id),
  CONSTRAINT inquiries_status_check CHECK (status IN ('new', 'read', 'archived'))
);

ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CEO/Admin can view inquiries" ON public.inquiries
  FOR SELECT TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('CEO', 'Admin', 'Co-Founder'));

CREATE POLICY "CEO/Admin can update inquiries" ON public.inquiries
  FOR UPDATE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('CEO', 'Admin', 'Co-Founder'))
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('CEO', 'Admin', 'Co-Founder'));

CREATE POLICY "Anyone can create inquiries" ON public.inquiries
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- CHATS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.chats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_email text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  assigned_agent_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chats_pkey PRIMARY KEY (id),
  CONSTRAINT chats_status_check CHECK (status IN ('open', 'assigned', 'closed')),
  CONSTRAINT chats_assigned_agent_fkey FOREIGN KEY (assigned_agent_id) REFERENCES profiles(id) ON DELETE SET NULL
);

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view chats" ON public.chats
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create chats" ON public.chats
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Agents can update chats" ON public.chats
  FOR UPDATE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('CEO', 'Admin', 'Co-Founder', 'Employee'))
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('CEO', 'Admin', 'Co-Founder', 'Employee'));

-- ============================================================================
-- MESSAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id bigserial NOT NULL,
  chat_id uuid NOT NULL,
  text text NOT NULL,
  sender text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
  CONSTRAINT messages_sender_check CHECK (sender IN ('user', 'agent', 'system', 'ai'))
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view messages" ON public.messages
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create messages" ON public.messages
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- ATTENDANCE RECORDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  clock_in_time timestamptz NOT NULL DEFAULT now(),
  clock_out_time timestamptz NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT attendance_records_pkey PRIMARY KEY (id),
  CONSTRAINT attendance_records_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE INDEX attendance_records_user_id_date_idx ON public.attendance_records(user_id, date);
CREATE INDEX attendance_records_date_idx ON public.attendance_records(date DESC);

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attendance, managers view all" ON public.attendance_records
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('CEO', 'Admin', 'Co-Founder')
  );

CREATE POLICY "Users can clock in" ON public.attendance_records
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can clock out own record, managers update any" ON public.attendance_records
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('CEO', 'Admin', 'Co-Founder')
  )
  WITH CHECK (
    auth.uid() = user_id OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('CEO', 'Admin', 'Co-Founder')
  );

CREATE POLICY "Managers can delete attendance records" ON public.attendance_records
  FOR DELETE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('CEO', 'Admin', 'Co-Founder'));

-- ============================================================================
-- ACTION LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.action_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action_type text NOT NULL,
  action_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT action_logs_pkey PRIMARY KEY (id),
  CONSTRAINT action_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE INDEX action_logs_user_id_idx ON public.action_logs(user_id);
CREATE INDEX action_logs_created_at_idx ON public.action_logs(created_at DESC);
CREATE INDEX action_logs_action_type_idx ON public.action_logs(action_type);

ALTER TABLE public.action_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CEO can view all action logs" ON public.action_logs
  FOR SELECT TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'CEO');

CREATE POLICY "Users can view own action logs" ON public.action_logs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create action logs" ON public.action_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chats_updated_at
    BEFORE UPDATE ON public.chats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at
    BEFORE UPDATE ON public.attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'Employee')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
