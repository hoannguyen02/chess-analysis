export type BoardThemeId =
  | 'classic'
  | 'walnut'
  | 'copper'
  | 'studio'
  | 'ocean'
  | 'rosewood';

export const BOARD_THEMES = [
  {
    id: 'classic' as const,
    labelKey: 'setup-board.theme-classic',
    light: '#edeed1',
    dark: '#779952',
  },
  {
    id: 'walnut' as const,
    labelKey: 'setup-board.theme-walnut',
    light: '#f3e7c7',
    dark: '#6a5240',
  },
  {
    id: 'copper' as const,
    labelKey: 'setup-board.theme-copper',
    light: '#f3dfb8',
    dark: '#b97847',
  },
  {
    id: 'studio' as const,
    labelKey: 'setup-board.theme-studio',
    light: '#f1ead8',
    dark: '#53657d',
  },
  {
    id: 'ocean' as const,
    labelKey: 'setup-board.theme-ocean',
    light: '#e8efe5',
    dark: '#2f6f78',
  },
  {
    id: 'rosewood' as const,
    labelKey: 'setup-board.theme-rosewood',
    light: '#f2ddcf',
    dark: '#8b5a46',
  },
];

export const DEFAULT_BOARD_THEME: BoardThemeId = 'classic';

export const BOARD_THEME_MAP = Object.fromEntries(
  BOARD_THEMES.map((theme) => [theme.id, theme])
) as Record<BoardThemeId, (typeof BOARD_THEMES)[number]>;
