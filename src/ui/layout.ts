// Pure layout math for the TUI. Kept free of any ink imports so it can be
// unit-tested directly. The heights here describe the number of terminal rows
// each component renders, and the sum of all components for a given page must
// equal `terminalHeight` so no rows are wasted at the bottom.

/** "Curse v{version}" + "Config: {filename}" — rendered by `View`. */
export const VIEW_HEADER_HEIGHT = 2;

/** ProcessTable border-and-header overhead: top border + header row + bottom border. */
export const PROCESS_TABLE_OVERHEAD = 3;

/** "Logs({name})[tail]" title bar in the log view. */
export const LOG_PAGE_TITLE_HEIGHT = 1;

/** Search bar row, when search mode is active. */
export const SEARCH_BAR_HEIGHT = 1;

/** Floor for the log preview on the main page so it stays usable. */
export const MIN_LOG_PREVIEW_HEIGHT = 4;

/**
 * Number of columns the shortcut footer breaks into based on terminal width.
 * Mirrors the layout used inside `ShortcutFooter`.
 */
export function getShortcutFooterColumns(terminalWidth: number): number {
	if (terminalWidth < 80) return 1;
	if (terminalWidth < 120) return 2;
	if (terminalWidth < 160) return 3;
	return 4;
}

/**
 * Number of rows the shortcut footer actually renders.
 *
 * When `showShortcuts` is false the footer still renders a single
 * "? for shortcuts" row — historically this returned 0 here, which was the
 * source of the wasted-row gap at the bottom of the terminal.
 */
export function getShortcutFooterHeight(
	shortcutsCount: number,
	terminalWidth: number,
	showShortcuts: boolean,
): number {
	if (!showShortcuts) return 1;
	const numColumns = getShortcutFooterColumns(terminalWidth);
	return Math.ceil(shortcutsCount / numColumns);
}

export interface MainPageLayoutInput {
	terminalHeight: number;
	terminalWidth: number;
	processCount: number;
	shortcutsCount: number;
	showShortcuts: boolean;
}

export interface MainPageLayout {
	headerHeight: number;
	processTableHeight: number;
	logPreviewHeight: number;
	shortcutFooterHeight: number;
}

/**
 * Compute the row breakdown for the MainPage in normal display mode.
 *
 * Invariant (when terminalHeight is large enough): the four returned heights
 * sum to exactly `terminalHeight`, leaving no empty rows at the bottom.
 */
export function computeMainPageLayout(input: MainPageLayoutInput): MainPageLayout {
	const headerHeight = VIEW_HEADER_HEIGHT;
	const processTableHeight = input.processCount + PROCESS_TABLE_OVERHEAD;
	const shortcutFooterHeight = getShortcutFooterHeight(
		input.shortcutsCount,
		input.terminalWidth,
		input.showShortcuts,
	);
	const available = input.terminalHeight - headerHeight - processTableHeight - shortcutFooterHeight;
	const logPreviewHeight = Math.max(MIN_LOG_PREVIEW_HEIGHT, available);

	return {
		headerHeight,
		processTableHeight,
		logPreviewHeight,
		shortcutFooterHeight,
	};
}

export interface LogPageLayoutInput {
	terminalHeight: number;
	terminalWidth: number;
	shortcutsCount: number;
	showShortcuts: boolean;
	isSearchMode: boolean;
}

export interface LogPageLayout {
	headerHeight: number;
	titleHeight: number;
	searchBarHeight: number;
	logTableHeight: number;
	shortcutFooterHeight: number;
}

/**
 * Compute the row breakdown for the LogPage.
 *
 * Invariant: the five returned heights sum to exactly `terminalHeight`,
 * leaving no empty rows at the bottom.
 */
export function computeLogPageLayout(input: LogPageLayoutInput): LogPageLayout {
	const headerHeight = VIEW_HEADER_HEIGHT;
	const titleHeight = LOG_PAGE_TITLE_HEIGHT;
	const searchBarHeight = input.isSearchMode ? SEARCH_BAR_HEIGHT : 0;
	const shortcutFooterHeight = getShortcutFooterHeight(
		input.shortcutsCount,
		input.terminalWidth,
		input.showShortcuts,
	);
	const logTableHeight =
		input.terminalHeight - headerHeight - titleHeight - searchBarHeight - shortcutFooterHeight;

	return {
		headerHeight,
		titleHeight,
		searchBarHeight,
		logTableHeight,
		shortcutFooterHeight,
	};
}
