import { Box, render, Text, useInput } from "ink";
import { useEffect } from "react";

import type { CurseConfig } from "../parser";
import { Colors } from "./colors";
import { LogPage } from "./logPage";
import { MainPage } from "./mainPage";
import { ProcessManagerProvider } from "./useProcessManager";
import { useAltScreen } from "./useAltScreen";
import { usePage, PageProvider, ViewPage } from "./usePage";
import { useProcessManager } from "./useProcessManager";
import { version } from "../version";

function View(props: { config: CurseConfig }) {
	const { isReady } = useAltScreen();
	const { runPendingProcesses, killAllProcesses } = useProcessManager();
	const { page } = usePage();

	useInput(async (input, key) => {
		if (key.ctrl && input === "c") {
			await killAllProcesses();
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
					Curse 🕯
				</Text>
				<Text color={Colors.darkGray}> v{version}</Text>
			</Box>
			<Box flexDirection="row">
				<Text color={Colors.primary}>Config: </Text>
				<Text>{props.config.fileName}</Text>
			</Box>
			{(() => {
				switch (page) {
					case ViewPage.Main: {
						return <MainPage />;
					}
					case ViewPage.Logs: {
						return <LogPage />;
					}
					default:
						return null;
				}
			})()}
		</Box>
	);
}

export function renderView(config: CurseConfig) {
	render(
		<ProcessManagerProvider config={config}>
			<PageProvider>
				<View config={config} />
			</PageProvider>
		</ProcessManagerProvider>,
		{ exitOnCtrlC: false },
	);
}
