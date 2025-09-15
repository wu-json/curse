import { Box, Text, useInput, useStdout } from "ink";
import { useEffect, useState } from "react";

import { usePage, ViewPage } from "./usePage";
import { useProcessManager } from "./useProcessManager";
import { Colors } from "./colors";

function LogTable(props: { height: number }) {
	const { selectedProcess } = useProcessManager();
	const [, forceUpdate] = useState(0);
	const [autoScroll, setAutoScroll] = useState(true);
	const [viewStartLine, setViewStartLine] = useState(0);
	const [positionLost, setPositionLost] = useState(false);

	// Force re-render every second to update logs and check position validity
	useEffect(() => {
		const interval = setInterval(() => {
			forceUpdate((prev) => prev + 1);
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	const linesPerPage = props.height - 3;

	useInput(async (input, key) => {
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
		} else if (!autoScroll) {
			if (key.upArrow || input === "k") {
				if (selectedProcess) {
					const oldestLine =
						selectedProcess.logBuffer.getOldestAvailableLineNumber();
					setViewStartLine((prev) => Math.max(oldestLine, prev - 1));
				}
			} else if (key.downArrow || input === "j") {
				if (selectedProcess) {
					const newestLine =
						selectedProcess.logBuffer.getOldestAvailableLineNumber() +
						selectedProcess.logBuffer.getTotalLines();
					const maxStartLine = newestLine - linesPerPage;
					setViewStartLine((prev) => Math.min(maxStartLine, prev + 1));
				}
			}
		}
	});

	if (!selectedProcess) {
		return null;
	}

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
				</Text>
			</Box>
			{logs.map((log, index) => (
				<Text
					key={index}
					color={log.includes("stderr") ? "red" : Colors.lightBlue}
					wrap="truncate"
				>
					{log}
				</Text>
			))}
		</Box>
	);
}

export function LogPage() {
	const { setPage } = usePage();
	const [showShortcuts, setShowShortcuts] = useState(false);
	const { selectedProcess } = useProcessManager();

	const { stdout } = useStdout();
	const terminalHeight = stdout.rows;

	useInput(async (input, key) => {
		if (key.escape) {
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
			<LogTable height={terminalHeight - 6} />
			<Box marginLeft={1} flexDirection="row">
				{showShortcuts ? (
					<>
						<Box flexDirection="column" marginRight={4}>
							<Text color={Colors.darkGray}>↑/↓ or j/k to navigate</Text>
							<Text color={Colors.darkGray}>s to toggle autoscroll</Text>
						</Box>
						<Box flexDirection="column">
							<Text color={Colors.darkGray}>esc to go back</Text>
						</Box>
					</>
				) : (
					<Text color={Colors.darkGray}>? for shortcuts</Text>
				)}
			</Box>
		</>
	);
}
