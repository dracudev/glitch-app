// PNG for Open Graph: many scrapers can't rasterise an SVG and render no image.
export function getAvatarUrl(
  user: { username?: string | null; avatar?: string | null } | null | undefined,
  size = 64,
  format: 'svg' | 'png' = 'svg',
): string {
  if (user?.avatar) {
    return user.avatar;
  }

  const seed = user?.username || 'Anonymous';
  return `https://api.dicebear.com/9.x/bottts/${format}?seed=${encodeURIComponent(seed)}&size=${size}&backgroundType=solid&backgroundColor=1d2317,22281c,2c3324&radius=0`;
}

export default getAvatarUrl;
