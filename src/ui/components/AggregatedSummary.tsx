import { Box, Text } from "ink";

import { useProcessManager, type Process } from "../../hooks/useProcessManager";
import { useRenderTick } from "../../hooks/useRenderTick";
import { Colors } from "../../lib/Colors";

const statusColorMap: Record<string, string> = {
	running: Colors.mutedGreen,
	starting: Colors.gray,
	pending: Colors.darkGray,
	error: Colors.mutedRed,
	success: Colors.darkGray,
	killing: Colors.amber,
	killed: Colors.amber,
};

export function AggregatedSummary(props: { numberPrefix: string; waitingForSecondG: boolean }) {
	const { processesRef, selectedProcessIdx } = useProcessManager();
	const processes = processesRef.current;
	useRenderTick();

	// Count statuses
	const statusCounts: Record<string, number> = {};
	for (const p of processes) {
		statusCounts[p.status] = (statusCounts[p.status] ?? 0) + 1;
	}

	// Count readiness
	const withProbe = processes.filter((p: Process) => p.readinessProbe !== undefined);
	const readyCount = withProbe.filter((p: Process) => p.isReady === true).length;

	const selected = processes[selectedProcessIdx];

	// Line 1: status counts + position indicator
	const statusParts: { label: string; color: string }[] = [];
	for (const [status, count] of Object.entries(statusCounts)) {
		if (count > 0) {
			statusParts.push({
				label: `${count} ${status}`,
				color: statusColorMap[status] ?? Colors.darkGray,
			});
		}
	}

	// Line 2: readiness
	const readinessText = withProbe.length > 0 ? `Ready: ${readyCount}/${withProbe.length}` : "";

	// Line 3: selected process detail
	const readinessLabel =
		selected?.readinessProbe !== undefined ? (selected.isReady ? ", ready" : ", not ready") : "";
	const selectedDetail = selected ? `> ${selected.name} (${selected.status}${readinessLabel})` : "";

	return (
		<Box flexDirection="column">
			<Box flexDirection="row" gap={1}>
				{statusParts.map((part) => (
					<Text key={part.label} color={part.color} bold>
						{part.label}
					</Text>
				))}
			</Box>
			{readinessText && (
				<Box>
					<Text color={Colors.darkGray}>{readinessText}</Text>
				</Box>
			)}
			<Box>
				<Text backgroundColor={Colors.gray} color="white" bold>
					{" "}
					{selectedDetail}{" "}
				</Text>
				{props.numberPrefix && <Text color={Colors.silver}> [{props.numberPrefix}]</Text>}
				{props.waitingForSecondG && <Text color={Colors.softGreen}> [g]</Text>}
			</Box>
		</Box>
	);
}
