-- 1) Harden has_role: SECURITY DEFINER function callable by authenticated users
--    must not disclose other users' roles. Restrict answers to the caller,
--    except for trusted server-side contexts (service_role / no JWT).
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND current_setting('role', true) IS DISTINCT FROM 'service_role'
     AND _user_id IS DISTINCT FROM auth.uid() THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- 2) telemetry_events: allow admins to correct/remove records
CREATE POLICY "Telemetry: admin update"
ON public.telemetry_events
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Telemetry: admin delete"
ON public.telemetry_events
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

GRANT UPDATE, DELETE ON public.telemetry_events TO authenticated;

-- 3) user_roles: allow admins to manage roles through the API
CREATE POLICY "Roles: admin insert"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Roles: admin update"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Roles: admin delete"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

GRANT INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;