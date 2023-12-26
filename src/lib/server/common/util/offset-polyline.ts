import { type ImplicitLine2D, type Line2D, type Point2D, Side } from '$lib/server/common/model';
import { threePointOrientation } from '$lib/server/common/util/index';

const offsetPolyline = (polyline: Point2D[], offset: number, side: Side): Point2D[] => {
	const result = [offsetLine({ start: polyline[0], end: polyline[1] }, offset, side)];
	for (let i = 2; i < polyline.length; i++) {
		const line = { start: polyline[i-1], end: polyline[i] };
		const offsetLineResult = offsetLine(line, offset, side);
		result.push(offsetLineResult);
	}
	const points: Point2D[] = [];
	const lines = result.map(line => toImplicitLine(line));
	for(let i = 1; i < lines.length; i++) {
		const line1 = lines[i-1];
		const line2 = lines[i];
		const intersection = getIntersection(line1, line2);
		if (intersection) {
			points.push(intersection);
		} else {
			points.push(result[i].start);
		}
	}
	let resultPoints = [result[0].start, ...points, result[result.length - 1].end];
	if (resultPoints.length > 2) {
		const initialOrientation = threePointOrientation(polyline[0], polyline[1], polyline[2]);
		const resultOrientation = threePointOrientation(resultPoints[0], resultPoints[1], resultPoints[2]);
		const initialEndingOrientation = threePointOrientation(polyline[polyline.length - 3], polyline[polyline.length - 2], polyline[polyline.length - 1]);
		const resultEndingOrientation = threePointOrientation(resultPoints[resultPoints.length - 3], resultPoints[resultPoints.length - 2], resultPoints[resultPoints.length - 1]);

		if (initialOrientation !== resultOrientation) {
			resultPoints = resultPoints.slice(1);
		}
		if (initialEndingOrientation !== resultEndingOrientation) {
			resultPoints = resultPoints.slice(0, resultPoints.length - 1);
		}
	}
	return resultPoints;
}

const offsetLine = (line: Line2D, offset: number, side: Side): Line2D => {
	const preSign = line.start.x === line.end.x ? line.start.y < line.end.y ? 1 : -1 : line.start.x < line.end.x ? -1 : 1;
	const sign = side === Side.RIGHT ? preSign : -preSign;
	if (line.start.x === line.end.x) {
		return {
			start: { x: line.start.x + sign * offset, y: line.start.y },
			end: { x: line.end.x + sign * offset, y: line.end.y }
		};
	}
	if (line.start.y === line.end.y) {
		return {
			start: { x: line.start.x, y: line.start.y + sign * offset },
			end: { x: line.end.x, y: line.end.y + sign * offset }
		};
	}
	const implicitLine = toImplicitLine(line);
	const resultLine = offsetImplicitLine(implicitLine, offset, sign);
	const normalLine1 = getNormalImplicitLineThroughPoint(resultLine, line.start);
	const intersection1 = getIntersection(normalLine1, resultLine);
	const normalLine2 = getNormalImplicitLineThroughPoint(resultLine, line.end);
	const intersection2 = getIntersection(normalLine2, resultLine);
	if (!intersection1 || !intersection2) {
		throw new Error('No intersection found');
	}
	return {
		start: intersection1,
		end: intersection2
	};
}

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
}

export const toImplicitLine = (line: Line2D): ImplicitLine2D => {
	// ax + by + c = 0
	if (line.start.x === line.end.x) {
		return { a: 1, b: 0, c: -line.start.x };
	}
	const k  = (line.end.y - line.start.y) / (line.end.x - line.start.x);
	const a = -k;
	const b = 1;
	const c = k * line.start.x - line.start.y;
	return { a, b, c };
}

export const offsetImplicitLine = (implicitLine: ImplicitLine2D, offset: number, sign: number): ImplicitLine2D => {
	const { a, b, c } = implicitLine;
	const d = Math.sqrt(a * a + b * b);
	return {
		a, b, c: c + sign * offset * d
	};
}

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
}

const isEqualToZero = (value: number): boolean => {
	return Math.abs(value) < Number.EPSILON;
}

export default offsetPolyline;