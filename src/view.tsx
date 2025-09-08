import { useState, useEffect } from "react";
import { Box, render, Text } from "ink";
import type { MarionetteConfig } from "./parser";
import { useAltScreen } from "./hooks";

const Colors = {
	primary: "#800080",
};

function View(props: { config: MarionetteConfig }) {
	const { isReady } = useAltScreen();
	const [counter, setCounter] = useState(0);

	useEffect(() => {
		const timer = setInterval(() => {
			setCounter((previousCounter) => previousCounter + 1);
		}, 100);

		return () => {
			clearInterval(timer);
		};
	}, []);

	if (!isReady) {
		return null;
	}
	return (
		<Box flexDirection="column">
			<Box padding={1} height={10}>
				<Text bold color={Colors.primary}>
					Marionette:{" "}
				</Text>
				<Text>{props.config.name}</Text>
			</Box>
		</Box>
	);
}

export function renderView(config: MarionetteConfig) {
	render(<View config={config} />);
}
