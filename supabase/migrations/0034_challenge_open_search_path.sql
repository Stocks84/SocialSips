-- 0034: pin private.challenge_open's search_path (advisor: function_search_path_mutable).
-- The body only uses pg_catalog (now(), timestamp) and already schema-qualifies
-- public.challenge_ends_at and the public.challenges parameter type, so an empty
-- search_path is safe. ALTER keeps the body, owner and grants (anon/authenticated: no EXECUTE).
begin;
alter function private.challenge_open(public.challenges) set search_path = '';
commit;
