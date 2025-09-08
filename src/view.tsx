import { Box, render, Text, useInput } from "ink";

import { useProcessManager } from "./process";
import type { MarionetteConfig } from "./parser";
import { useAltScreen } from "./hooks";
import { ProcessManagerProvider } from "./process";

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
				<Box flexGrow={1}>
					<Text bold>CMD</Text>
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
						<Box flexGrow={1}>
							<Text
								color={isSelected ? "white" : Colors.blue}
								bold={isSelected}
							>
								{process.command}
							</Text>
						</Box>
						<Box width={8}>
							<Text
								color={isSelected ? "white" : Colors.darkGray}
								bold={isSelected}
							>
								{process.startedAt
									? `${Math.floor((Date.now() - process.startedAt.getTime()) / 1000)}s`
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
	const { processes, setSelectedProcessIdx } = useProcessManager();

	useInput((input, key) => {
		if (key.downArrow || input === "j") {
			setSelectedProcessIdx((prev) => Math.min(prev + 1, processes.length - 1));
		} else if (key.upArrow || input === "k") {
			setSelectedProcessIdx((prev) => Math.max(prev - 1, 0));
		}
	});

	if (!isReady) {
		return null;
	}

	return (
		<Box flexDirection="column">
			<Text bold color={Colors.primary}>
				Marionette 🎭
			</Text>
			<Box flexDirection="row">
				<Text color={Colors.primary}>Config: </Text>
				<Text>{props.config.name}</Text>
			</Box>
			<ProcessTable />
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
