export const GAMES_CONSTANTS = {
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 12,
    MAX_LIMIT: 100,
  },
  SIMILAR_GAMES: {
    DEFAULT_LIMIT: 6,
  },
  REVIEW_PREVIEW: {
    MAX_LENGTH: 300,
  },
  VALIDATION: {
    TITLE_MAX_LENGTH: 200,
    SUMMARY_MAX_LENGTH: 500,
  },
} as const;

export const SORT_FIELDS = [
  'title',
  'releaseDate',
  'averageRating',
  'reviewCount',
  'createdAt',
] as const;

export const SORT_ORDERS = ['asc', 'desc'] as const;

export type SortField = (typeof SORT_FIELDS)[number];
export type SortOrder = (typeof SORT_ORDERS)[number];

export const GAME_STATUSES = {
  RELEASED: 0,
  ALPHA: 2,
  BETA: 3,
  EARLY_ACCESS: 4,
  OFFLINE: 5,
  CANCELLED: 6,
  RUMORED: 7,
  DELISTED: 8,
} as const;

export type GameStatusName = keyof typeof GAME_STATUSES;

export const GAME_STATUS_NAMES = Object.keys(GAME_STATUSES) as GameStatusName[];

const IGDB_STATUS_TO_NAME = Object.fromEntries(
  Object.entries(GAME_STATUSES).map(([name, id]) => [id, name]),
) as Record<number, GameStatusName>;

export function gameStatusFromIgdb(igdbStatus?: number | null): GameStatusName | undefined {
  if (igdbStatus === undefined || igdbStatus === null) return undefined;
  return IGDB_STATUS_TO_NAME[igdbStatus];
}
