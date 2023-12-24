import { expect, test } from 'vitest';
import { type Point2D, Side } from '$lib/server/common/model';
import offsetPolyline from '$lib/server/common/util/offset-polyline';

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
		if (pointA.x !== pointB.x || pointA.y !== pointB.y) {
			return false;
		}
	}
	return true;
}