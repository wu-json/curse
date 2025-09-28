import { Box, Text, useStdout } from "ink";
import { Colors } from "../../lib/Colors";

interface ShortcutFooterProps {
	shortcuts: string[];
	showShortcuts: boolean;
}

export function ShortcutFooter({ shortcuts, showShortcuts }: ShortcutFooterProps) {
	const { stdout } = useStdout();
	const terminalWidth = stdout.columns;

	return (
		<Box marginLeft={1} flexDirection="row">
			{showShortcuts ? (
				(() => {
					// Calculate number of columns based on terminal width
					let numColumns;
					if (terminalWidth < 80) numColumns = 1;
					else if (terminalWidth < 120) numColumns = 2;
					else if (terminalWidth < 160) numColumns = 3;
					else numColumns = 4;

					const itemsPerColumn = Math.ceil(shortcuts.length / numColumns);

					const columns = [];
					for (let col = 0; col < numColumns; col++) {
						const startIdx = col * itemsPerColumn;
						const endIdx = Math.min(
							startIdx + itemsPerColumn,
							shortcuts.length,
						);
						const columnShortcuts = shortcuts.slice(startIdx, endIdx);

						columns.push(
							<Box key={col} flexDirection="column" marginRight={4}>
								{columnShortcuts.map((shortcut, idx) => (
									<Text key={idx} color={Colors.darkGray}>
										{shortcut}
									</Text>
								))}
							</Box>,
						);
					}

					return <>{columns}</>;
				})()
			) : (
				<Text color={Colors.darkGray}>? for shortcuts</Text>
			)}
		</Box>
	);
}

// Helper function to calculate the height taken by shortcuts
export function getShortcutFooterHeight(
	shortcutsCount: number,
	terminalWidth: number,
	showShortcuts: boolean,
): number {
	if (!showShortcuts) return 0;

	let numColumns;
	if (terminalWidth < 80) numColumns = 1;
	else if (terminalWidth < 120) numColumns = 2;
	else if (terminalWidth < 160) numColumns = 3;
	else numColumns = 4;

	return Math.ceil(shortcutsCount / numColumns);
}