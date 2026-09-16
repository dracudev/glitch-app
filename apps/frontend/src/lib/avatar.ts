/**
 * Shared avatar URL resolution.
 *
 * DiceBear avatars are fetched over HTTP at render time, so they add no bundle
 * weight. The `initials` style is deliberately avoided: two letters on a
 * coloured circle is the generic placeholder look. `bottts` gives every player
 * an actual generated character, and the flat brand-tinted backgrounds keep it
 * on-palette.
 */
export function getAvatarUrl(
  user: { username?: string | null; avatar?: string | null } | null | undefined,
  size = 64,
): string {
  if (user?.avatar) {
    return user.avatar;
  }

  const seed = user?.username || 'Anonymous';
  return `https://api.dicebear.com/9.x/bottts/svg?seed=${encodeURIComponent(seed)}&size=${size}&backgroundType=solid&backgroundColor=1d2317,22281c,2c3324&radius=0`;
}

export default getAvatarUrl;
