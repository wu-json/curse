import MiniSearch from "minisearch";
import { Deque } from "./Dequeue";

export class LogBuffer {
	private lines: Deque<string>;
	private readonly maxSize: number;
	private totalLinesAdded = 0;
	private searchIndex: MiniSearch<{
		id: number;
		text: string;
		lineNumber: number;
	}>;
	private nextId = 0;

	// We store line ID's in a queue so that when we hit the max buffer capacity we can remove the
	// discarded logs from the minisearch index in O(1) time.
	private discardLineIdQueue: Deque<number>;

	constructor(maxSize: number) {
		this.maxSize = maxSize;
		this.lines = new Deque<string>();
		this.discardLineIdQueue = new Deque<number>();
		this.searchIndex = new MiniSearch({
			fields: ["text"],
			storeFields: ["text", "lineNumber"],
			idField: "id",
		});
	}

	add(line: string): void {
		this.lines.push(line);
		this.totalLinesAdded++;

		// Add to search index
		const doc = {
			id: this.nextId++,
			text: line,
			lineNumber: this.totalLinesAdded - 1,
		};
		this.searchIndex.add(doc);
		this.discardLineIdQueue.push(doc.id);

		if (this.lines.length > this.maxSize) {
			this.lines.shift();
			// Remove oldest entry from search index using O(1) queue removal
			const oldestDocId = this.discardLineIdQueue.shift();
			if (oldestDocId !== undefined) {
				this.searchIndex.discard(oldestDocId);
			}
		}
	}

	getRecentLines(count: number): string[] {
		return this.lines.peekBack(count).reverse();
	}

	getLinesByAbsolutePosition(
		absoluteStartLine: number,
		count: number,
	): string[] {
		if (count <= 0 || this.lines.length === 0) return [];

		const oldestLine = this.getOldestAvailableLineNumber();
		const newestLine = this.totalLinesAdded - 1;

		// Check if the requested range is available
		if (
			absoluteStartLine > newestLine ||
			absoluteStartLine + count <= oldestLine
		) {
			return [];
		}

		// Convert absolute position to relative position within current buffer
		const relativeStart = absoluteStartLine - oldestLine;
		const actualStart = Math.max(0, relativeStart);
		const actualCount = Math.min(count, this.lines.length - actualStart);

		// Build result array using deque.get() for O(actualCount) performance
		const result: string[] = [];
		for (let i = 0; i < actualCount; i++) {
			const line = this.lines.get(actualStart + i);
			if (line !== undefined) {
				result.push(line);
			}
		}
		return result;
	}

	getOldestAvailableLineNumber(): number {
		return this.totalLinesAdded - this.lines.length;
	}

	isPositionValid(absolutePosition: number): boolean {
		const oldestLine = this.getOldestAvailableLineNumber();
		return (
			absolutePosition >= oldestLine && absolutePosition < this.totalLinesAdded
		);
	}

	getTotalLines(): number {
		return this.lines.length;
	}

	clear(): void {
		this.lines.clear();
		this.searchIndex.removeAll();
		this.nextId = 0;
		this.totalLinesAdded = 0;
		this.discardLineIdQueue.clear();
	}

	search(
		query: string,
	): Array<{ text: string; lineNumber: number; score: number }> {
		if (!query.trim()) {
			return [];
		}

		const results = this.searchIndex.search(query, {
			fuzzy: false,
			prefix: true,
		});

		return results.map((result) => ({
			text: result.text,
			lineNumber: result.lineNumber,
			score: result.score,
		}));
	}
}

export async function readStreamToBuffer(
	stream: ReadableStream<Uint8Array> | null,
	logBuffer: LogBuffer,
): Promise<void> {
	if (!stream) return;

	const decoder = new TextDecoder();
	const reader = stream.getReader();

	try {
		let buffer = "";
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split("\n");
			buffer = lines.pop() || "";

			for (const line of lines) {
				if (line.trim()) {
					logBuffer.add(line);
				}
			}
		}
		if (buffer.trim()) {
			logBuffer.add(buffer);
		}
	} catch (error) {
		logBuffer.add(`Error reading output: ${error}`);
	}
}
