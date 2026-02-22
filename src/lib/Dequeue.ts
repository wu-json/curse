// Vendored and adapted from: https://github.com/petkaantonov/deque

const DEQUE_MIN_CAPACITY = 16;
const DEQUE_MAX_CAPACITY = (1 << 30) | 0;

const isArray = Array.isArray;

function arrayMove<T>(
	src: Deque<T>,
	srcIndex: number,
	dst: Deque<T>,
	dstIndex: number,
	len: number,
): void {
	for (let j = 0; j < len; ++j) {
		dst[j + dstIndex] = src[j + srcIndex];
		src[j + srcIndex] = void 0;
	}
}

function pow2AtLeast(n: number): number {
	n = n >>> 0;
	n = n - 1;
	n = n | (n >> 1);
	n = n | (n >> 2);
	n = n | (n >> 4);
	n = n | (n >> 8);
	n = n | (n >> 16);
	return n + 1;
}

function getCapacity<T>(capacity: number | T[] | undefined): number {
	if (typeof capacity !== "number") {
		if (isArray(capacity)) {
			capacity = capacity.length;
		} else {
			return DEQUE_MIN_CAPACITY;
		}
	}
	return pow2AtLeast(Math.min(Math.max(DEQUE_MIN_CAPACITY, capacity), DEQUE_MAX_CAPACITY));
}

export class Deque<T> {
	_capacity: number;
	_length: number;
	_front: number;
	[index: number]: T | undefined;

	constructor(capacity?: number | T[]) {
		this._capacity = getCapacity(capacity);
		this._length = 0;
		this._front = 0;
		if (isArray(capacity)) {
			const len = capacity.length;
			for (let i = 0; i < len; ++i) {
				this[i] = capacity[i];
			}
			this._length = len;
		}
	}

	toArray(): T[] {
		const len = this._length;
		const ret = new Array(len);
		const front = this._front;
		const capacity = this._capacity;
		for (let j = 0; j < len; ++j) {
			ret[j] = this[(front + j) & (capacity - 1)];
		}
		return ret;
	}

	push(...items: T[]): number {
		const argsLength = arguments.length;
		let length = this._length;
		if (argsLength > 1) {
			const capacity = this._capacity;
			if (length + argsLength > capacity) {
				for (let i = 0; i < argsLength; ++i) {
					this._checkCapacity(length + 1);
					const j: number = (this._front + length) & (this._capacity - 1);
					this[j] = arguments[i];
					length++;
					this._length = length;
				}
				return length;
			} else {
				let j: number = this._front;
				for (let i = 0; i < argsLength; ++i) {
					this[(j + length) & (capacity - 1)] = arguments[i];
					j++;
				}
				this._length = length + argsLength;
				return length + argsLength;
			}
		}

		if (argsLength === 0) return length;

		this._checkCapacity(length + 1);
		const i = (this._front + length) & (this._capacity - 1);
		this[i] = items[0];
		this._length = length + 1;
		return length + 1;
	}

	pop(): T | undefined {
		const length = this._length;
		if (length === 0) {
			return void 0;
		}
		const i = (this._front + length - 1) & (this._capacity - 1);
		const ret = this[i];
		this[i] = void 0;
		this._length = length - 1;
		return ret;
	}

	shift(): T | undefined {
		const length = this._length;
		if (length === 0) {
			return void 0;
		}
		const front = this._front;
		const ret = this[front];
		this[front] = void 0;
		this._front = (front + 1) & (this._capacity - 1);
		this._length = length - 1;
		return ret;
	}

