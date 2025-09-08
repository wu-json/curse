import { Box, render, Text, useInput } from "ink";

import { useProcessManager } from "./process";
import type { MarionetteConfig } from "./parser";
import { useAltScreen } from "./hooks";
import { ProcessManagerProvider } from "./process";
import { useEffect } from "react";
import { version } from "./version";

const Colors = {
	primary: "#a855f7",
	darkGray: "#374151",
	blue: "#3b82f6",
};

function ProcessTable() {
	const { processes, selectedProcessIdx } = useProcessManager();
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
												return `${hours}h`;
											} else if (ageInSeconds >= 60) {
												const minutes = Math.floor(ageInSeconds / 60);
												return `${minutes}m`;
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

function View(props: { config: MarionetteConfig }) {
	const { isReady } = useAltScreen();
	const { processes, setSelectedProcessIdx, runPendingProcesses } =
		useProcessManager();

	useInput((input, key) => {
		if (key.downArrow || input === "j") {
			setSelectedProcessIdx((prev) => Math.min(prev + 1, processes.length - 1));
		} else if (key.upArrow || input === "k") {
			setSelectedProcessIdx((prev) => Math.max(prev - 1, 0));
		} else if (input === "q") {
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
			<ProcessTable />
			<Box marginTop={1} marginLeft={1} flexDirection="row">
				<Box flexDirection="column" marginRight={4}>
					<Text color={Colors.darkGray}>↑/↓ or j/k to navigate</Text>
					<Text color={Colors.darkGray}>l for logs</Text>
				</Box>
				<Box flexDirection="column">
					<Text color={Colors.darkGray}>r to restart process</Text>
					<Text color={Colors.darkGray}>q to quit</Text>
				</Box>
			</Box>
		</Box>
	);
}

export function renderView(config: MarionetteConfig) {
	render(
		<ProcessManagerProvider config={config}>
			<View config={config} />
		</ProcessManagerProvider>,
	);
}
