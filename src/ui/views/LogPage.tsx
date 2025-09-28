import { Box, Text, useInput, useStdout } from "ink";
import { useEffect, useState, useMemo, useCallback } from "react";
import { $ } from "bun";

import { usePage, ViewPage } from "../../hooks/usePage";
import { useProcessManager } from "../../hooks/useProcessManager";
import { Colors } from "../../lib/Colors";
import { ShortcutFooter, getShortcutFooterHeight } from "../components/ShortcutFooter";

function LogTable(props: {
	height: number;
	isSearchMode: boolean;
	searchQuery: string;
	appliedSearchQuery: string;
	viewInContextRequested: {
		lineNumber: number;
		requested: boolean;
	} | null;
	onViewInContextHandled: () => void;
	onSearchCursorChange?: (
		cursorIndex: number,
		searchResults: Array<{ lineNumber: number; text: string }>,
	) => void;
	onSelectModeChange?: (isSelectMode: boolean) => void;
}) {
	const { selectedProcess, killAllProcesses } = useProcessManager();
	const [, forceUpdate] = useState(0);
	const [autoScroll, setAutoScroll] = useState(true);
	const [viewStartLine, setViewStartLine] = useState(0);
	const [positionLost, setPositionLost] = useState(false);
	const [cursorIndex, setCursorIndex] = useState(0);
	const [numberPrefix, setNumberPrefix] = useState("");
	const [waitingForSecondG, setWaitingForSecondG] = useState(false);
	const [isSelectMode, setIsSelectMode] = useState(false);
	const [selectionStartAbsoluteLine, setSelectionStartAbsoluteLine] =
		useState(0);
	const [selectionStartViewIndex, setSelectionStartViewIndex] = useState(0);
	const [searchViewStartIndex, setSearchViewStartIndex] = useState(0);
	const [showCopyIndicator, setShowCopyIndicator] = useState(false);
	const [copyIndicatorText, setCopyIndicatorText] = useState("");
	const {
		isSearchMode,
		searchQuery,
		appliedSearchQuery,
		viewInContextRequested,
		onViewInContextHandled,
		onSearchCursorChange,
		onSelectModeChange,
	} = props;

	// Function to highlight search terms in text
	const highlightSearchTerm = (text: string, searchTerm: string) => {
		if (!searchTerm || !searchTerm.trim()) {
			return [{ text, isHighlight: false }];
		}

		const parts = [];
		const regex = new RegExp(
			`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
			"gi",
		);
		const matches = text.split(regex);

		for (let i = 0; i < matches.length; i++) {
			const part = matches[i];
			if (part) {
				const isHighlight = regex.test(part);
				parts.push({ text: part, isHighlight });
			}
		}

		return parts;
	};

	// Force re-render every second to update logs and check position validity
	useEffect(() => {
		const interval = setInterval(() => {
			forceUpdate((prev) => prev + 1);
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	// Handle view in context request
	useEffect(() => {
		if (viewInContextRequested?.requested && selectedProcess) {
			const targetLineNumber = viewInContextRequested.lineNumber;

			// Turn off autoscroll
			setAutoScroll(false);

			// Calculate the view start position to center the target line
			const linesPerPage = props.height - 3;
			const targetViewStart = Math.max(
				selectedProcess.logBuffer.getOldestAvailableLineNumber(),
				targetLineNumber - Math.floor(linesPerPage / 2),
			);

			// Set the view position
			setViewStartLine(targetViewStart);

			// Set cursor to the target line within the view
			const cursorPosition = targetLineNumber - targetViewStart;
			setCursorIndex(Math.max(0, Math.min(cursorPosition, linesPerPage - 1)));

			// Reset search view index
			setSearchViewStartIndex(0);

			// Notify parent that we've handled the request
			onViewInContextHandled();
		}
	}, [
		viewInContextRequested,
		selectedProcess,
		props.height,
		onViewInContextHandled,
	]);

	// Notify parent about current search cursor position
	useEffect(() => {
		if (
			onSearchCursorChange &&
			appliedSearchQuery &&
			appliedSearchQuery.trim() &&
			selectedProcess
		) {
			const searchResults =
				selectedProcess.logBuffer.search(appliedSearchQuery);
			const sortedResults = searchResults.sort(
				(a: { lineNumber: number }, b: { lineNumber: number }) => a.lineNumber - b.lineNumber,
			);

			// Calculate the actual cursor position within search results
			let actualCursorIndex = 0;
			if (autoScroll) {
				actualCursorIndex = Math.max(
					0,
					sortedResults.length - (props.height - 3) + cursorIndex,
				);
			} else {
				actualCursorIndex = searchViewStartIndex + cursorIndex;
			}

			onSearchCursorChange(actualCursorIndex, sortedResults);
		}
	}, [cursorIndex, searchViewStartIndex, appliedSearchQuery, autoScroll]);

	const linesPerPage = props.height - 3;

	if (!selectedProcess) {
		return null;
	}

	// Helper function to get the absolute line number for the current cursor position
	const getCurrentAbsoluteLine = () => {
		if (!selectedProcess) return 0;

		if (autoScroll) {
			const oldestLine =
				selectedProcess.logBuffer.getOldestAvailableLineNumber();
			const totalLines = selectedProcess.logBuffer.getTotalLines();
			const viewStart = oldestLine + Math.max(0, totalLines - linesPerPage);
			return viewStart + cursorIndex;
		} else {
			return viewStartLine + cursorIndex;
		}
	};

	// Helper function to get the absolute line number for a given view index
	const getAbsoluteLineForIndex = (index: number) => {
		if (!selectedProcess) return 0;

		if (autoScroll) {
			const oldestLine =
				selectedProcess.logBuffer.getOldestAvailableLineNumber();
			const totalLines = selectedProcess.logBuffer.getTotalLines();
			const viewStart = oldestLine + Math.max(0, totalLines - linesPerPage);
			return viewStart + index;
		} else {
			return viewStartLine + index;
		}
	};

	// Helper function to check if a line at given view index is selected
	const isLineSelected = (index: number) => {
		if (!isSelectMode) return false;

		// When showing search results, use view indices
		if (currentSearchQuery && currentSearchQuery.trim()) {
			const selectionStart = Math.min(selectionStartViewIndex, cursorIndex);
			const selectionEnd = Math.max(selectionStartViewIndex, cursorIndex);
			return index >= selectionStart && index <= selectionEnd;
		} else {
			// Original behavior for non-search mode
			const currentAbsoluteLine = getCurrentAbsoluteLine();
			const lineAbsolutePosition = getAbsoluteLineForIndex(index);

			const selectionStart = Math.min(
				selectionStartAbsoluteLine,
				currentAbsoluteLine,
			);
			const selectionEnd = Math.max(
				selectionStartAbsoluteLine,
				currentAbsoluteLine,
			);

			return (
				lineAbsolutePosition >= selectionStart &&
				lineAbsolutePosition <= selectionEnd
			);
		}
	};

	const getSelectedLinesText = () => {
		if (!selectedProcess) return "";

		// When showing search results, work with the filtered logs array
		if (currentSearchQuery && currentSearchQuery.trim()) {
			const currentIndex = cursorIndex;
			const selectionStartIndex = Math.min(
				selectionStartViewIndex || 0,
				currentIndex,
			);
			const selectionEndIndex = Math.max(
				selectionStartViewIndex || 0,
				currentIndex,
			);

			const selectedLines = [];
			for (let i = selectionStartIndex; i <= selectionEndIndex; i++) {
				if (logs[i]) {
					selectedLines.push(logs[i]);
				}
			}
			return selectedLines.join("\n");
		} else {
			// Original behavior for non-search mode
			const currentAbsoluteLine = getCurrentAbsoluteLine();
			const selectionStart = Math.min(
				selectionStartAbsoluteLine,
				currentAbsoluteLine,
			);
			const selectionEnd = Math.max(
				selectionStartAbsoluteLine,
				currentAbsoluteLine,
			);

			const selectionCount = selectionEnd - selectionStart + 1;
			const selectedLines =
				selectedProcess.logBuffer.getLinesByAbsolutePosition(
					selectionStart,
					selectionCount,
				);

			return selectedLines.join("\n");
		}
	};

	const copyToClipboard = async (text: string, indicatorText: string) => {
		try {
			await $`echo ${text} | pbcopy`;
			showCopyFeedback(indicatorText);
		} catch (error) {
			try {
				// Fallback for non-macOS systems
				await $`echo ${text} | xclip -selection clipboard`;
				showCopyFeedback(indicatorText);
			} catch {
				showCopyFeedback("copy failed");
			}
		}
	};

	const showCopyFeedback = (message: string) => {
		setCopyIndicatorText(message);
		setShowCopyIndicator(true);
		setTimeout(() => {
			setShowCopyIndicator(false);
		}, 3_000);
	};

	let logs: string[];
	const currentSearchQuery = isSearchMode ? searchQuery : appliedSearchQuery;

	// Memoize search results to avoid repeated expensive operations
	const sortedSearchResults = useMemo(() => {
		if (!currentSearchQuery || !currentSearchQuery.trim()) return [];
		const searchResults = selectedProcess.logBuffer.search(currentSearchQuery);
		return searchResults.sort((a: { lineNumber: number }, b: { lineNumber: number }) => a.lineNumber - b.lineNumber);
	}, [currentSearchQuery, selectedProcess.logBuffer.getTotalLines()]);

	if (currentSearchQuery && currentSearchQuery.trim()) {
		if (autoScroll) {
			// In autoscroll mode, show the most recent search results
			const startIndex = Math.max(0, sortedSearchResults.length - linesPerPage);
			logs = sortedSearchResults.slice(startIndex).map((result: { text: string }) => result.text);
		} else {
			// In manual scroll mode, show results from current view position
			const startIndex = Math.min(
				searchViewStartIndex,
				Math.max(0, sortedSearchResults.length - linesPerPage),
			);
			const endIndex = Math.min(
				startIndex + linesPerPage,
				sortedSearchResults.length,
			);
			logs = sortedSearchResults
				.slice(startIndex, endIndex)
				.map((result: { text: string }) => result.text);
		}
	} else {
		// Reset search view position when not searching
		if (searchViewStartIndex > 0) {
			setSearchViewStartIndex(0);
		}

		if (autoScroll) {
			logs = selectedProcess.logBuffer.getRecentLines(linesPerPage);
		} else {
			if (!selectedProcess.logBuffer.isPositionValid(viewStartLine)) {
				// Cap viewStartLine to valid bounds instead of falling back to autoscroll
				const oldestLine =
					selectedProcess.logBuffer.getOldestAvailableLineNumber();
				const newestLine =
					selectedProcess.logBuffer.getTotalLines() + oldestLine;
				const maxStartLine = Math.max(oldestLine, newestLine - linesPerPage);
				const cappedViewStartLine = Math.min(
					Math.max(viewStartLine, oldestLine),
					maxStartLine,
				);
				setViewStartLine(cappedViewStartLine);
				logs = selectedProcess.logBuffer.getLinesByAbsolutePosition(
					cappedViewStartLine,
					linesPerPage,
				);
			} else {
				logs = selectedProcess.logBuffer.getLinesByAbsolutePosition(
					viewStartLine,
					linesPerPage,
				);
			}
		}
	}

	// Adjust cursor if it's beyond available logs
	if (logs.length > 0 && cursorIndex >= logs.length) {
		setCursorIndex(Math.max(0, logs.length - 1));
	}

	useInput(async (input, key) => {
		// Ignore all input when in search mode - let LogPage handle it
		if (isSearchMode) {
			return;
		}

		// Handle number input for vim-style prefixes
		if (/^[0-9]$/.test(input)) {
			setNumberPrefix((prev) => prev + input);
			return;
		}

		if (input === "q") {
			await killAllProcesses();
			process.exit(0);
		}

		// Handle copy functionality with 'y'
		if (input === "y" && !waitingForSecondG) {
			if (isSelectMode) {
				// Copy all selected lines
				const selectedText = getSelectedLinesText();
				if (selectedText) {
					const lineCount = selectedText.split("\n").length;
					await copyToClipboard(selectedText, `copied ${lineCount} lines`);
					// Exit select mode after copying
					setIsSelectMode(false);
					onSelectModeChange?.(false);
					setSelectionStartAbsoluteLine(0);
					setSelectionStartViewIndex(0);
				}
			} else {
				// Copy current line
				const currentLine = logs[cursorIndex];
				if (currentLine) {
					await copyToClipboard(currentLine, "copied line");
				}
			}
			setNumberPrefix("");
			return;
		}

		// Handle select mode toggle
		if (input === "v" && !waitingForSecondG) {
			if (!isSelectMode) {
				// Enter select mode - record current position
				setIsSelectMode(true);
				onSelectModeChange?.(true);
				setSelectionStartAbsoluteLine(getCurrentAbsoluteLine());
				setSelectionStartViewIndex(cursorIndex);
			}
			setNumberPrefix("");
			return;
		} else if (key.escape && isSelectMode) {
			// Exit select mode with backspace
			setIsSelectMode(false);
			onSelectModeChange?.(false);
			setSelectionStartAbsoluteLine(0); // Clear selection
			setSelectionStartViewIndex(0);
			setNumberPrefix("");
			setWaitingForSecondG(false);
			return;
		}

		// Get the repeat count from number prefix (default to 1)
		const repeatCount = numberPrefix
			? Math.max(1, parseInt(numberPrefix, 10))
			: 1;

		// Handle 'g' sequence for vim-style navigation
		if (input === "g") {
			if (waitingForSecondG) {
				// This is 'gg' - jump to beginning
				if (selectedProcess) {
					if (currentSearchQuery && currentSearchQuery.trim()) {
						// When search is active, jump to first search result
						setSearchViewStartIndex(0);
						setCursorIndex(0);
						setAutoScroll(false);
					} else {
						// Normal behavior for non-search mode
						const oldestLine =
							selectedProcess.logBuffer.getOldestAvailableLineNumber();
						setViewStartLine(oldestLine);
						setCursorIndex(0);
						setAutoScroll(false);
					}
				}
				setWaitingForSecondG(false);
				setNumberPrefix("");
			} else {
				// First 'g' - wait for second 'g'
				setWaitingForSecondG(true);
			}
			return;
		} else if (key.shift && input === "G") {
			// Shift+G - jump to end
			if (selectedProcess) {
				if (currentSearchQuery && currentSearchQuery.trim()) {
					// When search is active, jump to last search result
					const maxStartIndex = Math.max(
						0,
						sortedSearchResults.length - linesPerPage,
					);
					setSearchViewStartIndex(maxStartIndex);
					setCursorIndex(
						Math.min(
							linesPerPage - 1,
							sortedSearchResults.length - maxStartIndex - 1,
						),
					);
					setAutoScroll(true); // Jump to end enables autoscroll
				} else {
					// Normal behavior for non-search mode
					const newestLine =
						selectedProcess.logBuffer.getOldestAvailableLineNumber() +
						selectedProcess.logBuffer.getTotalLines();
					const maxStartLine = Math.max(0, newestLine - linesPerPage);
					setViewStartLine(maxStartLine);
					setCursorIndex(
						Math.min(
							linesPerPage - 1,
							selectedProcess.logBuffer.getTotalLines() - 1,
						),
					);
					setAutoScroll(true); // Jump to end enables autoscroll
				}
			}
			setWaitingForSecondG(false);
			setNumberPrefix("");
			return;
		}

		// Clear waiting state if any other key is pressed
		if (waitingForSecondG) {
			setWaitingForSecondG(false);
		}

		if (input === "s") {
			if (autoScroll && selectedProcess) {
				const oldestLine =
					selectedProcess.logBuffer.getOldestAvailableLineNumber();
				const currentBufferSize = selectedProcess.logBuffer.getTotalLines();
				const absoluteStartLine =
					oldestLine + Math.max(0, currentBufferSize - linesPerPage);
				setViewStartLine(absoluteStartLine);
			}
			setAutoScroll(!autoScroll);
			if (positionLost) {
				setPositionLost(false);
			}
			setNumberPrefix(""); // Clear number prefix
		} else if (key.upArrow || input === "k") {
			if (currentSearchQuery && currentSearchQuery.trim()) {
				// In search mode, handle navigation through search results
				if (autoScroll) {
					// In autoscroll mode, move cursor up within visible lines
					setCursorIndex((prev) => Math.max(0, prev - repeatCount));
				} else {
					// In manual scroll mode, move cursor or scroll through search results
					let remainingMoves = repeatCount;
					let newCursorIndex = cursorIndex;
					let newSearchViewStart = searchViewStartIndex;

					while (remainingMoves > 0) {
						if (newCursorIndex > 0) {
							newCursorIndex--;
							remainingMoves--;
						} else if (newSearchViewStart > 0) {
							// Cursor is at top, scroll up through search results
							newSearchViewStart--;
							remainingMoves--;
						} else {
							// Can't move up anymore
							break;
						}
					}

					setCursorIndex(newCursorIndex);
					if (newSearchViewStart !== searchViewStartIndex) {
						setSearchViewStartIndex(newSearchViewStart);
					}
				}
			} else if (autoScroll) {
				// In autoscroll mode, move cursor up within visible lines
				setCursorIndex((prev) => Math.max(0, prev - repeatCount));
			} else {
				// In manual scroll mode, move cursor or scroll if at edge
				let remainingMoves = repeatCount;
				let newCursorIndex = cursorIndex;
				let newViewStart = viewStartLine;

				while (remainingMoves > 0) {
					if (newCursorIndex > 0) {
						newCursorIndex--;
						remainingMoves--;
					} else if (selectedProcess) {
						// Cursor is at top, try to scroll up
						const oldestLine =
							selectedProcess.logBuffer.getOldestAvailableLineNumber();
						const possibleNewViewStart = Math.max(oldestLine, newViewStart - 1);
						if (possibleNewViewStart !== newViewStart) {
							newViewStart = possibleNewViewStart;
							remainingMoves--;
						} else {
							// Can't scroll up anymore
							break;
						}
					} else {
						break;
					}
				}

				setCursorIndex(newCursorIndex);
				if (newViewStart !== viewStartLine) {
					setViewStartLine(newViewStart);
				}
			}
			setNumberPrefix(""); // Clear number prefix after use
		} else if (key.downArrow || input === "j") {
			if (currentSearchQuery && currentSearchQuery.trim()) {
				// In search mode, handle navigation through search results
				if (autoScroll) {
					// In autoscroll mode, move cursor down within visible lines
					const maxCursor = Math.min(linesPerPage - 1, logs.length - 1);
					setCursorIndex((prev) => Math.min(maxCursor, prev + repeatCount));
				} else {
					// In manual scroll mode, move cursor or scroll through search results
					let remainingMoves = repeatCount;
					let newCursorIndex = cursorIndex;
					let newSearchViewStart = searchViewStartIndex;

					while (remainingMoves > 0) {
						const maxCursor = Math.min(linesPerPage - 1, logs.length - 1);
						if (newCursorIndex < maxCursor) {
							newCursorIndex++;
							remainingMoves--;
						} else {
							// Cursor is at bottom, try to scroll down through search results
							const maxStartIndex = Math.max(
								0,
								sortedSearchResults.length - linesPerPage,
							);
							if (newSearchViewStart < maxStartIndex) {
								newSearchViewStart++;
								remainingMoves--;
							} else {
								// Can't move down anymore
								break;
							}
						}
					}

					setCursorIndex(newCursorIndex);
					if (newSearchViewStart !== searchViewStartIndex) {
						setSearchViewStartIndex(newSearchViewStart);
					}
				}
			} else if (autoScroll) {
				// In autoscroll mode, move cursor down within visible lines
				const maxCursor = Math.min(linesPerPage - 1, logs.length - 1);
				setCursorIndex((prev) => Math.min(maxCursor, prev + repeatCount));
			} else {
				// In manual scroll mode, move cursor or scroll if at edge
				let remainingMoves = repeatCount;
				let newCursorIndex = cursorIndex;
				let newViewStart = viewStartLine;

				while (remainingMoves > 0) {
					const maxCursor = Math.min(linesPerPage - 1, logs.length - 1);
					if (newCursorIndex < maxCursor) {
						newCursorIndex++;
						remainingMoves--;
					} else if (selectedProcess) {
						// Cursor is at bottom, try to scroll down
						const newestLine =
							selectedProcess.logBuffer.getOldestAvailableLineNumber() +
							selectedProcess.logBuffer.getTotalLines();
						const maxStartLine = newestLine - linesPerPage;
						const possibleNewViewStart = Math.min(
							maxStartLine,
							newViewStart + 1,
						);
						if (possibleNewViewStart !== newViewStart) {
							newViewStart = possibleNewViewStart;
							remainingMoves--;
						} else {
							// Can't scroll down anymore
							break;
						}
					} else {
						break;
					}
				}

				setCursorIndex(newCursorIndex);
				if (newViewStart !== viewStartLine) {
					setViewStartLine(newViewStart);
				}
			}
			setNumberPrefix(""); // Clear number prefix after use
		} else {
			// Clear number prefix on any other input
			setNumberPrefix("");
		}
	});

	return (
		<Box
			flexDirection="column"
			borderStyle="single"
			borderColor={Colors.darkGray}
			paddingX={1}
			height={props.height}
		>
			<Box justifyContent="center" borderBottom borderColor={Colors.darkGray}>
				<Text color={Colors.darkGray}>
					Autoscroll:
					<Text color={autoScroll ? Colors.brightTeal : Colors.darkGray}>
						{autoScroll ? "on" : "off"}
					</Text>
					{positionLost && (
						<Text color={Colors.brightOrange}> (position lost, returned to tail)</Text>
					)}
					{numberPrefix && (
						<Text color={Colors.brightPink}> [{numberPrefix}]</Text>
					)}
					{waitingForSecondG && <Text color={Colors.brightTeal}> [g]</Text>}
					{isSelectMode && <Text color={Colors.brightOrange}> [SELECT]</Text>}
					{isSearchMode && (
						<Text color={Colors.brightTeal}> &lt;/{searchQuery}&gt;</Text>
					)}
					{!isSearchMode && appliedSearchQuery && (
						<Text color={Colors.brightTeal}>
							{" "}
							&lt;/{appliedSearchQuery}&gt;
						</Text>
					)}
					{showCopyIndicator && (
						<Text color={Colors.brightTeal}> ✓ {copyIndicatorText}</Text>
					)}
				</Text>
			</Box>
			{logs.map((log, index) => {
				const isCursor = index === cursorIndex;
				const isSelected = isLineSelected(index);

				// Determine background color: cursor takes priority, then selection
				let backgroundColor;
				if (isCursor) {
					backgroundColor = Colors.blue; // Cursor color
				} else if (isSelected) {
					backgroundColor = Colors.darkGray; // Charcoal for selection
				}

				const textParts =
					currentSearchQuery && currentSearchQuery.trim()
						? highlightSearchTerm(log, currentSearchQuery)
						: [{ text: log, isHighlight: false }];

				return (
					<Box key={index} backgroundColor={backgroundColor}>
						<Text
							color={
								isCursor
									? "white"
									: isSelected
										? Colors.lightBlue
										: log.includes("stderr")
											? "red"
											: Colors.lightBlue
							}
							bold={isCursor}
							wrap="truncate"
						>
							{textParts.map((part, partIndex) => (
								<Text
									key={partIndex}
									color={
										part.isHighlight
											? Colors.brightOrange
											: isCursor
												? "white"
												: isSelected
													? Colors.lightBlue
													: log.includes("stderr")
														? "red"
														: Colors.lightBlue
									}
									bold={part.isHighlight || isCursor}
								>
									{part.text}
								</Text>
							))}
						</Text>
					</Box>
				);
			})}
		</Box>
	);
}

export function LogPage() {
	const { setPage } = usePage();
	const [showShortcuts, setShowShortcuts] = useState(false);
	const { selectedProcess } = useProcessManager();
	const [isSearchMode, setIsSearchMode] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [appliedSearchQuery, setAppliedSearchQuery] = useState("");
	const [viewInContextRequested, setViewInContextRequested] = useState<{
		lineNumber: number;
		requested: boolean;
	} | null>(null);
	const [currentSearchCursor, setCurrentSearchCursor] = useState(0);
	const [currentSearchResults, setCurrentSearchResults] = useState<
		Array<{ lineNumber: number; text: string }>
	>([]);
	const [isSelectMode, setIsSelectMode] = useState(false);

	const handleSearchCursorChange = useCallback(
		(
			cursorIndex: number,
			searchResults: Array<{ lineNumber: number; text: string }>,
		) => {
			setCurrentSearchCursor(cursorIndex);
			setCurrentSearchResults(searchResults);
		},
		[],
	);

	const handleViewInContextHandled = useCallback(() => {
		setViewInContextRequested(null);
	}, []);

	const handleSelectModeChange = useCallback((selectMode: boolean) => {
		setIsSelectMode(selectMode);
	}, []);

	const { stdout } = useStdout();
	const terminalHeight = stdout.rows;
	const terminalWidth = stdout.columns;

	const shortcuts = [
		"↑/↓ or j/k to move cursor",
		"[number]j/k for multi-line moves",
		"gg to jump to beginning",
		"shift+g to jump to end",
		"s to toggle autoscroll",
		"v to enter select mode",
		"/ to enter search mode",
		"o to view search result in context",
		"y to copy line/selection",
		"esc to go back",
		"backspace to go back",
		"q to quit",
	];

	useInput(async (input, key) => {
		// Handle search mode input
		if (isSearchMode) {
			if (key.escape) {
				// Exit search mode without applying
				setIsSearchMode(false);
				setSearchQuery("");
			} else if (key.return) {
				// Apply search and close search bar
				setAppliedSearchQuery(searchQuery);
				setIsSearchMode(false);
			} else if (key.backspace || key.delete) {
				// Handle backspace in search
				setSearchQuery((prev) => prev.slice(0, -1));
			} else if (input && input.length === 1 && input !== "/") {
				// Add character to search query
				setSearchQuery((prev) => prev + input);
			}
			// Always return early in search mode
			return;
		}

		// Handle search mode entry
		if (input === "/" && !key.shift) {
			setIsSearchMode(true);
			setSearchQuery("");
			return;
		}

		// Clear applied search with ESC when not in search mode
		if (key.escape && appliedSearchQuery) {
			setAppliedSearchQuery("");
			return;
		}

		// Go back to main page with ESC when not in search mode, no applied search, and not in select mode
		if (key.escape && !appliedSearchQuery && !isSelectMode) {
			setPage(ViewPage.Main);
			return;
		}

		// Handle "view in context" with 'o' key when search is applied
		if (input === "o" && appliedSearchQuery && !key.shift) {
			if (
				currentSearchResults.length > 0 &&
				currentSearchCursor < currentSearchResults.length
			) {
				const currentResult = currentSearchResults[currentSearchCursor];
				if (currentResult) {
					// Clear the search and navigate to that line
					setAppliedSearchQuery("");
					setViewInContextRequested({
						lineNumber: currentResult.lineNumber,
						requested: true,
					});
				}
			}
			return;
		}

		if (key.backspace || key.delete) {
			setPage(ViewPage.Main);
		} else if (input === "?") {
			setShowShortcuts((prev) => !prev);
		}
	});

	if (!selectedProcess) {
		return null;
	}

	return (
		<>
			<Box justifyContent="center">
				<Text>
					<Text color={Colors.teal}>Logs</Text>
					<Text color={Colors.teal}>(</Text>
					<Text color={Colors.brightPink} bold>
						{selectedProcess.name}
					</Text>
					<Text color={Colors.teal}>)</Text>
					<Text color={Colors.teal}>[</Text>
					<Text color={Colors.brightTeal}>tail</Text>
					<Text color={Colors.teal}>]</Text>
				</Text>
			</Box>
			{isSearchMode && (
				<Box paddingX={1}>
					<Text color={Colors.brightTeal}>Search: </Text>
					<Text color="white">
						{searchQuery}
						<Text color={Colors.brightTeal}>█</Text>
					</Text>
				</Box>
			)}
			<LogTable
				height={
					terminalHeight -
					6 -
					(isSearchMode ? 1 : 0) -
					getShortcutFooterHeight(
						shortcuts.length,
						terminalWidth,
						showShortcuts,
					)
				}
				isSearchMode={isSearchMode}
				searchQuery={searchQuery}
				appliedSearchQuery={appliedSearchQuery}
				viewInContextRequested={viewInContextRequested}
				onViewInContextHandled={handleViewInContextHandled}
				onSearchCursorChange={handleSearchCursorChange}
				onSelectModeChange={handleSelectModeChange}
			/>
			<ShortcutFooter shortcuts={shortcuts} showShortcuts={showShortcuts} />
		</>
	);
}
