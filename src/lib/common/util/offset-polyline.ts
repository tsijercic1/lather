import { type ImplicitLine2D, type Line2D, type Point2D, Side } from '$lib/common/model';
import { threePointOrientation } from '$lib/common/util/index';

const offsetPolyline = (polyline: Point2D[], offset: number, side: Side): Point2D[] => {
	const sign = side === Side.RIGHT ? 1 : -1;
	let result = [offsetLine({ start: polyline[0], end: polyline[1] }, offset, side)];
	for (let i = 2; i < polyline.length; i++) {
		const line = { start: polyline[i - 1], end: polyline[i] };
		const offsetLineResult = offsetLine(line, offset, side);
		result.push(offsetLineResult);
	}
	// get max X
	// get min X
	const maxX = Math.max(...result.map(line => Math.max(line.start.x, line.end.x)));
	const minX = Math.min(...result.map(line => Math.min(line.start.x, line.end.x)));
	const endOffset = sign > 0 ? Math.abs(maxX - result[result.length - 1].end.x) : Math.abs(result[result.length - 1].end.x - minX);
	const startOffset = sign > 0 ? Math.abs(result[0].start.x - minX) : Math.abs(maxX - result[0].start.x);
	result = [{
		start: { x: result[0].start.x + (offset + startOffset) * sign, y: result[0].start.y },
		end: result[0].start
	}].concat([...result])
	result.push({ start: result[result.length - 1].end, end: { x: result[result.length - 1].end.x + (offset + endOffset) * sign, y: result[result.length - 1].end.y }});
	let counter = 0;
	// for (let i = 0; i < result.length; i++) {
	// 	if (counter > 100 * result.length) {
	// 		break
	// 	}
	// 	for (let j = i + 1; j < result.length; j++) {
	// 		if (counter > 100 * result.length) {
	// 			break
	// 		}
	// 		if (isSegmentIntersection(result[i], result[j])) {
	// 			counter++;
	// 			const intersection = getIntersection(toImplicitLine(result[i]), toImplicitLine(result[j]));
	// 			if (intersection && result[i].end.x !== intersection.x && result[i].end.y !== intersection.y && result[j].start.x !== intersection.x && result[j].start.y !== intersection.y) {
	// 				result[i].end = intersection;
	// 				result[j].start = intersection;
	// 				result = result.slice(0, i + 1).concat(result.slice(j));
	// 				j = i;
	// 			}
	// 		}
	// 	}
	// }
	const lines = result.map(line => toImplicitLine(line));
	const points: Point2D[] = [];
	for (let i = 1; i < lines.length; i++) {
		const line1 = lines[i - 1];
		const line2 = lines[i];
		const intersection = getIntersection(line1, line2);
		if (intersection && false) {
			points.push(intersection);
		} else {
			points.push(result[i].start);
			points.push(result[i].end);
		}
	}

	let resultPoints = [result[0].start, ...points, result[result.length - 1].end];
	// for(let i = 1; i < resultPoints.length; i++) {
	// 	for(let j = i + 2; j < resultPoints.length; j++) {
	// 		if (isSegmentIntersection({ start: resultPoints[i - 1], end: resultPoints[i] }, { start: resultPoints[j - 1], end: resultPoints[j] })) {
	// 			const intersection = getIntersection(toImplicitLine({ start: resultPoints[i - 1], end: resultPoints[i] }), toImplicitLine({ start: resultPoints[j - 1], end: resultPoints[j] }));
	// 			if (intersection) {
	// 				resultPoints[i] = intersection;
	// 				resultPoints[j] = intersection;
	// 				resultPoints = resultPoints.slice(0, i + 1).concat(resultPoints.slice(j + 1));
	// 				j = i + 1;
	// 			}
	// 		}
	// 	}
	// }


	// if (resultPoints.length > 2) {
	// 	const initialOrientation = threePointOrientation(polyline[0], polyline[1], polyline[2]);
	// 	const resultOrientation = threePointOrientation(resultPoints[0], resultPoints[1], resultPoints[2]);
	// 	const initialEndingOrientation = threePointOrientation(polyline[polyline.length - 3], polyline[polyline.length - 2], polyline[polyline.length - 1]);
	// 	const resultEndingOrientation = threePointOrientation(resultPoints[resultPoints.length - 3], resultPoints[resultPoints.length - 2], resultPoints[resultPoints.length - 1]);
	//
	// 	if (initialOrientation !== resultOrientation) {
	// 		resultPoints = resultPoints.slice(1);
	// 	}
	// 	if (initialEndingOrientation !== resultEndingOrientation) {
	// 		resultPoints = resultPoints.slice(0, resultPoints.length - 1);
	// 	}
	// }
	return resultPoints;
};

