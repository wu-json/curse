import { useState, useEffect } from "react";
import { render, Text } from "ink";
import type { MarionetteConfig } from "./parser";

function View(props: { config: MarionetteConfig }) {
	return <Text color="red">deez nutz</Text>;
}

export function renderView(config: MarionetteConfig) {
	render(<View config={config} />);
}
