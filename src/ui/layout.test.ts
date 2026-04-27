import { describe, it, expect } from "bun:test";

import {
	computeLogPageLayout,
	computeMainPageLayout,
	getShortcutFooterColumns,
	getShortcutFooterHeight,
	LOG_PAGE_TITLE_HEIGHT,
	MIN_LOG_PREVIEW_HEIGHT,
	PROCESS_TABLE_OVERHEAD,
	SEARCH_BAR_HEIGHT,
	VIEW_HEADER_HEIGHT,
} from "./layout";

describe("getShortcutFooterColumns", () => {
	it("uses 1 column when terminalWidth < 80", () => {
		expect(getShortcutFooterColumns(40)).toBe(1);
		expect(getShortcutFooterColumns(79)).toBe(1);
	});

	it("uses 2 columns for 80 <= width < 120", () => {
		expect(getShortcutFooterColumns(80)).toBe(2);
		expect(getShortcutFooterColumns(119)).toBe(2);
	});

	it("uses 3 columns for 120 <= width < 160", () => {
		expect(getShortcutFooterColumns(120)).toBe(3);
		expect(getShortcutFooterColumns(159)).toBe(3);
	});

	it("uses 4 columns for width >= 160", () => {
		expect(getShortcutFooterColumns(160)).toBe(4);
		expect(getShortcutFooterColumns(400)).toBe(4);
	});
});

describe("getShortcutFooterHeight", () => {
	// Regression: getShortcutFooterHeight previously returned 0 when shortcuts
	// were collapsed, but the footer always renders the "? for shortcuts" row.
	// That mismatch wasted 1 terminal row at the bottom of the screen.
	it("returns 1 when shortcuts are hidden (the '? for shortcuts' row)", () => {
		expect(getShortcutFooterHeight(9, 80, false)).toBe(1);
		expect(getShortcutFooterHeight(0, 80, false)).toBe(1);
		expect(getShortcutFooterHeight(20, 200, false)).toBe(1);
	});

	it("returns ceil(count / columns) when shortcuts are shown", () => {
		// 80 width => 2 columns, 9 shortcuts => ceil(9 / 2) = 5
		expect(getShortcutFooterHeight(9, 80, true)).toBe(5);
		// 120 width => 3 columns, 9 shortcuts => 3
		expect(getShortcutFooterHeight(9, 120, true)).toBe(3);
		// 160 width => 4 columns, 9 shortcuts => 3
		expect(getShortcutFooterHeight(9, 160, true)).toBe(3);
		// 60 width => 1 column, 12 shortcuts => 12
		expect(getShortcutFooterHeight(12, 60, true)).toBe(12);
	});
});

describe("computeMainPageLayout", () => {
	// Regression: previously the four heights summed to terminalHeight - 3,
	// leaving three wasted rows at the bottom of the screen below the
	// shortcut footer. The four sources of the gap were:
	//   - headerHeight hardcoded to 4 (actual View header is 2 rows)
	//   - an extra `- 1` safety buffer in the log preview height
	//   - getShortcutFooterHeight returning 0 when collapsed (vs. 1 actual)
	//   - LogPage's separate `6` constant being similarly miscounted
	it("heights sum to terminalHeight when shortcuts are collapsed", () => {
		const layout = computeMainPageLayout({
			terminalHeight: 40,
			terminalWidth: 120,
			processCount: 5,
			shortcutsCount: 9,
			showShortcuts: false,
		});
		const total =
			layout.headerHeight +
			layout.processTableHeight +
			layout.logPreviewHeight +
			layout.shortcutFooterHeight;
		expect(total).toBe(40);
	});

	it("heights sum to terminalHeight when shortcuts are expanded", () => {
		const layout = computeMainPageLayout({
			terminalHeight: 40,
			terminalWidth: 120,
			processCount: 5,
			shortcutsCount: 9,
			showShortcuts: true,
		});
		const total =
			layout.headerHeight +
			layout.processTableHeight +
			layout.logPreviewHeight +
			layout.shortcutFooterHeight;
		expect(total).toBe(40);
	});

	it("uses correct fixed heights", () => {
		const layout = computeMainPageLayout({
			terminalHeight: 40,
			terminalWidth: 120,
			processCount: 5,
			shortcutsCount: 9,
			showShortcuts: false,
		});
		expect(layout.headerHeight).toBe(VIEW_HEADER_HEIGHT);
		expect(layout.processTableHeight).toBe(5 + PROCESS_TABLE_OVERHEAD);
		expect(layout.shortcutFooterHeight).toBe(1);
	});

	it("scales with process count and gives the rest to the log preview", () => {
		const a = computeMainPageLayout({
			terminalHeight: 40,
			terminalWidth: 120,
			processCount: 3,
			shortcutsCount: 9,
			showShortcuts: false,
		});
		const b = computeMainPageLayout({
			terminalHeight: 40,
			terminalWidth: 120,
			processCount: 7,
			shortcutsCount: 9,
			showShortcuts: false,
		});
		expect(a.logPreviewHeight - b.logPreviewHeight).toBe(4);
	});

	it("expanding shortcuts shrinks the log preview by the same number of rows", () => {
		const collapsed = computeMainPageLayout({
			terminalHeight: 40,
			terminalWidth: 120,
			processCount: 3,
			shortcutsCount: 9,
			showShortcuts: false,
		});
		const expanded = computeMainPageLayout({
			terminalHeight: 40,
			terminalWidth: 120,
			processCount: 3,
			shortcutsCount: 9,
			showShortcuts: true,
		});
		const footerDelta = expanded.shortcutFooterHeight - collapsed.shortcutFooterHeight;
		expect(collapsed.logPreviewHeight - expanded.logPreviewHeight).toBe(footerDelta);
	});

	it("clamps the log preview to the minimum when the terminal is tight", () => {
		const layout = computeMainPageLayout({
			terminalHeight: 10, // very small
			terminalWidth: 120,
			processCount: 5,
			shortcutsCount: 9,
			showShortcuts: false,
		});
		expect(layout.logPreviewHeight).toBe(MIN_LOG_PREVIEW_HEIGHT);
	});
});

