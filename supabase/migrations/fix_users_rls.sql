-- FIRST: Drop all existing policies on users to fix the recursion
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can update any user" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;

-- Create a security definer function to check if user is admin (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Now create policies using the function (no recursion!)

-- Policy: Users can view their own profile OR admins can view all
CREATE POLICY "Users can view profiles"
ON public.users FOR SELECT
USING (
  auth.uid() = id OR public.is_admin()
);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
USING (auth.uid() = id);

-- Policy: Admins can update any user
CREATE POLICY "Admins can update any user"
ON public.users FOR UPDATE
USING (public.is_admin());

-- Policy: Admins can insert users
CREATE POLICY "Admins can insert users"
ON public.users FOR INSERT
WITH CHECK (public.is_admin());

-- Policy: Admins can delete users
CREATE POLICY "Admins can delete users"
ON public.users FOR DELETE
USING (public.is_admin());
