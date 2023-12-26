import { expect, test } from 'vitest';
import { type ImplicitLine2D, type Point2D, Side } from '$lib/server/common/model';
import offsetPolyline, { getNormalImplicitLineThroughPoint } from '$lib/server/common/util/offset-polyline';

test('Normal line through origin', () => {
	const line: ImplicitLine2D = { a: 1, b: 0, c: 0 };
	const normalLine = getNormalImplicitLineThroughPoint(line, { x: 0, y: 0 });
	console.log('normalLine', normalLine);
	expect(normalLine.a).toBe(0);
	expect(normalLine.b).toBe(1);
	expect(normalLine.c).toBe(0);
});

test('Normal line through point (1, 1)', () => {
	const line: ImplicitLine2D = { a: 1, b: 0, c: 0 };
	const normalLine = getNormalImplicitLineThroughPoint(line, { x: 1, y: 1 });
	expect(normalLine.a).toBe(0);
	expect(normalLine.b).toBe(1);
	expect(normalLine.c).toBe(-1);
});

test('45 degree line through origin', () => {
	const line: ImplicitLine2D = { a: 1, b: -1, c: 0 };
	const normalLine = getNormalImplicitLineThroughPoint(line, { x: 0, y: 0 });
	expect(normalLine.a).toBe(1);
	expect(normalLine.b).toBe(1);
	expect(normalLine.c).toBe(0);
});

test('Simple offset polyline right by distance of 5', () => {
	const points = [
		{ x: 0, y: 0 },
		{ x: 0, y: 10 },
	];
	const offset = 5;
	const side = Side.RIGHT;
	const expected = [
		{ x: 5, y: 0 },
		{ x: 5, y: 10 },
	];
	const actual = offsetPolyline(points, offset, side);
	assertPolylinesEqual(expected, actual);
});

test('Simple offset polyline left by distance of 5', () => {
	const points = [
		{ x: 0, y: 0 },
		{ x: 0, y: 10 },
	];
	const offset = 5;
	const side = Side.LEFT;
	const expected = [
		{ x: -5, y: 0 },
		{ x: -5, y: 10 },
	];
	const actual = offsetPolyline(points, offset, side);
	assertPolylinesEqual(expected, actual);
});

test('Offset polyline right by distance of 5', () => {
	const points = [
		{ x: 0, y: 0 },
		{ x: 0, y: 10 },
		{ x: 10, y: 10 },
	];
	const offset = 5;
	const side = Side.RIGHT;
	const expected = [
		{ x: 5, y: 0 },
		{ x: 5, y: 5 },
		{ x: 10, y: 5 },
	];
	const actual = offsetPolyline(points, offset, side);
	assertPolylinesEqual(expected, actual);
});

test('Offset polyline left by distance of 5', () => {
	const points = [
		{ x: 0, y: 0 },
		{ x: 0, y: 10 },
		{ x: 10, y: 10 }
	];
	const offset = 5;
	const side = Side.LEFT;
	const expected = [
		{ x: -5, y: 0 },
		{ x: -5, y: 15 },
		{ x: 10, y: 15 }
	];
	const actual = offsetPolyline(points, offset, side);
	assertPolylinesEqual(expected, actual);
});

test('Simple offset polyline right by distance of 0.5', () => {
	const points = [
		{ x: 0, y: 0 },
		{ x: 10, y: 10 },
	];
	const offset = Math.sqrt(2);
	const side = Side.RIGHT;
	const expected = [
		{ x: -1, y: 1 },
		{ x: 9, y: 11 },
	];
	const actual = offsetPolyline(points, offset, side);
	assertPolylinesEqual(expected, actual);
});

const assertPolylinesEqual = (expected: Point2D[], actual: Point2D[]) => {
	console.log('actual', actual);
	console.log('expected', expected);
	expect(arePolylinesEqual(actual, expected)).toBe(true);
}

const arePolylinesEqual = (a: Point2D[], b: Point2D[]): boolean => {
	if (a.length !== b.length) {
		return false;
	}
	for (let i = 0; i < a.length; i++) {
		const pointA = a[i];
		const pointB = b[i];
		if (!areNumbersEqual(pointA.x, pointB.x) || !areNumbersEqual(pointA.y, pointB.y)) {
			return false;
		}
	}
	return true;
}

const areNumbersEqual = (a: number, b: number): boolean => {
	return Math.abs(a - b) < 0.000000000000001;
}