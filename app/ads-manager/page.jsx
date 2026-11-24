-- Reuse existing `advertisements` table and add upgrade columns safely
ALTER TABLE public.advertisements
  ADD COLUMN IF NOT EXISTS advertiser_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ad_category text DEFAULT 'General Business',
  ADD COLUMN IF NOT EXISTS target_language text DEFAULT 'English',
  ADD COLUMN IF NOT EXISTS audience_interests text DEFAULT 'Technology, Business, Career',
  ADD COLUMN IF NOT EXISTS start_time text DEFAULT '09:00',
  ADD COLUMN IF NOT EXISTS daily_budget numeric DEFAULT 199,
  ADD COLUMN IF NOT EXISTS placements text[] DEFAULT ARRAY['feed_every_4_posts']::text[],
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending_payment',
  ADD COLUMN IF NOT EXISTS payment_provider text DEFAULT 'deferred',
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS is_admin_approved boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS impressions bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clicks bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reach bigint DEFAULT 0;

-- Ensure campaigns are NEVER active by default
ALTER TABLE public.advertisements
  ALTER COLUMN status SET DEFAULT 'pending';

-- Optional: Admin role helper check (uses existing profiles.role or profiles.is_admin if present)
CREATE OR REPLACE FUNCTION public.is_shanora_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (
        COALESCE(p.is_admin, false) = true
        OR lower(COALESCE(p.role, '')) IN ('admin', 'super_admin')
      )
  );
$$;

-- Secure Row Level Security on advertisements
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

-- Public/authenticated users can read ONLY admin-approved & active ads for Feed display
DROP POLICY IF EXISTS "Public read approved active ads" ON public.advertisements;
CREATE POLICY "Public read approved active ads"
  ON public.advertisements
  FOR SELECT
  USING (
    is_admin_approved = true
    AND status IN ('approved', 'active')
  );

-- Advertisers can view their own campaigns (by user_id or email)
DROP POLICY IF EXISTS "Advertisers read own ads" ON public.advertisements;
CREATE POLICY "Advertisers read own ads"
  ON public.advertisements
  FOR SELECT
  TO authenticated
  USING (
    advertiser_user_id = auth.uid()
    OR lower(advertiser_email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
  );

-- Authenticated users can insert campaigns ONLY as pending & unapproved
DROP POLICY IF EXISTS "Advertisers insert own pending ads" ON public.advertisements;
CREATE POLICY "Advertisers insert own pending ads"
  ON public.advertisements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (advertiser_user_id = auth.uid() OR advertiser_user_id IS NULL)
    AND lower(advertiser_email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    AND status = 'pending'
    AND is_admin_approved = false
  );

-- Advertisers can update their own non-admin fields (cannot self-approve or activate)
DROP POLICY IF EXISTS "Advertisers update own non-approved ads" ON public.advertisements;
CREATE POLICY "Advertisers update own non-approved ads"
  ON public.advertisements
  FOR UPDATE
  TO authenticated
  USING (
    advertiser_user_id = auth.uid()
    OR lower(advertiser_email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
  )
  WITH CHECK (
    (advertiser_user_id = auth.uid() OR advertiser_user_id IS NULL)
    AND is_admin_approved = false
    AND status IN ('pending', 'pending_payment', 'paused')
  );

-- Admins can read, approve, reject, pause, activate, and delete all ads
DROP POLICY IF EXISTS "Admins full access to ads" ON public.advertisements;
CREATE POLICY "Admins full access to ads"
  ON public.advertisements
  FOR ALL
  TO authenticated
  USING (public.is_shanora_admin())
  WITH CHECK (public.is_shanora_admin());

-- Atomic RPC functions for real impressions & clicks on Feed
CREATE OR REPLACE FUNCTION public.increment_ad_impression(ad_uuid uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.advertisements
  SET
    impressions = COALESCE(impressions, 0) + 1,
    reach = COALESCE(reach, 0) + 1
  WHERE id = ad_uuid
    AND is_admin_approved = true
    AND status IN ('approved', 'active');
$$;

CREATE OR REPLACE FUNCTION public.increment_ad_click(ad_uuid uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.advertisements
  SET clicks = COALESCE(clicks, 0) + 1
  WHERE id = ad_uuid
    AND is_admin_approved = true
    AND status IN ('approved', 'active');
$$;
