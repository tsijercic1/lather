import type { Point2D } from '$lib/common/model/index';

export type Line2D = {
	start: Point2D;
	end: Point2D;
}

export type ImplicitLine2D = {
	a: number;
	b: number;
	c: number;
}

export type ExplicitLine2D = {
	k: number;
	n: number;
}
