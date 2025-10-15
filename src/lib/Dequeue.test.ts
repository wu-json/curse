// Vendored and adapted from: https://github.com/petkaantonov/deque

import { describe, it, expect } from "bun:test";
import { Deque } from "./Dequeue";

describe("Deque.prototype.constructor", () => {
	it("should take no argument", () => {
		const a = new Deque();
		expect(a._capacity).toBe(16);
	});

	it("should take a capacity argument", () => {
		const a = new Deque(32);
		expect(a._capacity).toBe(32);
	});

	it("should take array argument", () => {
		const a = new Deque([1, 2, 3, 4]);
		const b = new Deque([]);

		expect(a._capacity).toBeGreaterThanOrEqual(4);
		expect(a.toArray()).toEqual([1, 2, 3, 4]);
		expect(b._capacity).toBeGreaterThan(0);
		expect(b.toArray()).toEqual([]);
	});
});

describe("Deque.prototype.toArray", () => {
	it("should return an array", () => {
		const a = new Deque([1, 2, 3, 4]);
		expect(a.toArray()).toEqual([1, 2, 3, 4]);
	});
});

describe("Deque.prototype.push", () => {
	it("Should do nothing if no arguments", () => {
		const a = new Deque();
		const before = a.length;
		const ret = a.push();
		expect(ret).toBe(before);
		expect(a.length).toBe(ret);
		expect(ret).toBe(0);
	});

	it("Should add single argument - plenty of capacity", () => {
		const a = new Deque([1, 2, 3, 4, 5]);
		expect(a._capacity - a.length).toBeGreaterThan(1);
		const before = a.length;
		const ret = a.push(1);
		expect(ret).toBe(before + 1);
		expect(a.length).toBe(ret);
		expect(ret).toBe(6);
		expect(a.toArray()).toEqual([1, 2, 3, 4, 5, 1]);
	});

	it("Should add single argument - exact capacity", () => {
		const a = new Deque([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
		expect(a._capacity - a.length).toBe(1);
		const before = a.length;
		const ret = a.push(1);
		expect(ret).toBe(before + 1);
		expect(a.length).toBe(ret);
		expect(ret).toBe(16);
		expect(a.toArray()).toEqual([
			1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 1,
		]);
	});

	it("Should add single argument - over capacity", () => {
		const a = new Deque([
			1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
		]);
		expect(a._capacity - a.length).toBe(0);
		const before = a.length;
		const ret = a.push(1);
		expect(ret).toBe(before + 1);
		expect(a.length).toBe(ret);
		expect(ret).toBe(17);
		expect(a.toArray()).toEqual([
			1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 1,
		]);
	});

	it("Should add multiple arguments - plenty of capacity", () => {
		const a = new Deque([1, 2, 3, 4, 5]);
		expect(a._capacity - a.length).toBeGreaterThan(2);
		const before = a.length;
		const ret = a.push(1, 2);
		expect(ret).toBe(before + 2);
		expect(a.length).toBe(ret);
		expect(ret).toBe(7);
		expect(a.toArray()).toEqual([1, 2, 3, 4, 5, 1, 2]);
	});

	it("Should add multiple argument - exact capacity", () => {
		const a = new Deque([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
		expect(a._capacity - a.length).toBe(2);
		const before = a.length;
		const ret = a.push(1, 2);
		expect(ret).toBe(before + 2);
		expect(a.length).toBe(ret);
		expect(ret).toBe(16);
		expect(a.toArray()).toEqual([
			1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 1, 2,
		]);
	});

	it("Should add multiple arguments - over capacity", () => {
		const a = new Deque([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
		expect(a._capacity - a.length).toBe(1);
		const before = a.length;
		const ret = a.push(1, 2);
		expect(ret).toBe(before + 2);
		expect(a.length).toBe(ret);
		expect(ret).toBe(17);
		expect(a.toArray()).toEqual([
			1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 1, 2,
		]);
	});
});

describe("Deque.prototype.unshift", () => {
	it("Should do nothing if no arguments", () => {
		const a = new Deque();
		const before = a.length;
		const ret = a.unshift();
		expect(ret).toBe(before);
		expect(a.length).toBe(ret);
		expect(ret).toBe(0);
	});

	it("Should add single argument - plenty of capacity", () => {
		const a = new Deque([1, 2, 3, 4, 5]);
		expect(a._capacity - a.length).toBeGreaterThan(1);
		const before = a.length;
		const ret = a.unshift(1);
		expect(ret).toBe(before + 1);
		expect(a.length).toBe(ret);
		expect(ret).toBe(6);
		expect(a.toArray()).toEqual([1, 1, 2, 3, 4, 5]);
	});

	it("Should add single argument - exact capacity", () => {
		const a = new Deque([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
		expect(a._capacity - a.length).toBe(1);
		const before = a.length;
		const ret = a.unshift(1);
		expect(ret).toBe(before + 1);
		expect(a.length).toBe(ret);
		expect(ret).toBe(16);
		expect(a.toArray()).toEqual([
			1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
		]);
	});

	it("Should add single argument - over capacity", () => {
		const a = new Deque([
			1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
		]);
		expect(a._capacity - a.length).toBe(0);
		const before = a.length;
		const ret = a.unshift(1);
		expect(ret).toBe(before + 1);
		expect(a.length).toBe(ret);
		expect(ret).toBe(17);
		expect(a.toArray()).toEqual([
			1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
		]);
	});

	it("Should add multiple arguments - plenty of capacity", () => {
		const a = new Deque([1, 2, 3, 4, 5]);
		expect(a._capacity - a.length).toBeGreaterThan(2);
		const before = a.length;
		const ret = a.unshift(1, 2);
		expect(ret).toBe(before + 2);
		expect(a.length).toBe(ret);
		expect(ret).toBe(7);
		expect(a.toArray()).toEqual([1, 2, 1, 2, 3, 4, 5]);
	});

	it("Should add multiple argument - exact capacity", () => {
		const a = new Deque([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
		expect(a._capacity - a.length).toBe(2);
		const before = a.length;
		const ret = a.unshift(1, 2);
		expect(ret).toBe(before + 2);
		expect(a.length).toBe(ret);
		expect(ret).toBe(16);
		expect(a.toArray()).toEqual([
			1, 2, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
		]);
	});

	it("Should add multiple arguments - over capacity", () => {
		const a = new Deque([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
		expect(a._capacity - a.length).toBe(1);
		const before = a.length;
		const ret = a.unshift(1, 2);
		expect(ret).toBe(before + 2);
		expect(a.length).toBe(ret);
		expect(ret).toBe(17);
		expect(a.toArray()).toEqual([
			1, 2, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
		]);
	});
});

describe("Deque.prototype.pop", () => {
	it("Should return undefined when empty deque", () => {
		const a = new Deque();
		expect(a.length).toBe(0);
		expect(a.pop()).toBeUndefined();
		expect(a.pop()).toBeUndefined();
		expect(a.length).toBe(0);
	});

	it("Should return the item at the back of the deque", () => {
		const a = new Deque<number>();
		const b: number[] = [];

		a.push(1, 2, 3, 4, 5, 6, 7, 8, 9);
		b.push(1, 2, 3, 4, 5, 6, 7, 8, 9);

		expect(a.pop()).toBe(9);
		expect(a.pop()).toBe(8);
		b.pop();
		b.pop();
		expect(a.toArray()).toEqual(b);
		a.unshift(1, 2, 3, 4, 5);
		a.push(1, 2, 3, 4, 5);
		a.unshift(1, 2, 3);
		a.pop();
		b.unshift(1, 2, 3, 4, 5);
		b.push(1, 2, 3, 4, 5);
		b.unshift(1, 2, 3);
		b.pop();
		expect(a.toArray()).toEqual(b);
		expect(a.pop()).toBe(b.pop());
		expect(a.toArray()).toEqual(b);
	});
});

describe("Deque.prototype.shift", () => {
	it("Should return undefined when empty deque", () => {
		const a = new Deque();
		expect(a.length).toBe(0);
		expect(a.shift()).toBeUndefined();
		expect(a.shift()).toBeUndefined();
		expect(a.length).toBe(0);
	});

	it("Should return the item at the front of the deque", () => {
		const a = new Deque<number>();
		const b: number[] = [];

		a.push(1, 2, 3, 4, 5, 6, 7, 8, 9);
		b.push(1, 2, 3, 4, 5, 6, 7, 8, 9);

		expect(a.shift()).toBe(1);
		expect(a.shift()).toBe(2);
		b.shift();
		b.shift();
		expect(a.toArray()).toEqual(b);
		a.unshift(1, 2, 3, 4, 5);
		a.push(1, 2, 3, 4, 5);
		a.unshift(1, 2, 3);
		a.shift();
		b.unshift(1, 2, 3, 4, 5);
		b.push(1, 2, 3, 4, 5);
		b.unshift(1, 2, 3);
		b.shift();
		expect(a.toArray()).toEqual(b);
		expect(a.shift()).toBe(b.shift());
		expect(a.toArray()).toEqual(b);
	});
});

describe("Deque.prototype.peekBack", () => {
	it("Should return empty array when empty deque", () => {
		const a = new Deque();
		expect(a.length).toBe(0);
		expect(a.peekBack()).toEqual([]);
		expect(a.peekBack()).toEqual([]);
		expect(a.length).toBe(0);
	});

	it("Should return the item at the back of the deque", () => {
		const a = new Deque<number>();
		a.push(1, 2, 3, 4, 5, 6, 7, 8, 9);

		expect(a.peekBack()).toEqual([9]);

		let l = 5;
		while (l--) a.pop();

		expect(a.toArray()).toEqual([1, 2, 3, 4]);

		expect(a.peekBack()).toEqual([4]);

		l = 2;
		while (l--) a.shift();

		expect(a.peekBack()).toEqual([4]);

		expect(a.toArray()).toEqual([3, 4]);

		a.unshift(
			1,
			2,
			3,
			4,
			5,
			6,
			78,
			89,
			12901,
			10121,
			0,
			12,
			1,
			2,
			3,
			4,
			5,
			6,
			78,
			89,
			12901,
			10121,
			0,
			12,
		);

		expect(a.toArray()).toEqual([
			1, 2, 3, 4, 5, 6, 78, 89, 12901, 10121, 0, 12, 1, 2, 3, 4, 5, 6, 78, 89,
			12901, 10121, 0, 12, 3, 4,
		]);

		expect(a.peekBack()).toEqual([4]);

		a.push(1, 3, 4);

		expect(a.peekBack()).toEqual([4]);

		a.pop();
		a.shift();

		expect(a.peekBack()).toEqual([3]);
		expect(a.toArray()).toEqual([
			2, 3, 4, 5, 6, 78, 89, 12901, 10121, 0, 12, 1, 2, 3, 4, 5, 6, 78, 89,
			12901, 10121, 0, 12, 3, 4, 1, 3,
		]);
	});

	it("Should return multiple items from back when count specified", () => {
		const a = new Deque([1, 2, 3, 4, 5]);
		expect(a.peekBack(3)).toEqual([5, 4, 3]);
		expect(a.peekBack(10)).toEqual([5, 4, 3, 2, 1]);
		expect(a.length).toBe(5); // peekBack should not modify length
	});
});

describe("Deque.prototype.peekFront", () => {
	it("Should return empty array when empty deque", () => {
		const a = new Deque();
		expect(a.length).toBe(0);
		expect(a.peekFront()).toEqual([]);
		expect(a.peekFront()).toEqual([]);
		expect(a.length).toBe(0);
	});

	it("Should return the item at the front of the deque", () => {
		const a = new Deque<number>();
		a.push(1, 2, 3, 4, 5, 6, 7, 8, 9);

		expect(a.peekFront()).toEqual([1]);

		let l = 5;
		while (l--) a.pop();

		expect(a.toArray()).toEqual([1, 2, 3, 4]);

		expect(a.peekFront()).toEqual([1]);

		l = 2;
		while (l--) a.shift();

		expect(a.peekFront()).toEqual([3]);

		expect(a.toArray()).toEqual([3, 4]);

		a.unshift(
			1,
			2,
			3,
			4,
			5,
			6,
			78,
			89,
			12901,
			10121,
			0,
			12,
			1,
			2,
			3,
			4,
			5,
			6,
			78,
			89,
			12901,
			10121,
			0,
			12,
		);

		expect(a.toArray()).toEqual([
			1, 2, 3, 4, 5, 6, 78, 89, 12901, 10121, 0, 12, 1, 2, 3, 4, 5, 6, 78, 89,
			12901, 10121, 0, 12, 3, 4,
		]);

		expect(a.peekFront()).toEqual([1]);

		a.push(1, 3, 4);

		expect(a.peekFront()).toEqual([1]);

		a.pop();
		a.shift();

		expect(a.peekFront()).toEqual([2]);
		expect(a.toArray()).toEqual([
			2, 3, 4, 5, 6, 78, 89, 12901, 10121, 0, 12, 1, 2, 3, 4, 5, 6, 78, 89,
			12901, 10121, 0, 12, 3, 4, 1, 3,
		]);
	});

	it("Should return multiple items from front when count specified", () => {
		const a = new Deque([1, 2, 3, 4, 5]);
		expect(a.peekFront(3)).toEqual([1, 2, 3]);
		expect(a.peekFront(10)).toEqual([1, 2, 3, 4, 5]);
		expect(a.length).toBe(5); // peekFront should not modify length
	});
});

describe("Deque.prototype.get", () => {
	it("should return undefined on nonsensical argument", () => {
		const a = new Deque([1, 2, 3, 4]);
		expect(a.get(-5)).toBeUndefined();
		expect(a.get(-100)).toBeUndefined();
		expect(a.get(undefined as any)).toBeUndefined();
		expect(a.get("1" as any)).toBeUndefined();
		expect(a.get(NaN)).toBeUndefined();
		expect(a.get(Infinity)).toBeUndefined();
		expect(a.get(-Infinity)).toBeUndefined();
		expect(a.get(1.5)).toBeUndefined();
		expect(a.get(4)).toBeUndefined();
	});

	it("should support positive indexing", () => {
		const a = new Deque([1, 2, 3, 4]);
		expect(a.get(0)).toBe(1);
		expect(a.get(1)).toBe(2);
		expect(a.get(2)).toBe(3);
		expect(a.get(3)).toBe(4);
	});

	it("should support negative indexing", () => {
		const a = new Deque([1, 2, 3, 4]);
		expect(a.get(-1)).toBe(4);
		expect(a.get(-2)).toBe(3);
		expect(a.get(-3)).toBe(2);
		expect(a.get(-4)).toBe(1);
	});
});

describe("Deque.prototype.isEmpty", () => {
	it("should return true on empty deque", () => {
		const a = new Deque();
		expect(a.isEmpty()).toBe(true);
	});

	it("should return false on deque with items", () => {
		const a = new Deque([1]);
		expect(a.isEmpty()).toBe(false);
	});
});

describe("Deque.prototype.clear", () => {
	it("should clear the deque", () => {
		const a = new Deque([1, 2, 3, 4]);
		expect(a.isEmpty()).toBe(false);
		a.clear();
		expect(a.isEmpty()).toBe(true);
	});
});

describe("Deque resizing", () => {
	function times(
		x: number,
		value: number | "index" | undefined,
	): (number | undefined)[] {
		const a: (number | undefined)[] = [];
		for (let i = 0; i < x; ++i) {
			a.push(value === "index" ? i : value);
		}
		return a;
	}

	it("Resize requires movement", () => {
		const a = new Deque<number>(16);
		a[0] = 4;
		a[1] = 5;
		a[14] = 2;
		a[15] = 3;
		a._length = 16;
		a._front = 14;
		expect(a.peekFront()).toEqual([2]);
		expect(a.get(3)).toBe(5);
		expect(a._capacity).toBe(16);
		expect(a.toArray()).toEqual(
			[2, 3, 4, 5].concat(times(12, undefined) as any),
		);
		a.push(6);
		expect(a._capacity).not.toBe(16);
		a.unshift(1);
		expect(a.toArray()).toEqual(
			[1, 2, 3, 4, 5].concat(times(12, undefined) as any, 6),
		);
	});

	it("Resize doesn't require movement", () => {
		const original = times(16, "index");
		const a = new Deque(original as number[]);
		a.push(17);
		a.unshift(-1);
		expect(a.toArray()).toEqual([-1].concat(original as any, 17));
	});
});

describe("Deque alias methods", () => {
	it("removeFront should be alias for shift", () => {
		const a = new Deque([1, 2, 3]);
		expect(a.removeFront()).toBe(1);
		expect(a.toArray()).toEqual([2, 3]);
	});

	it("removeBack should be alias for pop", () => {
		const a = new Deque([1, 2, 3]);
		expect(a.removeBack()).toBe(3);
		expect(a.toArray()).toEqual([1, 2]);
	});

	it("insertFront should be alias for unshift", () => {
		const a = new Deque([2, 3]);
		a.insertFront(1);
		expect(a.toArray()).toEqual([1, 2, 3]);
	});

	it("insertBack should be alias for push", () => {
		const a = new Deque([1, 2]);
		a.insertBack(3);
		expect(a.toArray()).toEqual([1, 2, 3]);
	});

	it("enqueue should be alias for push", () => {
		const a = new Deque([1, 2]);
		a.enqueue(3);
		expect(a.toArray()).toEqual([1, 2, 3]);
	});

	it("dequeue should be alias for shift", () => {
		const a = new Deque([1, 2, 3]);
		expect(a.dequeue()).toBe(1);
		expect(a.toArray()).toEqual([2, 3]);
	});
});

describe("Deque.prototype.length", () => {
	it("should return the correct length", () => {
		const a = new Deque([1, 2, 3, 4]);
		expect(a.length).toBe(4);
		a.push(5);
		expect(a.length).toBe(5);
		a.shift();
		expect(a.length).toBe(4);
	});

	it("should throw when trying to set length", () => {
		const a = new Deque([1, 2, 3]);
		expect(() => {
			a.length = 5;
		}).toThrow(RangeError);
	});
});

describe("Deque.prototype.toJSON", () => {
	it("should return array representation for JSON serialization", () => {
		const a = new Deque([1, 2, 3, 4]);
		expect(a.toJSON()).toEqual([1, 2, 3, 4]);
		expect(JSON.stringify(a)).toBe("[1,2,3,4]");
	});
});
