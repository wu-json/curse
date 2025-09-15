import { Box, Text, useInput, useStdout } from "ink";
import { useEffect, useState } from "react";

import { usePage, ViewPage } from "./usePage";
import { useProcessManager } from "./useProcessManager";
import { Colors } from "./colors";

function LogTable(props: { height: number }) {
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
	};

	let logs: string[];
	if (autoScroll) {
		logs = selectedProcess.logBuffer.getRecentLines(linesPerPage);
	} else {
		if (!selectedProcess.logBuffer.isPositionValid(viewStartLine)) {
			setPositionLost(true);
			setAutoScroll(true);
			logs = selectedProcess.logBuffer.getRecentLines(linesPerPage);
		} else {
			logs = selectedProcess.logBuffer.getLinesByAbsolutePosition(
				viewStartLine,
				linesPerPage,
			);
		}
	}

	useInput(async (input, key) => {
		// Handle number input for vim-style prefixes
		if (/^[0-9]$/.test(input)) {
			setNumberPrefix((prev) => prev + input);
			return;
		}

		if (input === "q") {
			await killAllProcesses();
			process.exit(0);
		}

		// Handle select mode toggle
		if (input === "v" && !waitingForSecondG) {
			if (!isSelectMode) {
				// Enter select mode - record current position
				setIsSelectMode(true);
				setSelectionStartAbsoluteLine(getCurrentAbsoluteLine());
			}
			setNumberPrefix("");
			return;
		} else if (key.escape && isSelectMode) {
			// Exit select mode with backspace
			setIsSelectMode(false);
			setSelectionStartAbsoluteLine(0); // Clear selection
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
					const oldestLine =
						selectedProcess.logBuffer.getOldestAvailableLineNumber();
					setViewStartLine(oldestLine);
					setCursorIndex(0);
					setAutoScroll(false);
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
							{log}
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

	const { stdout } = useStdout();
	const terminalHeight = stdout.rows;
	const terminalWidth = stdout.columns;

	useInput(async (input, key) => {
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
			<LogTable
				height={
					terminalHeight -
					6 -
					(showShortcuts
						? (() => {
								// Calculate number of columns based on terminal width
								let columns;
								if (terminalWidth < 80) columns = 1;
								else if (terminalWidth < 120) columns = 2;
								else if (terminalWidth < 160) columns = 3;
								else columns = 4;
								return Math.ceil(8 / columns);
							})()
						: 0)
				}
			/>
			<Box marginLeft={1} flexDirection="row">
				{showShortcuts ? (
					(() => {
						const shortcuts = [
							"↑/↓ or j/k to move cursor",
							"[number]j/k for multi-line moves",
							"gg to jump to beginning",
							"shift+g to jump to end",
							"s to toggle autoscroll",
							"v to enter select mode",
							"esc to exit select mode",
							"backspace to go back",
						];

						// Calculate number of columns based on terminal width
						let numColumns;
						if (terminalWidth < 80) numColumns = 1;
						else if (terminalWidth < 120) numColumns = 2;
						else if (terminalWidth < 160) numColumns = 3;
						else numColumns = 4;

						const itemsPerColumn = Math.ceil(shortcuts.length / numColumns);

						const columns = [];
						for (let col = 0; col < numColumns; col++) {
							const startIdx = col * itemsPerColumn;
							const endIdx = Math.min(
								startIdx + itemsPerColumn,
								shortcuts.length,
							);
							const columnShortcuts = shortcuts.slice(startIdx, endIdx);

							columns.push(
								<Box key={col} flexDirection="column" marginRight={4}>
									{columnShortcuts.map((shortcut, idx) => (
										<Text key={idx} color={Colors.darkGray}>
											{shortcut}
										</Text>
									))}
								</Box>,
							);
						}

						return <>{columns}</>;
					})()
				) : (
					<Text color={Colors.darkGray}>? for shortcuts</Text>
				)}
			</Box>
		</>
	);
}
