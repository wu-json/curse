import { Box, render, Text } from "ink";
import type { MarionetteConfig } from "./parser";
import { useAltScreen } from "./hooks";

const Colors = {
	primary: "#800080",
};

type ProcessStatus = "idle" | "error" | "success";

type Process = {
	name: string;
	command: string;
	status: ProcessStatus;
};

function View(props: { config: MarionetteConfig }) {
	const { isReady } = useAltScreen();

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
			<Box borderStyle="single">
				<Text>hi</Text>
			</Box>
		</Box>
	);
}

export function renderView(config: MarionetteConfig) {
	render(<View config={config} />);
}
