export type BoardThemeId =
  | 'classic'
  | 'fide-wood'
  | 'fide-classic'
  | 'fide-arena'
  | 'fide-broadcast'
  | 'walnut'
  | 'copper'
  | 'studio'
  | 'ocean'
  | 'rosewood';

export type TeachingHighlightColor = {
  key: '1' | '2' | '3' | '4';
  labelKey: string;
  fill: string;
  border: string;
  arrow: string;
};

type BoardTheme = {
  id: BoardThemeId;
  labelKey: string;
  light: string;
  dark: string;
  notationColor: string;
  notationShadow: string;
  highlightColors: readonly TeachingHighlightColor[];
};

const CLASSIC_HIGHLIGHT_COLORS = [
  {
    key: '1',
    labelKey: 'common.teaching-tools.color-yellow',
    fill: 'rgba(250, 204, 21, 0.26)',
    border: 'rgba(234, 179, 8, 0.96)',
    arrow: '#EAB308',
  },
  {
    key: '2',
    labelKey: 'common.teaching-tools.color-red',
    fill: 'rgba(244, 63, 94, 0.24)',
    border: 'rgba(225, 29, 72, 0.96)',
    arrow: '#E11D48',
  },
  {
    key: '3',
    labelKey: 'common.teaching-tools.color-blue',
    fill: 'rgba(56, 189, 248, 0.24)',
    border: 'rgba(2, 132, 199, 0.96)',
    arrow: '#0EA5E9',
  },
  {
    key: '4',
    labelKey: 'common.teaching-tools.color-green',
    fill: 'rgba(74, 222, 128, 0.22)',
    border: 'rgba(22, 163, 74, 0.96)',
    arrow: '#22C55E',
  },
] as const satisfies readonly TeachingHighlightColor[];

const WOOD_HIGHLIGHT_COLORS = [
  {
    key: '1',
    labelKey: 'common.teaching-tools.color-yellow',
    fill: 'rgba(59, 130, 246, 0.18)',
    border: 'rgba(37, 99, 235, 0.96)',
    arrow: '#2563EB',
  },
  {
    key: '2',
    labelKey: 'common.teaching-tools.color-red',
    fill: 'rgba(239, 68, 68, 0.18)',
    border: 'rgba(220, 38, 38, 0.96)',
    arrow: '#DC2626',
  },
  {
    key: '3',
    labelKey: 'common.teaching-tools.color-blue',
    fill: 'rgba(168, 85, 247, 0.16)',
    border: 'rgba(147, 51, 234, 0.96)',
    arrow: '#9333EA',
  },
  {
    key: '4',
    labelKey: 'common.teaching-tools.color-green',
    fill: 'rgba(34, 197, 94, 0.16)',
    border: 'rgba(22, 163, 74, 0.96)',
    arrow: '#16A34A',
  },
] as const satisfies readonly TeachingHighlightColor[];

const DARK_HIGHLIGHT_COLORS = [
  {
    key: '1',
    labelKey: 'common.teaching-tools.color-yellow',
    fill: 'rgba(250, 204, 21, 0.22)',
    border: 'rgba(245, 158, 11, 0.98)',
    arrow: '#F59E0B',
  },
  {
    key: '2',
    labelKey: 'common.teaching-tools.color-red',
    fill: 'rgba(251, 113, 133, 0.2)',
    border: 'rgba(244, 63, 94, 0.98)',
    arrow: '#F43F5E',
  },
  {
    key: '3',
    labelKey: 'common.teaching-tools.color-blue',
    fill: 'rgba(34, 211, 238, 0.18)',
    border: 'rgba(6, 182, 212, 0.98)',
    arrow: '#06B6D4',
  },
  {
    key: '4',
    labelKey: 'common.teaching-tools.color-green',
    fill: 'rgba(163, 230, 53, 0.18)',
    border: 'rgba(101, 163, 13, 0.98)',
    arrow: '#84CC16',
  },
] as const satisfies readonly TeachingHighlightColor[];