export interface Intersection {
	x: number;
	y: number;

	line1: Line2D;
	line1StartIndex: number;
	line1EndIndex: number;
	line2: Line2D;
	line2StartIndex: number;
	line2EndIndex: number;
}

export const findIntersections = (points: Point2D[]): Intersection[] => {
	const result: Intersection[] = [];
	for (let i = 1; i < points.length; i++) {
		const line1 = { start: points[i - 1], end: points[i] };
		let intersectionPoint = undefined;
		for (let j = i + 2; j < points.length; j++) {
			const line2 = { start: points[j - 1], end: points[j] };
			if (isSegmentIntersection(line1, line2)) {
				const intersection = getIntersection(toImplicitLine(line1), toImplicitLine(line2));
				if (intersection) {
					intersectionPoint = {
						x: intersection.x,
						y: intersection.y,
						line1,
						line1StartIndex: i - 1,
						line1EndIndex: i,
						line2,
						line2StartIndex: j - 1,
						line2EndIndex: j
					};
				}
			}
		}
		if (intersectionPoint) {
			result.push(intersectionPoint);
		}
	}
	return result;
};

export const isSegmentIntersection = (line1: Line2D, line2: Line2D): boolean => {
	if ((line1.start.x > line2.start.x && line1.start.x > line2.end.x && line1.end.x > line2.start.x && line1.end.x > line2.end.x) ||
		(line1.start.x < line2.start.x && line1.start.x < line2.end.x && line1.end.x < line2.start.x && line1.end.x < line2.end.x) ||
		(line1.start.y > line2.start.y && line1.start.y > line2.end.y && line1.end.y > line2.start.y && line1.end.y > line2.end.y) ||
		(line1.start.y < line2.start.y && line1.start.y < line2.end.y && line1.end.y < line2.start.y && line1.end.y < line2.end.y) ||
		(threePointOrientation(line1.start, line1.end, line2.start) === threePointOrientation(line1.start, line1.end, line2.end))) {
		return false;
	}
	return !!getIntersection(toImplicitLine(line1), toImplicitLine(line2));
};

const offsetLine = (line: Line2D, offset: number, side: Side): Line2D => {
	const a = line.start;
	const b = line.end;
	const segmentAngle = Math.atan2(a.y - b.y, a.x - b.x);
	const offsetAngle = segmentAngle - Math.PI / 2;
	const sign = side === Side.LEFT ? 1 : -1;
	const xOffset = sign * offset * Math.cos(offsetAngle);
	const yOffset = sign * offset * Math.sin(offsetAngle);
	const start = { x: line.start.x + xOffset, y: line.start.y + yOffset };
	const end = { x: line.end.x + xOffset, y: line.end.y + yOffset };
	return { start, end };
};

export const getIntersection = (line1: ImplicitLine2D, line2: ImplicitLine2D): Point2D | null => {
	const { a: a1, b: b1, c: c1 } = line1;
	const { a: a2, b: b2, c: c2 } = line2;
	const d = a1 * b2 - a2 * b1;
	if (d === 0) {
		return null;
	}
	const x = (b1 * c2 - b2 * c1) / d;
	const y = (a2 * c1 - a1 * c2) / d;
	return { x, y };
};

export const toImplicitLine = (line: Line2D): ImplicitLine2D => {
	// ax + by + c = 0
	if (line.start.x === line.end.x) {
		return { a: 1, b: 0, c: -line.start.x };
	}
	const k = (line.end.y - line.start.y) / (line.end.x - line.start.x);
	const a = -k;
	const b = 1;
	const c = k * line.start.x - line.start.y;
	return { a, b, c };
};

export const offsetImplicitLine = (implicitLine: ImplicitLine2D, offset: number, sign: number): ImplicitLine2D => {
	const { a, b, c } = implicitLine;
	const d = Math.sqrt(a * a + b * b);
	return {
		a, b, c: c + sign * offset * d
	};
};

export const getNormalImplicitLineThroughPoint = (implicitLine: ImplicitLine2D, point: Point2D): ImplicitLine2D => {
	const { a, b } = implicitLine;
	if (b === 0) {
		return {
			a: 0, b: 1, c: isEqualToZero(point.y) ? 0 : -point.y
		};
	}
	const k = -(a / b);
	const n = point.y + k * point.x;

	return {
		a: k, b: 1, c: isEqualToZero(n) ? 0 : -n
	};
};

const isEqualToZero = (value: number): boolean => {
	return Math.abs(value) < Number.EPSILON;
};

export default offsetPolyline;