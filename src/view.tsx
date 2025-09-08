import { Box, render, Text } from "ink";
import { useState } from "react";
import type { MarionetteConfig } from "./parser";
import { useAltScreen } from "./hooks";

const Colors = {
	primary: "#800080",
	darkGray: "#374151",
};

type ProcessStatus = "idle" | "error" | "success";

type Process = {
	name: string;
	command: string;
	status: ProcessStatus;
};

function ProcessTable(props: { processes: Process[] }) {
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
				<Text bold>NAME</Text>
				<Box width={20} />
				<Text bold>CMD</Text>
			</Box>
			{props.processes.map((process) => (
				<Box key={process.name} flexDirection="row" paddingX={1}>
					<Box width={20}>
						<Text>{process.name}</Text>
					</Box>
					<Text color={Colors.darkGray}>{process.command}</Text>
				</Box>
			))}
		</Box>
	);
}

function View(props: { config: MarionetteConfig }) {
	const { isReady } = useAltScreen();
	const [processes, setProcesses] = useState<Process[]>(
		props.config.process.map((p) => ({
			name: p.name,
			command: p.command,
			status: "idle",
		})),
	);

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
			<ProcessTable processes={processes} />
		</Box>
	);
}

export function renderView(config: MarionetteConfig) {
	render(<View config={config} />);
}
