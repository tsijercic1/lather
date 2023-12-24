import { type ExplicitLine2D, type ImplicitLine2D, type Line2D, type Point2D, Side } from '$lib/server/common/model';

const offsetPolyline = (polyline: Point2D[], offset: number, side: Side): Point2D[] => {
	const result = [offsetLine({ start: polyline[0], end: polyline[1] }, offset, side)];
	for (let i = 2; i < polyline.length; i++) {
		const line = { start: polyline[i-1], end: polyline[i] };
		const offsetLineResult = offsetLine(line, offset, side);
		result.push(offsetLineResult);
	}

	return [...result.map(line => line.start), result[result.length - 1].end];
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
	const explicitLine = toExplicitLine(line);

	const resultLine = offsetImplicitLine(implicitLine, offset, sign);
	const explicitResultLine = implicitToExplicitLine(resultLine);

	console.log('offsetLine', line, offset, side, preSign, sign, implicitLine, resultLine)
	return line;
}

const toImplicitLine = (line: Line2D): ImplicitLine2D => {
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

const toExplicitLine = (line: Line2D): ExplicitLine2D => {
	const k  = (line.end.y - line.start.y) / (line.end.x - line.start.x);
	const n = line.start.y - k * line.start.x;
	return { k, n };
}

const implicitToExplicitLine = (implicitLine: ImplicitLine2D): ExplicitLine2D => {
	const k = -implicitLine.a / implicitLine.b;
	const n = -implicitLine.c / implicitLine.b;
	return { k, n };
}

const offsetImplicitLine = (implicitLine: ImplicitLine2D, offset: number, sign: number): ImplicitLine2D => {
	const { a, b, c } = implicitLine;
	const d = Math.sqrt(a * a + b * b);
	return {
		a, b, c: c + sign * offset * d
	};
}

export default offsetPolyline;