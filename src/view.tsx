import { Box, render, Text, useInput, useStdout } from "ink";
import { useEffect, useState } from "react";

import { useProcessManager } from "./process";
import type { MarionetteConfig } from "./parser";
import { useAltScreen } from "./hooks";
import { ProcessManagerProvider } from "./process";
import { version } from "./version";
import { usePage, PageProvider, ViewPage } from "./usePage";

const Colors = {
	primary: "#a855f7",
	darkGray: "#6b7280",
	blue: "#3b82f6",
	lightBlue: "#60a5fa",
	teal: "#4dd0a3",
	brightTeal: "#5ee8b8",
	brightPink: "#ff1493",
};

function ProcessTable() {
	const { processes, selectedProcessIdx } = useProcessManager();
	const [, forceUpdate] = useState(0);

	// Force re-render every second to update age display
	useEffect(() => {
		const interval = setInterval(() => {
			forceUpdate((prev) => prev + 1);
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	return (
		<Box
			flexDirection="column"
			borderStyle="single"
			borderColor={Colors.darkGray}
		>
			<Box
				flexDirection="row"
				paddingX={1}
				borderBottom
				borderColor={Colors.darkGray}
			>
				<Box width={20}>
					<Text bold>NAME</Text>
				</Box>
				<Box width={10} marginLeft={2}>
					<Text bold>STATUS</Text>
				</Box>
				<Box width={8}>
					<Text bold>AGE</Text>
				</Box>
			</Box>
			{processes.map((process, index) => {
				const isSelected = index === selectedProcessIdx;
				return (
					<Box
						key={process.name}
						flexDirection="row"
						paddingX={1}
						backgroundColor={isSelected ? Colors.blue : undefined}
					>
						<Box width={20}>
							<Text
								color={isSelected ? "white" : Colors.blue}
								bold={isSelected}
							>
								{process.name}
							</Text>
						</Box>
						<Box width={10} marginLeft={2}>
							<Text
								color={isSelected ? "white" : Colors.blue}
								bold={isSelected}
							>
								{process.status}
							</Text>
						</Box>
						<Box width={8}>
							<Text
								color={isSelected ? "white" : Colors.blue}
								bold={isSelected}
							>
								{process.startedAt
									? (() => {
											const ageInSeconds = Math.floor(
												(Date.now() - process.startedAt.getTime()) / 1000,
											);
											if (ageInSeconds >= 3600) {
												const hours = Math.floor(ageInSeconds / 3600);
												const minutes = Math.floor((ageInSeconds % 3600) / 60);
												return `${hours}h${minutes}m`;
											} else if (ageInSeconds >= 60) {
												const minutes = Math.floor(ageInSeconds / 60);
												const seconds = ageInSeconds % 60;
												return `${minutes}m${seconds}s`;
											} else {
												return `${ageInSeconds}s`;
											}
										})()
									: "-"}
							</Text>
						</Box>
					</Box>
				);
			})}
		</Box>
	);
}

function MainPage() {
	const {
		processes,
		setSelectedProcessIdx,
		restartSelectedProcess,
		killAllProcesses,
		killSelectedProcess,
	} = useProcessManager();

	const { setPage } = usePage();
	const [showShortcuts, setShowShortcuts] = useState(false);

	useInput(async (input, key) => {
		if (key.downArrow || input === "j") {
			setSelectedProcessIdx((prev) => Math.min(prev + 1, processes.length - 1));
		} else if (key.upArrow || input === "k") {
			setSelectedProcessIdx((prev) => Math.max(prev - 1, 0));
		} else if (key.shift && input === "R") {
			await restartSelectedProcess();
		} else if (key.shift && input === "K") {
			await killSelectedProcess();
		} else if (input === "q") {
			await killAllProcesses();
			process.exit(0);
		} else if (input === "?") {
			setShowShortcuts((prev) => !prev);
		} else if (input === "l") {
			setPage(ViewPage.Logs);
		}
	});

	return (
		<>
			<ProcessTable />
			<Box marginLeft={1} flexDirection="row">
				{showShortcuts ? (
					<>
						<Box flexDirection="column" marginRight={4}>
							<Text color={Colors.darkGray}>↑/↓ or j/k to navigate</Text>
							<Text color={Colors.darkGray}>l to show logs</Text>
						</Box>
						<Box flexDirection="column">
							<Text color={Colors.darkGray}>shift+r to restart process</Text>
							<Text color={Colors.darkGray}>shift+k to kill process</Text>
							<Text color={Colors.darkGray}>q to quit</Text>
						</Box>
					</>
				) : (
					<Text color={Colors.darkGray}>? for shortcuts</Text>
				)}
			</Box>
		</>
	);
}

function LogPage() {
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

function View(props: { config: MarionetteConfig }) {
	const { isReady } = useAltScreen();
	const { runPendingProcesses, killAllProcesses } = useProcessManager();
	const { page } = usePage();

	useInput(async (input, key) => {
		if (key.ctrl && input === "c") {
			await killAllProcesses();
			process.exit(0);
		}
	});

	useEffect(() => {
		runPendingProcesses();
	}, []);

	if (!isReady) {
		return null;
	}

	return (
		<Box flexDirection="column">
			<Box flexDirection="row">
				<Text bold color={Colors.primary}>
					Marionette 🎭
				</Text>
				<Text color={Colors.darkGray}> v{version}</Text>
			</Box>
			<Box flexDirection="row">
				<Text color={Colors.primary}>Config: </Text>
				<Text>{props.config.name}</Text>
			</Box>
			{(() => {
				switch (page) {
					case ViewPage.Main: {
						return <MainPage />;
					}
					case ViewPage.Logs: {
						return <LogPage />;
					}
					default:
						return null;
				}
			})()}
		</Box>
	);
}

export function renderView(config: MarionetteConfig) {
	render(
		<ProcessManagerProvider config={config}>
			<PageProvider>
				<View config={config} />
			</PageProvider>
		</ProcessManagerProvider>,
		{ exitOnCtrlC: false },
	);
}
