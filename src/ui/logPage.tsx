import { Box, Text, useInput, useStdout } from "ink";
import { useEffect, useState } from "react";
import { $ } from "bun";

import { usePage, ViewPage } from "./usePage";
import { useProcessManager } from "./useProcessManager";
import { Colors } from "./colors";
import { ShortcutFooter, getShortcutFooterHeight } from "./shortcutFooter";

function LogTable(props: {
	height: number;
	isSearchMode: boolean;
	searchQuery: string;
	appliedSearchQuery: string;
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
	const [showCopyIndicator, setShowCopyIndicator] = useState(false);
	const [copyIndicatorText, setCopyIndicatorText] = useState("");
	const { isSearchMode, searchQuery, appliedSearchQuery } = props;

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
	if (currentSearchQuery && currentSearchQuery.trim()) {
		// When search is active (typing) or applied, show search results
		const searchResults = selectedProcess.logBuffer.search(currentSearchQuery);
		const sortedResults = searchResults.sort((a, b) => a.lineNumber - b.lineNumber);

		if (autoScroll) {
			// In autoscroll mode with search, show the most recent search results
			logs = sortedResults
				.slice(-linesPerPage) // Take the last N results (most recent)
				.map(result => result.text);
		} else {
			// In manual scroll mode with search, show results from a specific position
			// For now, just show first N results (this could be enhanced later)
			logs = sortedResults
				.slice(0, linesPerPage)
				.map(result => result.text);
		}
	} else if (autoScroll) {
		logs = selectedProcess.logBuffer.getRecentLines(linesPerPage);
	} else {
		if (!selectedProcess.logBuffer.isPositionValid(viewStartLine)) {
			// Cap viewStartLine to valid bounds instead of falling back to autoscroll
			const oldestLine =
				selectedProcess.logBuffer.getOldestAvailableLineNumber();
			const newestLine = selectedProcess.logBuffer.getTotalLines() + oldestLine;
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
				setSelectionStartAbsoluteLine(getCurrentAbsoluteLine());
				setSelectionStartViewIndex(cursorIndex);
			}
			setNumberPrefix("");
			return;
		} else if (key.escape && isSelectMode) {
			// Exit select mode with backspace
			setIsSelectMode(false);
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
					if (appliedSearchQuery && appliedSearchQuery.trim()) {
						// When search is applied, jump to first search result
						setCursorIndex(0);
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
				if (appliedSearchQuery && appliedSearchQuery.trim()) {
					// When search is applied, jump to last search result
					setCursorIndex(Math.max(0, logs.length - 1));
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
			if (autoScroll) {
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
			if (autoScroll) {
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
					<Text color={autoScroll ? "green" : "#4b5563"}>
						{autoScroll ? "on" : "off"}
					</Text>
					{positionLost && (
						<Text color="#fbbf24"> (position lost, returned to tail)</Text>
					)}
					{numberPrefix && (
						<Text color={Colors.brightPink}> [{numberPrefix}]</Text>
					)}
					{waitingForSecondG && <Text color={Colors.brightTeal}> [g]</Text>}
					{isSelectMode && <Text color="#fbbf24"> [SELECT]</Text>}
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
						<Text color="green"> ✓ {copyIndicatorText}</Text>
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
					backgroundColor = "#374151"; // Gray-700 for selection
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
		"y to copy line/selection",
		"esc to exit select/search mode",
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
			/>
			<ShortcutFooter shortcuts={shortcuts} showShortcuts={showShortcuts} />
		</>
	);
}
