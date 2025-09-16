import MiniSearch from "minisearch";

export class LogBuffer {
	private lines: string[] = [];
	private readonly maxSize: number;
	private totalLinesAdded = 0;
	private searchIndex: MiniSearch<{
		id: number;
		text: string;
		lineNumber: number;
	}>;
	private nextId = 0;

	constructor(maxSize: number) {
		this.maxSize = maxSize;
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

		if (this.lines.length > this.maxSize) {
			this.lines.shift();
			// Remove oldest entry from search index
			const oldestLineNumber = this.getOldestAvailableLineNumber();
			const docsToRemove = this.searchIndex.search("*", {
				filter: (result) => result.lineNumber < oldestLineNumber,
			});
			for (const doc of docsToRemove) {
				this.searchIndex.discard(doc.id);
			}
		}
	}

	getLines(): string[] {
		return [...this.lines];
	}

	getRecentLines(count: number): string[] {
		if (count <= 0 || this.lines.length === 0) return [];

		const startIndex = Math.max(0, this.lines.length - count);
		return this.lines.slice(startIndex);
	}

	getLinesFromEnd(offset: number, count: number): string[] {
		if (count <= 0 || this.lines.length === 0 || offset >= this.lines.length)
			return [];

		const endIndex = this.lines.length - offset;
		const startIndex = Math.max(0, endIndex - count);

		return this.lines.slice(startIndex, endIndex);
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
		const relativeEnd = Math.min(relativeStart + count, this.lines.length);
		const actualStart = Math.max(0, relativeStart);

		return this.lines.slice(actualStart, relativeEnd);
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

	getCurrentEndPosition(): number {
		return this.lines.length;
	}

	getTotalLines(): number {
		return this.lines.length;
	}

	clear(): void {
		this.lines = [];
		this.searchIndex.removeAll();
		this.nextId = 0;
		this.totalLinesAdded = 0;
	}

	search(
		query: string,
	): Array<{ text: string; lineNumber: number; score: number }> {
		if (!query.trim()) {
			return [];
		}

		const results = this.searchIndex.search(query, {
			fuzzy: 0.2,
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
