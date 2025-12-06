/*
  # Fix Team Management Policies
  
  1. Policy Changes
    - Add policy allowing CEO/Admin to insert profiles for new team members
    - This enables the CEO to add team members through the dashboard
  
  2. Notes
    - The existing "Users can insert own profile" policy remains for self-registration
    - CEO now has ability to create profiles for new users during team member creation
*/

-- Drop existing insert policy if it exists and recreate with better logic
DROP POLICY IF EXISTS "CEO can insert profiles for team members" ON public.profiles;

-- Allow CEO/Admin to insert profiles for new team members
CREATE POLICY "CEO can insert profiles for team members" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('CEO', 'Admin', 'Co-Founder')
  );

-- Ensure the user can still insert their own profile (for self-registration)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
