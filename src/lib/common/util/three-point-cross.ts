import type { Point2D } from '$lib/common/model';

const threePointCross = (a: Point2D, b: Point2D, c: Point2D): number => {
	return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

export default threePointCross;
