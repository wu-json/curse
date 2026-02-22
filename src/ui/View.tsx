import { Box, render, Text, useInput, useStdout } from "ink";
import { useEffect, useState } from "react";

import { version } from "../generated/version";
import { useAltScreen } from "../hooks/useAltScreen";
import { usePage, PageProvider, ViewPage } from "../hooks/usePage";
import { ProcessManagerProvider } from "../hooks/useProcessManager";
import { useProcessManager } from "../hooks/useProcessManager";
import { ProgramStateProvider, useProgramState, ProgramStatus } from "../hooks/useProgramState";
import { Colors } from "../lib/Colors";
import type { CurseConfig } from "../parser";
import { LogPage } from "./views/LogPage";
import { MainPage, type DisplayMode } from "./views/MainPage";

function View(props: { config: CurseConfig }) {
	const { isReady } = useAltScreen();
	const { runPendingProcesses, killAllProcesses, runStartupHook, processesRef } =
		useProcessManager();
	const { page } = usePage();
	const { status } = useProgramState();
	const { stdout } = useStdout();

	// Force re-render on terminal resize so compact mode toggles immediately
	const [, setResizeTick] = useState(0);
	useEffect(() => {
		const onResize = () => setResizeTick((t) => t + 1);
		stdout?.on("resize", onResize);
		return () => {
			stdout?.off("resize", onResize);
		};
	}, [stdout]);

	const terminalHeight = stdout?.rows ?? 24;
	const processCount = processesRef.current.length;
	const normalMinHeight = processCount + 13; // header(4) + table(N+3) + logPreview(5) + footer(1)
	const compactMinHeight = processCount + 1;
	const displayMode: DisplayMode =
		terminalHeight < compactMinHeight
			? "aggregated"
			: terminalHeight < normalMinHeight
				? "compact"
				: "normal";

	useInput(async (input, key) => {
		if (key.ctrl && input === "c") {
			await killAllProcesses();
			process.exit(0);
		}
	});

	useEffect(() => {
		const initializeApp = async () => {
			await runStartupHook();
			runPendingProcesses();
		};

		initializeApp();
	}, [runStartupHook, runPendingProcesses]);

	if (!isReady) {
		return null;
	}

	return (
		<Box flexDirection="column">
			{displayMode === "normal" && (
				<Box flexDirection="row" justifyContent="space-between">
					<Box flexDirection="row">
						<Text bold color={Colors.primary}>
							Curse 🕯
						</Text>
						<Text color={Colors.darkGray}> v{version}</Text>
					</Box>
					{status === ProgramStatus.Quitting && (
						<Text color={Colors.brightOrange}>Quitting...</Text>
					)}
				</Box>
			)}
			{displayMode === "normal" && (
				<Box flexDirection="row">
					<Text color={Colors.primary}>Config: </Text>
					<Text>{props.config.fileName}</Text>
				</Box>
			)}
			{(() => {
				switch (page) {
					case ViewPage.Main: {
						return <MainPage displayMode={displayMode} />;
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
		<ProgramStateProvider>
			<ProcessManagerProvider config={config}>
				<PageProvider>
					<View config={config} />
				</PageProvider>
			</ProcessManagerProvider>
		</ProgramStateProvider>,
		{ exitOnCtrlC: false, incrementalRendering: true },
	);
}
