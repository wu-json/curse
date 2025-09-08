import { useEffect } from "react";

const enterAltScreenCommand = "\x1b[?1049h";
const leaveAltScreenCommand = "\x1b[?1049l";

// Enables use of alternative screen via ansi escape codes.
// See: https://github.com/vadimdemedes/ink/issues/263#issuecomment-600927688
export function useAltScreen() {
	useEffect(() => {
		console.log("YO");
		process.stdout.write(enterAltScreenCommand);
		return () => {
			console.log("bye");
			process.stdout.write(leaveAltScreenCommand);
		};
	}, []);
}
