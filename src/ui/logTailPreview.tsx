import { Box, Text } from "ink";
import { useEffect, useState } from "react";

import { useProcessManager } from "../hooks/useProcessManager";
import { Colors } from "../lib/Colors";

export function LogTailPreview(props: { height: number }) {
	const { selectedProcess } = useProcessManager();
	const [, forceUpdate] = useState(0);

	// Force re-render every second to update logs
	useEffect(() => {
		const interval = setInterval(() => {
			forceUpdate((prev) => prev + 1);
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	if (!selectedProcess) {
		return (
			<Box
				flexDirection="column"
				borderStyle="single"
				borderColor={Colors.darkGray}
				height={props.height}
				justifyContent="center"
				alignItems="center"
			>
				<Text color={Colors.darkGray}>No process selected</Text>
			</Box>
		);
	}

	const linesPerPage = props.height - 2; // Account for borders only
	const logs = selectedProcess.logBuffer.getRecentLines(linesPerPage);

	return (
		<Box
			flexDirection="column"
			borderStyle="single"
			borderColor={Colors.darkGray}
			height={props.height}
		>
			<Box flexDirection="column" paddingX={1} flexGrow={1}>
				{logs.length === 0 ? (
					<Box justifyContent="center" alignItems="center" flexGrow={1}>
						<Text color={Colors.darkGray}>No logs available</Text>
					</Box>
				) : (
					logs.map((log: string, index: number) => (
						<Box key={index}>
							<Text
								color={log.includes("stderr") ? "red" : Colors.lightBlue}
								wrap="truncate"
							>
								{log}
							</Text>
						</Box>
					))
				)}
			</Box>
		</Box>
	);
}