describe("computeLogPageLayout", () => {
	it("heights sum to terminalHeight when shortcuts are collapsed and not searching", () => {
		const layout = computeLogPageLayout({
			terminalHeight: 40,
			terminalWidth: 120,
			shortcutsCount: 12,
			showShortcuts: false,
			isSearchMode: false,
		});
		const total =
			layout.headerHeight +
			layout.titleHeight +
			layout.searchBarHeight +
			layout.logTableHeight +
			layout.shortcutFooterHeight;
		expect(total).toBe(40);
	});

	it("heights sum to terminalHeight when shortcuts are expanded", () => {
		const layout = computeLogPageLayout({
			terminalHeight: 40,
			terminalWidth: 120,
			shortcutsCount: 12,
			showShortcuts: true,
			isSearchMode: false,
		});
		const total =
			layout.headerHeight +
			layout.titleHeight +
			layout.searchBarHeight +
			layout.logTableHeight +
			layout.shortcutFooterHeight;
		expect(total).toBe(40);
	});

	it("heights sum to terminalHeight in search mode", () => {
		const layout = computeLogPageLayout({
			terminalHeight: 40,
			terminalWidth: 120,
			shortcutsCount: 12,
			showShortcuts: false,
			isSearchMode: true,
		});
		const total =
			layout.headerHeight +
			layout.titleHeight +
			layout.searchBarHeight +
			layout.logTableHeight +
			layout.shortcutFooterHeight;
		expect(total).toBe(40);
		expect(layout.searchBarHeight).toBe(SEARCH_BAR_HEIGHT);
	});

	it("uses correct fixed heights", () => {
		const layout = computeLogPageLayout({
			terminalHeight: 40,
			terminalWidth: 120,
			shortcutsCount: 12,
			showShortcuts: false,
			isSearchMode: false,
		});
		expect(layout.headerHeight).toBe(VIEW_HEADER_HEIGHT);
		expect(layout.titleHeight).toBe(LOG_PAGE_TITLE_HEIGHT);
		expect(layout.searchBarHeight).toBe(0);
		expect(layout.shortcutFooterHeight).toBe(1);
	});

	it("entering search mode reduces the log table by exactly one row", () => {
		const inputs = {
			terminalHeight: 40,
			terminalWidth: 120,
			shortcutsCount: 12,
			showShortcuts: false,
		};
		const noSearch = computeLogPageLayout({ ...inputs, isSearchMode: false });
		const searching = computeLogPageLayout({ ...inputs, isSearchMode: true });
		expect(noSearch.logTableHeight - searching.logTableHeight).toBe(1);
	});

	it("expanding shortcuts shrinks the log table by the same number of rows", () => {
		const collapsed = computeLogPageLayout({
			terminalHeight: 40,
			terminalWidth: 120,
			shortcutsCount: 12,
			showShortcuts: false,
			isSearchMode: false,
		});
		const expanded = computeLogPageLayout({
			terminalHeight: 40,
			terminalWidth: 120,
			shortcutsCount: 12,
			showShortcuts: true,
			isSearchMode: false,
		});
		const footerDelta = expanded.shortcutFooterHeight - collapsed.shortcutFooterHeight;
		expect(collapsed.logTableHeight - expanded.logTableHeight).toBe(footerDelta);
	});
});
