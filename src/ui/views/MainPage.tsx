import { Box, Text, useInput, useStdout } from "ink";
import { useState } from "react";

import { usePage, ViewPage } from "../../hooks/usePage";
import { useProcessManager, type Process } from "../../hooks/useProcessManager";
import { useProgramState, ProgramStatus } from "../../hooks/useProgramState";
import { useRenderTick } from "../../hooks/useRenderTick";
import { Colors } from "../../lib/Colors";
import { AggregatedSummary } from "../components/AggregatedSummary";
import { LogTailPreview } from "../components/LogTailPreview";
import { ShortcutFooter, getShortcutFooterHeight } from "../components/ShortcutFooter";

export type DisplayMode = "normal" | "compact" | "aggregated";

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

function ProcessTable(props: {
	numberPrefix: string;
	waitingForSecondG: boolean;
	compact?: boolean;
}) {
	const { processesRef, selectedProcessIdx } = useProcessManager();
	const processes = processesRef.current;
	const { stdout } = useStdout();
	const { status: programStatus } = useProgramState();

	const terminalWidth = stdout?.columns ?? 80;

	if (props.compact) {
		const compactFixedColumnsWidth = 10 + 2 + 8; // STATUS + margin + READY
		const compactNameColumnWidth = Math.max(20, terminalWidth - compactFixedColumnsWidth - 2); // 2 for paddingX

		return (
			<Box flexDirection="column">
				<Box flexDirection="row" paddingX={1}>
					<Box width={compactNameColumnWidth}>
						<Text bold dimColor>NAME</Text>
					</Box>
					<Box width={10} marginLeft={2}>
						<Text bold dimColor>STATUS</Text>
					</Box>
					<Box width={8} marginLeft={2}>
						<Text bold dimColor>READY</Text>
						{props.numberPrefix && <Text color={Colors.brightPink}> [{props.numberPrefix}]</Text>}
						{props.waitingForSecondG && <Text color={Colors.brightGreen}> [g]</Text>}
					</Box>
				</Box>
				{processes.map((process: Process, index: number) => {
					const isSelected = index === selectedProcessIdx;
					const isSuccess = process.status === "success";
					const isShutdownHookPending =
						process.type === "shutdown_hook" &&
						process.status === "pending" &&
						programStatus === ProgramStatus.Running;
					const textColor = isSelected
						? "white"
						: isSuccess
							? Colors.darkGray
							: isShutdownHookPending
								? Colors.mutedCyan
								: Colors.indigo;
					return (
						<Box
							key={process.name}
							flexDirection="row"
							paddingX={1}
							backgroundColor={isSelected ? Colors.indigo : undefined}
						>
							<Box width={compactNameColumnWidth}>
								<Text color={textColor} bold={isSelected}>
									{process.name.length > compactNameColumnWidth - 2
										? process.name.slice(0, compactNameColumnWidth - 3) + "…"
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
											color={isSelected ? "white" : isSuccess ? Colors.darkGray : color}
											bold={isSelected}
										>
											{char}
										</Text>
									);
								})()}
							</Box>
						</Box>
					);
				})}
			</Box>
		);
	}

	const fixedColumnsWidth = 10 + 2 + 8 + 2 + 8 + 2 + 8 + 2 + 8; // STATUS + margin + READY + margin + AGE + margin + MEM + margin + CPU
	const borderAndPadding = 4; // border + padding
	const nameColumnWidth = Math.max(20, terminalWidth - fixedColumnsWidth - borderAndPadding);

	return (
		<Box flexDirection="column" borderStyle="single" borderColor={Colors.darkGray}>
			<Box flexDirection="row" paddingX={1} borderBottom borderColor={Colors.darkGray}>
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
					{props.numberPrefix && <Text color={Colors.brightPink}> [{props.numberPrefix}]</Text>}
					{props.waitingForSecondG && <Text color={Colors.brightGreen}> [g]</Text>}
				</Box>
			</Box>
			{processes.map((process: Process, index: number) => {
				const isSelected = index === selectedProcessIdx;
				const isSuccess = process.status === "success";
				const isShutdownHookPending =
					process.type === "shutdown_hook" &&
					process.status === "pending" &&
					programStatus === ProgramStatus.Running;
				const textColor = isSelected
					? "white"
					: isSuccess
						? Colors.darkGray
						: isShutdownHookPending
							? Colors.mutedCyan
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
										color={isSelected ? "white" : isSuccess ? Colors.darkGray : color}
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

export function MainPage(props: { displayMode: DisplayMode }) {
	const {
		processesRef,
		setSelectedProcessIdx,
		restartSelectedProcess,
		restartAllProcesses,
		killAllProcesses,
		killSelectedProcess,
	} = useProcessManager();
	const processes = processesRef.current;

	const { setPage } = usePage();
	const { setStatus } = useProgramState();
	const [showShortcuts, setShowShortcuts] = useState(false);
	const [numberPrefix, setNumberPrefix] = useState("");
	const [waitingForSecondG, setWaitingForSecondG] = useState(false);
	const { stdout } = useStdout();

	// Force re-render every second to update age display and logs
	useRenderTick();

	const shortcuts = [
		"↑/↓ or j/k to navigate",
		"[number]j/k for multi-line moves",
		"gg to jump to beginning",
		"shift+g to jump to end",
		"enter/l to show logs",
		"shift+r to restart process",
		"shift+a to restart all",
		"shift+k to kill process",
		"shift+q to quit",
	];

	useInput(async (input, key) => {
		// Handle number input for vim-style prefixes
		if (/^[0-9]$/.test(input)) {
			setNumberPrefix((prev) => prev + input);
			return;
		}

		// Handle 'g' sequence for vim-style navigation
		if (input === "g") {
			if (waitingForSecondG) {
				// This is 'gg' - jump to beginning
				setSelectedProcessIdx(0);
				setWaitingForSecondG(false);
				setNumberPrefix("");
			} else {
				// First 'g' - wait for second 'g'
				setWaitingForSecondG(true);
			}
			return;
		} else if (key.shift && input === "G") {
			// Shift+G - jump to end
			setSelectedProcessIdx(processes.length - 1);
			setWaitingForSecondG(false);
			setNumberPrefix("");
			return;
		}

		// Clear waiting state if any other key is pressed
		if (waitingForSecondG) {
			setWaitingForSecondG(false);
		}

		// Get the repeat count from number prefix (default to 1)
		const repeatCount = numberPrefix ? Math.max(1, parseInt(numberPrefix, 10)) : 1;

		if (key.downArrow || input === "j") {
			setSelectedProcessIdx((prev: number) => Math.min(prev + repeatCount, processes.length - 1));
			setNumberPrefix("");
		} else if (key.upArrow || input === "k") {
			setSelectedProcessIdx((prev: number) => Math.max(prev - repeatCount, 0));
			setNumberPrefix("");
		} else if (key.shift && input === "R") {
			await restartSelectedProcess();
			setNumberPrefix("");
		} else if (key.shift && input === "A") {
			await restartAllProcesses();
			setNumberPrefix("");
		} else if (key.shift && input === "K") {
			await killSelectedProcess();
			setNumberPrefix("");
		} else if (key.shift && input === "Q") {
			setStatus(ProgramStatus.Quitting);
			await killAllProcesses();
			process.exit(0);
		} else if (input === "?") {
			setShowShortcuts((prev) => !prev);
			setNumberPrefix("");
		} else if (input === "l" || key.return) {
			setPage(ViewPage.Logs);
			setNumberPrefix("");
		} else {
			// Clear number prefix on any other input
			setNumberPrefix("");
		}
	});

	if (props.displayMode === "aggregated") {
		return (
			<Box flexDirection="column">
				<AggregatedSummary numberPrefix={numberPrefix} waitingForSecondG={waitingForSecondG} />
			</Box>
		);
	}

	if (props.displayMode === "compact") {
		return (
			<Box flexDirection="column">
				<ProcessTable numberPrefix={numberPrefix} waitingForSecondG={waitingForSecondG} compact />
			</Box>
		);
	}

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
			<ProcessTable numberPrefix={numberPrefix} waitingForSecondG={waitingForSecondG} />
			<LogTailPreview height={logPreviewHeight} />
			<ShortcutFooter shortcuts={shortcuts} showShortcuts={showShortcuts} />
		</Box>
	);
}
