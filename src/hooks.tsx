import { useEffect, useState } from "react";

const enterAltScreenCommand = "\x1b[?1049h";
const leaveAltScreenCommand = "\x1b[?1049l";

// Enables use of alternative screen via ansi escape codes.
// See: https://github.com/vadimdemedes/ink/issues/263#issuecomment-600927688
export function useAltScreen(): { isOpen: boolean } {
	const [isOpen, setIsOpen] = useState(false);
	useEffect(() => {
		process.stdout.write(enterAltScreenCommand);
		setIsOpen(true);
		return () => {
			process.stdout.write(leaveAltScreenCommand);
			setIsOpen(false);
		};
	}, []);
	return { isOpen };
}
