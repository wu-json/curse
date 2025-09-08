import { Box, render, Text } from "ink";
import type { MarionetteConfig } from "./parser";
import { useAltScreen } from "./hooks";

const Colors = {
	primary: "#800080",
};

function View(props: { config: MarionetteConfig }) {
	const { isReady } = useAltScreen();

	if (!isReady) {
		return null;
	}

	return (
		<Box flexDirection="column">
			<Box flexDirection="column" padding={1} height={10}>
				<Text bold color={Colors.primary}>
					Marionette 🎭
				</Text>
				<Box flexDirection="row">
					<Text color={Colors.primary}>Config: </Text>
					<Text>{props.config.name}</Text>
				</Box>
			</Box>
		</Box>
	);
}

export function renderView(config: MarionetteConfig) {
	render(<View config={config} />);
}
