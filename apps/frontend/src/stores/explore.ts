import { atom, computed } from 'nanostores';
import type { GameFilterOptions, GameStatus, GamesQuery } from '@glitch/shared-types';
import { getFilterOptions } from '../services/games';

const GAME_STATUSES: GameStatus[] = [
  'RELEASED',
  'ALPHA',
  'BETA',
  'EARLY_ACCESS',
  'OFFLINE',
  'CANCELLED',
  'RUMORED',
  'DELISTED',
];

const DEFAULT_FILTERS: GamesQuery = {
  page: 1,
  limit: 20,
  sortBy: 'igdbRating',
  sortOrder: 'desc',
  genreIds: [],
  platformIds: [],
  search: '',
  status: undefined,
};

export const $filterOptions = atom<GameFilterOptions | null>(null);
export const $filterOptionsLoading = atom<boolean>(false);
export const $filterOptionsError = atom<string | null>(null);

export const loadFilterOptions = async () => {
  if ($filterOptions.get()) return;
  $filterOptionsLoading.set(true);
  $filterOptionsError.set(null);
  try {
    $filterOptions.set(await getFilterOptions());
  } catch (error: any) {
    $filterOptionsError.set(error.message || 'Failed to load filter options');
  } finally {
    $filterOptionsLoading.set(false);
  }
};

export const $selectedFilters = atom<GamesQuery>({ ...DEFAULT_FILTERS });

export const $filterUrlParams = computed($selectedFilters, (filters) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value) && value.length > 0) {
        params.set(key, value.join(','));
      } else if (!Array.isArray(value)) {
        params.set(key, String(value));
      }
    }
  });
  return params.toString();
});

let debounceTimer: ReturnType<typeof setTimeout>;

export const setFilter = (key: keyof GamesQuery, value: any) => {
  const current = $selectedFilters.get();
  const updates = key === 'page' ? { [key]: value } : { [key]: value, page: 1 };
  $selectedFilters.set({ ...current, ...updates });
  if (key === 'search') {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => updateUrl(), 300);
  } else {
    updateUrl();
  }
};

export const toggleArrayFilter = (key: 'genreIds' | 'platformIds', id: number) => {
  const current = $selectedFilters.get();
  const array: number[] = (current[key] as number[]) || [];
  const newArray = array.includes(id) ? array.filter((item) => item !== id) : [...array, id];
  setFilter(key, newArray);
};

export const clearFilters = () => {
  $selectedFilters.set({ ...DEFAULT_FILTERS });
  updateUrl();
};

export const setPage = (page: number) => {
  setFilter('page', page);
};

const updateUrl = () => {
  const params = $filterUrlParams.get();
  const newUrl = params ? `/games?${params}` : '/games';
  window.history.replaceState({}, '', newUrl);
};

const parseIds = (value: string): number[] =>
  value
    .split(',')
    .map((entry) => Number(entry.trim()))
    .filter((id) => Number.isInteger(id) && id > 0);

export const initializeFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const filters: GamesQuery = { ...DEFAULT_FILTERS };

  params.forEach((value, key) => {
    switch (key) {
      case 'genreIds':
      case 'platformIds': {
        const ids = parseIds(value);
        if (ids.length > 0) filters[key] = ids;
        break;
      }
      case 'page':
      case 'limit': {
        const parsed = parseInt(value, 10);
        if (Number.isInteger(parsed) && parsed > 0) filters[key] = parsed;
        break;
      }
      case 'minRating':
      case 'maxRating': {
        const parsed = Number(value);
        if (!Number.isNaN(parsed)) filters[key] = parsed;
        break;
      }
      case 'status':
        if (GAME_STATUSES.includes(value as GameStatus)) {
          filters.status = value as GameStatus;
        }
        break;
      case 'sortBy':
        filters.sortBy = value as GamesQuery['sortBy'];
        break;
      case 'sortOrder':
        if (value === 'asc' || value === 'desc') filters.sortOrder = value;
        break;
      case 'search':
        filters.search = value;
        break;
      default:
        break;
    }
  });

  $selectedFilters.set(filters);
};
