import { useState, useEffect } from "react";

export function useRenderTick(intervalMs: number = 1000) {
	const [, forceUpdate] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			forceUpdate((prev) => prev + 1);
		}, intervalMs);

		return () => clearInterval(interval);
	}, [intervalMs]);
}
