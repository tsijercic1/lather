import { threePointCross } from '$lib/common/util/index';
import { type Point2D, ThreePointOrientation } from '$lib/common/model';

const threePointOrientation = (p1: Point2D, p2: Point2D, p3: Point2D): ThreePointOrientation => {
	const pointCross = threePointCross(p1, p2, p3);
	if (pointCross > 0) {
		return ThreePointOrientation.LEFT_TURN;
	} else if (pointCross < 0) {
		return ThreePointOrientation.RIGHT_TURN;
	}
	return ThreePointOrientation.COLLINEAR;
}

export default threePointOrientation;
