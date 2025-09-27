import { Box, Text, useInput, useStdout } from "ink";
import { useEffect, useState } from "react";

import { usePage, ViewPage } from "./usePage";
import { useProcessManager } from "./useProcessManager";
import { Colors } from "./colors";
import { ShortcutFooter } from "./shortcutFooter";

function ProcessTable() {
	const { processes, selectedProcessIdx } = useProcessManager();
	const [, forceUpdate] = useState(0);
	const { stdout } = useStdout();

	// Calculate dynamic column widths
	const terminalWidth = stdout?.columns ?? 80;
	const fixedColumnsWidth = 10 + 2 + 8 + 2 + 8; // STATUS + margin + READY + margin + AGE
	const borderAndPadding = 4; // border + padding
	const nameColumnWidth = Math.max(20, terminalWidth - fixedColumnsWidth - borderAndPadding);

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
				<Box width={nameColumnWidth}>
					<Text bold>NAME</Text>
				</Box>
				<Box width={10} marginLeft={2}>
					<Text bold>STATUS</Text>
				</Box>
				<Box width={8} marginLeft={2}>
					<Text bold>READY</Text>
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
						<Box width={nameColumnWidth}>
							<Text
								color={isSelected ? "white" : Colors.blue}
								bold={isSelected}
							>
								{process.name.length > nameColumnWidth - 2
									? process.name.slice(0, nameColumnWidth - 3) + "…"
									: process.name}
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
						<Box width={8} marginLeft={2}>
							<Text
								color={isSelected ? "white" : Colors.blue}
								bold={isSelected}
							>
								{process.readinessProbe === undefined || process.status === "killed"
									? "-"
									: process.status === "error" && process.readinessProbe
									? "x"
									: process.isReady === undefined
									? "?"
									: process.isReady
									? "✓"
									: "✗"}
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

export function MainPage() {
	const {
		processes,
		setSelectedProcessIdx,
		restartSelectedProcess,
		killAllProcesses,
		killSelectedProcess,
	} = useProcessManager();

	const { setPage } = usePage();
	const [showShortcuts, setShowShortcuts] = useState(false);

	const shortcuts = [
		"↑/↓ or j/k to navigate",
		"enter/l to show logs",
		"shift+r to restart process",
		"shift+k to kill process",
		"q to quit",
	];

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
		} else if (input === "l" || key.return) {
			setPage(ViewPage.Logs);
		}
	});

	return (
		<>
			<ProcessTable />
			<ShortcutFooter shortcuts={shortcuts} showShortcuts={showShortcuts} />
		</>
	);
}
