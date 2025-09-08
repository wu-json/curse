import { useState, useEffect } from "react";
import { render, Text } from "ink";
import type { MarionetteConfig } from "./parser";
import { useAltScreen } from "./hooks";

function View(props: { config: MarionetteConfig }) {
	useAltScreen();

	const [counter, setCounter] = useState(0);

	useEffect(() => {
		const timer = setInterval(() => {
			setCounter((previousCounter) => previousCounter + 1);
		}, 100);

		return () => {
			clearInterval(timer);
		};
	}, []);

	return <Text color="green">{counter} tests passed</Text>;
}

export function renderView(config: MarionetteConfig) {
	render(<View config={config} />);
}
