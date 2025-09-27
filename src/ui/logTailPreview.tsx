import { Box, Text } from "ink";
import { useEffect, useState } from "react";

import { useProcessManager } from "./useProcessManager";
import { Colors } from "./colors";

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

	const linesPerPage = props.height - 3; // Account for borders and header
	const logs = selectedProcess.logBuffer.getRecentLines(linesPerPage);

	return (
		<Box
			flexDirection="column"
			borderStyle="single"
			borderColor={Colors.darkGray}
			height={props.height}
		>
			<Box justifyContent="center" borderBottom borderColor={Colors.darkGray} paddingX={1}>
				<Text color={Colors.darkGray}>
					<Text color={Colors.teal}>Logs</Text>
					<Text color={Colors.teal}>(</Text>
					<Text color={Colors.brightPink} bold>
						{selectedProcess.name}
					</Text>
					<Text color={Colors.teal}>)</Text>
					<Text color={Colors.teal}>[</Text>
					<Text color={Colors.brightTeal}>tail</Text>
					<Text color={Colors.teal}>]</Text>
				</Text>
			</Box>
			<Box flexDirection="column" paddingX={1} flexGrow={1}>
				{logs.length === 0 ? (
					<Box justifyContent="center" alignItems="center" flexGrow={1}>
						<Text color={Colors.darkGray}>No logs available</Text>
					</Box>
				) : (
					logs.map((log, index) => (
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