	unshift(...items: T[]): number {
		let length = this._length;
		const argsLength = arguments.length;

		if (argsLength > 1) {
			let capacity = this._capacity;
			if (length + argsLength > capacity) {
				for (let i = argsLength - 1; i >= 0; i--) {
					this._checkCapacity(length + 1);
					capacity = this._capacity;
					const j: number = (((this._front - 1) & (capacity - 1)) ^ capacity) - capacity;
					this[j] = arguments[i];
					length++;
					this._length = length;
					this._front = j;
				}
				return length;
			} else {
				let front = this._front;
				for (let i = argsLength - 1; i >= 0; i--) {
					const j: number = (((front - 1) & (capacity - 1)) ^ capacity) - capacity;
					this[j] = arguments[i];
					front = j;
				}
				this._front = front;
				this._length = length + argsLength;
				return length + argsLength;
			}
		}

		if (argsLength === 0) return length;

		this._checkCapacity(length + 1);
		const capacity = this._capacity;
		const i = (((this._front - 1) & (capacity - 1)) ^ capacity) - capacity;
		this[i] = items[0];
		this._length = length + 1;
		this._front = i;
		return length + 1;
	}

	peekBack(count?: number): T[] {
		if (count === void 0) count = 1;
		const length = this._length;
		if (length === 0 || count <= 0) {
			return [];
		}
		const actualCount = count > length ? length : count;
		const ret = new Array(actualCount);
		const capacity = this._capacity;
		for (let i = 0; i < actualCount; ++i) {
			ret[i] = this[(this._front + length - 1 - i) & (capacity - 1)];
		}
		return ret;
	}

	/**
	 * Returns the last `count` elements in forward order (oldest to newest).
	 * More efficient than peekBack().reverse() as it avoids the reversal step.
	 */
	peekBackReversed(count?: number): T[] {
		if (count === void 0) count = 1;
		const length = this._length;
		if (length === 0 || count <= 0) {
			return [];
		}
		const actualCount = count > length ? length : count;
		const ret = new Array(actualCount);
		const capacity = this._capacity;
		const startIndex = length - actualCount;
		for (let i = 0; i < actualCount; ++i) {
			ret[i] = this[(this._front + startIndex + i) & (capacity - 1)];
		}
		return ret;
	}

	peekFront(count?: number): T[] {
		if (count === void 0) count = 1;
		const length = this._length;
		if (length === 0 || count <= 0) {
			return [];
		}
		const actualCount = count > length ? length : count;
		const ret = new Array(actualCount);
		const front = this._front;
		const capacity = this._capacity;
		for (let i = 0; i < actualCount; ++i) {
			ret[i] = this[(front + i) & (capacity - 1)];
		}
		return ret;
	}

	get(index: number): T | undefined {
		let i = index;
		if (i !== (i | 0)) {
			return void 0;
		}
		const len = this._length;
		if (i < 0) {
			i = i + len;
		}
		if (i < 0 || i >= len) {
			return void 0;
		}
		return this[(this._front + i) & (this._capacity - 1)];
	}

	isEmpty(): boolean {
		return this._length === 0;
	}

	clear(): void {
		const len = this._length;
		const front = this._front;
		const capacity = this._capacity;
		for (let j = 0; j < len; ++j) {
			this[(front + j) & (capacity - 1)] = void 0;
		}
		this._length = 0;
		this._front = 0;
	}

	toString(): string {
		return this.toArray().toString();
	}

	valueOf(): string {
		return this.toString();
	}

	removeFront(): T | undefined {
		return this.shift();
	}

	removeBack(): T | undefined {
		return this.pop();
	}

	insertFront(...items: T[]): number {
		return this.unshift(...items);
	}

	insertBack(...items: T[]): number {
		return this.push(...items);
	}

	enqueue(...items: T[]): number {
		return this.push(...items);
	}

	dequeue(): T | undefined {
		return this.shift();
	}

	toJSON(): T[] {
		return this.toArray();
	}

	get length(): number {
		return this._length;
	}

	set length(_value: number) {
		throw new RangeError("");
	}

	_checkCapacity(size: number): void {
		if (this._capacity < size) {
			this._resizeTo(getCapacity(this._capacity * 1.5 + 16));
		}
	}

	_resizeTo(capacity: number): void {
		const oldCapacity = this._capacity;
		this._capacity = capacity;
		const front = this._front;
		const length = this._length;
		if (front + length > oldCapacity) {
			const moveItemsCount = (front + length) & (oldCapacity - 1);
			arrayMove(this, 0, this, oldCapacity, moveItemsCount);
		}
	}
}
