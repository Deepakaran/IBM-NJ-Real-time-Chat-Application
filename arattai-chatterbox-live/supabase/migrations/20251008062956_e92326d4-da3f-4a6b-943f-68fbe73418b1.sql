-- Fix the search_path security issue
CREATE OR REPLACE FUNCTION update_last_seen()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.last_seen = NOW();
  RETURN NEW;
END;
$$;