export const BOARD_THEMES: readonly BoardTheme[] = [
  {
    id: 'fide-wood' as const,
    labelKey: 'setup-board.theme-fide-wood',
    light: '#f0d8b5',
    dark: '#b58863',
    notationColor: '#f7f1df',
    notationShadow: '0 1px 3px rgba(60, 33, 12, 0.72)',
    highlightColors: WOOD_HIGHLIGHT_COLORS,
  },
  {
    id: 'fide-classic' as const,
    labelKey: 'setup-board.theme-fide-classic',
    light: '#f1d9b7',
    dark: '#a97a52',
    notationColor: '#f8f0de',
    notationShadow: '0 1px 3px rgba(73, 41, 18, 0.72)',
    highlightColors: WOOD_HIGHLIGHT_COLORS,
  },
  {
    id: 'fide-arena' as const,
    labelKey: 'setup-board.theme-fide-arena',
    light: '#eed7b0',
    dark: '#8f6848',
    notationColor: '#fbf3e4',
    notationShadow: '0 1px 3px rgba(53, 31, 15, 0.74)',
    highlightColors: WOOD_HIGHLIGHT_COLORS,
  },
  {
    id: 'fide-broadcast' as const,
    labelKey: 'setup-board.theme-fide-broadcast',
    light: '#f4dfbf',
    dark: '#9f6f44',
    notationColor: '#fdf4e2',
    notationShadow: '0 1px 4px rgba(56, 31, 12, 0.75)',
    highlightColors: WOOD_HIGHLIGHT_COLORS,
  },
  {
    id: 'classic' as const,
    labelKey: 'setup-board.theme-classic',
    light: '#edeed1',
    dark: '#779952',
    notationColor: '#f5a623',
    notationShadow: '0 1px 3px rgba(15, 23, 42, 0.85)',
    highlightColors: CLASSIC_HIGHLIGHT_COLORS,
  },
  {
    id: 'walnut' as const,
    labelKey: 'setup-board.theme-walnut',
    light: '#f3e7c7',
    dark: '#6a5240',
    notationColor: '#fff3d4',
    notationShadow: '0 1px 4px rgba(20, 15, 10, 0.88)',
    highlightColors: DARK_HIGHLIGHT_COLORS,
  },
  {
    id: 'copper' as const,
    labelKey: 'setup-board.theme-copper',
    light: '#f3dfb8',
    dark: '#b97847',
    notationColor: '#fff0d2',
    notationShadow: '0 1px 4px rgba(72, 35, 18, 0.75)',
    highlightColors: WOOD_HIGHLIGHT_COLORS,
  },
  {
    id: 'studio' as const,
    labelKey: 'setup-board.theme-studio',
    light: '#f1ead8',
    dark: '#53657d',
    notationColor: '#e9f2ff',
    notationShadow: '0 1px 4px rgba(15, 23, 42, 0.88)',
    highlightColors: DARK_HIGHLIGHT_COLORS,
  },
  {
    id: 'ocean' as const,
    labelKey: 'setup-board.theme-ocean',
    light: '#e8efe5',
    dark: '#2f6f78',
    notationColor: '#e6fbff',
    notationShadow: '0 1px 4px rgba(8, 31, 38, 0.86)',
    highlightColors: DARK_HIGHLIGHT_COLORS,
  },
  {
    id: 'rosewood' as const,
    labelKey: 'setup-board.theme-rosewood',
    light: '#f2ddcf',
    dark: '#8b5a46',
    notationColor: '#fff0e7',
    notationShadow: '0 1px 4px rgba(58, 29, 23, 0.76)',
    highlightColors: WOOD_HIGHLIGHT_COLORS,
  },
];

export const DEFAULT_BOARD_THEME: BoardThemeId = 'fide-broadcast';

export const BOARD_THEME_MAP = Object.fromEntries(
  BOARD_THEMES.map((theme) => [theme.id, theme])
) as Record<BoardThemeId, (typeof BOARD_THEMES)[number]>;
