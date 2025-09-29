import { Box, Text, useInput, useStdout } from "ink";
import { useEffect, useState } from "react";

import { usePage, ViewPage } from "../../hooks/usePage";
import { useProcessManager, type Process, type ProcessType } from "../../hooks/useProcessManager";
import { Colors } from "../../lib/Colors";
import {
	ShortcutFooter,
	getShortcutFooterHeight,
} from "../components/ShortcutFooter";
import { LogTailPreview } from "../components/LogTailPreview";

function getReadinessDisplay(process: Process): {
	char: string;
	color: string;
} {
	const char =
		process.readinessProbe === undefined ||
		process.status === "killed" ||
		process.status === "pending"
			? "-"
			: process.status === "starting" && process.readinessProbe
				? "-"
				: process.status === "error" && process.readinessProbe
					? "x"
					: process.isReady === undefined
						? "?"
						: process.isReady
							? "✓"
							: "✗";

	const color =
		char === "x" || char === "✗"
			? "red"
			: char === "✓"
				? Colors.green
				: char === "-"
					? Colors.darkGray
					: Colors.indigo;

	return { char, color };
}

function ProcessTable() {
	const { processes, selectedProcessIdx } = useProcessManager();
	const [, forceUpdate] = useState(0);
	const { stdout } = useStdout();

	const terminalWidth = stdout?.columns ?? 80;
	const fixedColumnsWidth = 10 + 2 + 8 + 2 + 8 + 2 + 8 + 2 + 8; // STATUS + margin + READY + margin + AGE + margin + MEM + margin + CPU
	const borderAndPadding = 4; // border + padding
	const nameColumnWidth = Math.max(
		20,
		terminalWidth - fixedColumnsWidth - borderAndPadding,
	);

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
				<Box width={8} marginLeft={2}>
					<Text bold>AGE</Text>
				</Box>
				<Box width={8} marginLeft={2}>
					<Text bold>MEM</Text>
				</Box>
				<Box width={8} marginLeft={2}>
					<Text bold>CPU</Text>
				</Box>
			</Box>
			{processes.map((process: Process, index: number) => {
				const isSelected = index === selectedProcessIdx;
				const isSuccess = process.status === "success";
				const textColor = isSelected
					? "white"
					: isSuccess
						? Colors.darkGray
						: Colors.indigo;
				return (
					<Box
						key={process.name}
						flexDirection="row"
						paddingX={1}
						backgroundColor={isSelected ? Colors.indigo : undefined}
					>
						<Box width={nameColumnWidth}>
							<Text color={textColor} bold={isSelected}>
								{process.name.length > nameColumnWidth - 2
									? process.name.slice(0, nameColumnWidth - 3) + "…"
									: process.name}
							</Text>
						</Box>
						<Box width={10} marginLeft={2}>
							<Text color={textColor} bold={isSelected}>
								{process.status}
							</Text>
						</Box>
						<Box width={8} marginLeft={2}>
							{(() => {
								const { char, color } = getReadinessDisplay(process);
								return (
									<Text
										color={
											isSelected ? "white" : isSuccess ? Colors.darkGray : color
										}
										bold={isSelected}
									>
										{char}
									</Text>
								);
							})()}
						</Box>
						<Box width={8} marginLeft={2}>
							<Text color={textColor} bold={isSelected}>
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
						<Box width={8} marginLeft={2}>
							<Text
								color={
									isSelected
										? "white"
										: isSuccess
											? Colors.darkGray
											: process.profile?.memoryUsageMB !== undefined
												? Colors.indigo
												: Colors.darkGray
								}
								bold={isSelected}
							>
								{process.profile?.memoryUsageMB !== undefined
									? `${process.profile.memoryUsageMB}MB`
									: "-"}
							</Text>
						</Box>
						<Box width={8} marginLeft={2}>
							<Text
								color={
									isSelected
										? "white"
										: isSuccess
											? Colors.darkGray
											: process.profile?.cpuUsagePercent !== undefined
												? Colors.indigo
												: Colors.darkGray
								}
								bold={isSelected}
							>
								{process.profile?.cpuUsagePercent !== undefined
									? `${process.profile.cpuUsagePercent.toFixed(1)}%`
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
	const { stdout } = useStdout();

	const shortcuts = [
		"↑/↓ or j/k to navigate",
		"enter/l to show logs",
		"shift+r to restart process",
		"shift+k to kill process",
		"shift+q to quit",
	];

	useInput(async (input, key) => {
		if (key.downArrow || input === "j") {
			setSelectedProcessIdx((prev: number) =>
				Math.min(prev + 1, processes.length - 1),
			);
		} else if (key.upArrow || input === "k") {
			setSelectedProcessIdx((prev: number) => Math.max(prev - 1, 0));
		} else if (key.shift && input === "R") {
			await restartSelectedProcess();
		} else if (key.shift && input === "K") {
			await killSelectedProcess();
		} else if (key.shift && input === "Q") {
			await killAllProcesses();
			process.exit(0);
		} else if (input === "?") {
			setShowShortcuts((prev) => !prev);
		} else if (input === "l" || key.return) {
			setPage(ViewPage.Logs);
		}
	});

	const terminalHeight = stdout?.rows ?? 24;
	const terminalWidth = stdout?.columns ?? 80;

	const shortcutFooterHeight = getShortcutFooterHeight(
		shortcuts.length,
		terminalWidth,
		showShortcuts,
	);

	const processTableHeight = processes.length + 3;

	const headerHeight = 4;
	const availableForLogs =
		terminalHeight - headerHeight - processTableHeight - shortcutFooterHeight;
	const logPreviewHeight = Math.max(4, availableForLogs - 1);

	return (
		<Box flexDirection="column">
			<ProcessTable />
			<LogTailPreview height={logPreviewHeight} />
			<ShortcutFooter shortcuts={shortcuts} showShortcuts={showShortcuts} />
		</Box>
	);
}
