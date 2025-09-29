import { Box, Text } from "ink";
import { useMemo } from "react";

import { useProcessManager } from "../../hooks/useProcessManager";
import { Colors } from "../../lib/Colors";

export function LogTailPreview(props: { height: number }) {
	const { selectedProcess } = useProcessManager();

	// Memoize the logs to prevent flickering when other processes update
	const logs = useMemo(() => {
		if (!selectedProcess) return [];

		const linesPerPage = props.height - 2; // Account for borders only
		return selectedProcess.logBuffer.getRecentLines(linesPerPage);
	}, [selectedProcess, selectedProcess?.logBuffer.getTotalLines(), props.height]);

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
								color={log.includes("stderr") ? "red" : Colors.purple}
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
