import { Box, Text, useStdout } from "ink";

import { Colors } from "../../lib/Colors";
import { getShortcutFooterColumns, getShortcutFooterHeight } from "../layout";

// Re-export so existing callers can keep importing it from this module.
export { getShortcutFooterHeight };

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
					const numColumns = getShortcutFooterColumns(terminalWidth);
					const itemsPerColumn = Math.ceil(shortcuts.length / numColumns);

					const columns = [];
					for (let col = 0; col < numColumns; col++) {
						const startIdx = col * itemsPerColumn;
						const endIdx = Math.min(startIdx + itemsPerColumn, shortcuts.length);
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
