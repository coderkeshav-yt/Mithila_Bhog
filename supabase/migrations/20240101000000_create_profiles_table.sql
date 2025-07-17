-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'customer',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Create policy to allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Create policy to allow admins to manage all profiles
CREATE POLICY "Admins can manage all profiles"
  ON public.profiles
  USING (EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  ));

-- Create a function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to handle new user signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the updated_at column
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Create an index on the role column for faster lookups
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);

-- Create an index on the is_active column for faster lookups
CREATE INDEX IF NOT EXISTS profiles_is_active_idx ON public.profiles(is_active);

-- Create a function to update user role
CREATE OR REPLACE FUNCTION public.update_user_role(
  user_id UUID,
  new_role TEXT
) 
RETURNS VOID AS $$
BEGIN
  -- Update the role in the profiles table
  UPDATE public.profiles
  SET 
    role = new_role,
    updated_at = NOW()
  WHERE id = user_id;
  
  -- Also update the user's metadata in auth.users
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    to_jsonb(new_role)
  )
  WHERE id = user_id;
  
  -- Ensure the user has the correct role in the auth.users table
  UPDATE auth.users
  SET role = CASE 
    WHEN new_role = 'admin' THEN 'service_role'
    ELSE 'authenticated'
  END
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to update user status
CREATE OR REPLACE FUNCTION public.update_user_status(
  user_id UUID,
  is_active BOOLEAN
) 
RETURNS VOID AS $$
BEGIN
  -- Update the status in the profiles table
  UPDATE public.profiles
  SET 
    is_active = update_user_status.is_active,
    updated_at = NOW()
  WHERE id = user_id;
  
  -- Update the user's status in auth.users
  IF NOT is_active THEN
    -- Ban the user
    UPDATE auth.users
    SET banned_until = 'infinity'::timestamptz
    WHERE id = user_id;
  ELSE
    -- Unban the user
    UPDATE auth.users
    SET banned_until = NULL
    WHERE id = user_id;
  END IF;
  
  -- Update the user's metadata with the active status
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{is_active}',
    to_jsonb(is_active)
  )
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.update_user_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_status(UUID, BOOLEAN) TO authenticated;
