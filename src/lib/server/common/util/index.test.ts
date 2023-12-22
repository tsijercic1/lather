import { test, expect } from 'vitest';
import { threePointOrientation } from '$lib/server/common/util/index';
import { ThreePointOrientation } from '$lib/server/common/model';

test('Left orientation', () => {
	const a = { x: 0, y: 0 };
	const b = { x: 1, y: 0 };
	const c = { x: 1, y: 1 };
	expect(threePointOrientation(a, b, c)).toBe(ThreePointOrientation.LEFT_TURN);
});

test('Right orientation', () => {
	const a = { x: 0, y: 0 };
	const b = { x: 1, y: 0 };
	const c = { x: 1, y: -1 };
	expect(threePointOrientation(a, b, c)).toBe(ThreePointOrientation.RIGHT_TURN);
});

test('Collinear orientation', () => {
	const a = { x: 0, y: 0 };
	const b = { x: 1, y: 0 };
	const c = { x: 2, y: 0 };
	expect(threePointOrientation(a, b, c)).toBe(ThreePointOrientation.COLLINEAR);
});