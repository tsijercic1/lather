import type { Point2D } from '$lib/common/model';

const homeZ: number = 150.000;

const insertPointsBetweenFarPoints = (points: Point2D[], maxDistance: number): Point2D[] => {
	const newPoints: Point2D[] = [];
	for (let i = 0; i < points.length - 1; i++) {
		const point = points[i];
		const nextPoint = points[i + 1];
		const distance = Math.sqrt(Math.pow(nextPoint.x - point.x, 2) + Math.pow(nextPoint.y - point.y, 2));
		if (distance > maxDistance) {
			const numberOfPoints = Math.floor(distance / maxDistance);
			const xIncrement = (nextPoint.x - point.x) / numberOfPoints;
			const yIncrement = (nextPoint.y - point.y) / numberOfPoints;
			for (let j = 0; j < numberOfPoints; j++) {
				newPoints.push({
					x: point.x + xIncrement * j,
					y: point.y + yIncrement * j
				});
			}
		} else {
			newPoints.push(point);
		}
	}
	newPoints.push(points[points.length - 1]);
	return newPoints;
}

export default function generateGCode(points: Point2D[], toolNumber: number, feedRate: number, plungeRate: number, spindleSpeed: number): string {
	points = insertPointsBetweenFarPoints(points, 5);
	let lineCounter = 0;
	const travel = 0.5;
	let aAxis = 0; // will increase by 360 degrees for every 0.5mm of travel
	let aAxisSign = 1;
	let gcode = '%\n'; // Start of program
	gcode += `O1\n`; // Program number
	gcode += `N${lineCounter++} G00 G21 G90 G54\n`; // G00: Rapid positioning, G21: Metric units, G90: Absolute distance mode, G54: Select coordinate system 1
	gcode += `N${lineCounter++} T${toolNumber} M6\n`; // T: Select tool, M6: Tool change
	gcode += `N${lineCounter++} G00 X0.000 Y0.000 A0.000 S${spindleSpeed} M03\n`; // G00: Rapid positioning, X: X-axis position, Y: Y-axis position, A: A-axis position, S: Spindle speed, M03: Spindle on (clockwise)
	gcode += `N${lineCounter++} G43 H${toolNumber}\n`; // G43: Tool length compensation, H: Tool height offset number
	gcode += `N${lineCounter++} G00 Z${homeZ}\n`; // G00: Rapid positioning, Z: Z-axis position
	gcode += `N${lineCounter++} G01 F${feedRate}\n`; // G01: Linear interpolation, F: Feed rate
	gcode += `N${lineCounter++} G01 X${points[0].x.toFixed(3)} Y${points[0].y.toFixed(3)}\n`; // G01: Linear interpolation, X: X-axis position, Y: Y-axis position
	gcode += `N${lineCounter++} G01 A0.000\n`; // G01: Linear interpolation, A: A-axis position
	gcode += `N${lineCounter++} G01 Z0.000\n`; // G01: Linear interpolation, Z: Z-axis position
	aAxis = 360;
	gcode += `N${lineCounter++} G01 A${aAxis.toFixed(3)}\n`;
	for (let i = 1; i < points.length; i++) {
		const point = points[i];
		const distance = Math.sqrt(Math.pow(point.x - points[i - 1].x, 2) + Math.pow(point.y - points[i - 1].y, 2));
		const aAxisIncrement = (distance / travel) * 360;
		console.log("Distance: ", distance, "Increment: ", aAxisIncrement)
		let nextAAxisValue = aAxis + aAxisIncrement * aAxisSign;
		if (aAxis + aAxisIncrement * aAxisSign > 97_000.000 || aAxis + aAxisIncrement * aAxisSign < 0) {
			aAxisSign *= -1;
		}
		nextAAxisValue = aAxis + aAxisIncrement * aAxisSign;
		gcode += `N${lineCounter++} G01 X${point.x.toFixed(3)} Y${point.y.toFixed(3)} A${nextAAxisValue.toFixed(3)}\n`; // G01: Linear interpolation, X: X-axis position, Y: Y-axis position
		aAxis = nextAAxisValue;
	}
	if (aAxis + aAxisSign * 360 > 97_000 || aAxis + aAxisSign * 360 < 0) {
		aAxisSign *= -1;
	}
	const nextAAxisValue = aAxis + 360 * aAxisSign;
	gcode += `N${lineCounter++} G01 A${nextAAxisValue}\n`;
	gcode += `N${lineCounter++} G00 Z${homeZ}\n`; // G00: Rapid positioning, Z: Z-axis position
	gcode += `N${lineCounter++} G00 G91 G28 Z${homeZ}\n`; // G00: Rapid positioning, G91: Incremental distance mode, G28: Return to home position, Z: Z-axis position
	gcode += `N${lineCounter++} G49 G90\n`; // G49: Cancel tool length compensation, G90: Absolute distance mode
	gcode += `N${lineCounter++} G28 Y0\n`; // G28: Return to home position, Y: Y-axis position
	gcode += `N${lineCounter++} M30\n`; // M30: End of program
	gcode += '%\n'; // End of program
	return gcode;
}