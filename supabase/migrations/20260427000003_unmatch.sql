-- ── Unmatch ─────────────────────────────────────────────────────────────────
-- Two changes ship in this migration:
--   1. Tighten the existing DELETE policy on `public.matches` so EITHER
--      participant can delete the row. Matches are stored canonically
--      (smaller uuid first), so the previous policy (`user_id = auth.uid()`)
--      silently locked out roughly half of users.
--   2. Add an `unmatch(p_other)` RPC that removes the match plus both
--      directional likes and any prior messages between the two users so
--      the conversation history is fully cleaned up — matching standard
--      dating-app unmatch UX (e.g. Tinder, Bumble).

drop policy if exists "Users can delete own matches" on public.matches;

create policy "Users can delete own matches"
  on public.matches for delete
  to authenticated
  using (user_id = auth.uid() or match_user_id = auth.uid());

create or replace function public.unmatch(p_other uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_self uuid := auth.uid();
begin
  if v_self is null then
    raise exception 'Not authenticated';
  end if;
  if p_other is null or p_other = v_self then
    raise exception 'Invalid unmatch target';
  end if;

  -- Match (stored canonically — try both directions to be safe)
  delete from public.matches
   where (user_id = v_self and match_user_id = p_other)
      or (user_id = p_other and match_user_id = v_self);

  -- Likes (both directions) so the pair can be rediscovered later
  delete from public.likes
   where (from_user_id = v_self and to_user_id = p_other)
      or (from_user_id = p_other and to_user_id = v_self);

  -- Existing message history — drop the whole thread on unmatch
  delete from public.messages
   where (from_user_id = v_self and to_user_id = p_other)
      or (from_user_id = p_other and to_user_id = v_self);
end;
$$;

grant execute on function public.unmatch(uuid) to authenticated;
