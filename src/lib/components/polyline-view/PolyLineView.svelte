<script lang="ts">
	import { onMount } from 'svelte';
	import { type Point2D, Side } from '$lib/common/model';
	import { parseDXF } from '$lib/dxf';
	import offsetPolyline, { findIntersections } from '$lib/common/util/offset-polyline';

	let width = 500;
	let height = 500;
	let focalX = -250;
	let focalY = -200;
	let scale = 1;
	let isPanning = false;
	let canvas: HTMLCanvasElement;
	let lines: Point2D[][] = [];

	onMount(() => {
		const { innerWidth, innerHeight } = window;
		width = innerWidth * 0.8;
		height = innerHeight * 0.8;

		const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');
		if (ctx === null) {
			throw new Error('Could not get canvas context');
		}
		canvas.setAttribute('width', width.toString());
		canvas.setAttribute('height', height.toString());
		drawXAxe();
		drawYAxe();

		const dropArea = window;
		dropArea.addEventListener('dragover', (event) => {
			event.stopPropagation();
			event.preventDefault();
			// Style the drag-and-drop as a "copy file" operation.
			if (event.dataTransfer === null) {
				return;
			}
			event.dataTransfer.dropEffect = 'copy';
		});

		dropArea.addEventListener('drop', (event) => {
			event.stopPropagation();
			event.preventDefault();
			if (event.dataTransfer === null) {
				return;
			}
			const fileList = event.dataTransfer.files;
			if (fileList.length === 0) {
				return;
			}
			const file = fileList[0];
			const reader = new FileReader();
			reader.readAsText(file, 'UTF-8');
			reader.onload = (event) => {
				const result = event.target?.result;
				if (typeof result !== 'string') {
					return;
				}
				if (result.length === 0) {
					return;
				}
				const dxf = parseDXF(result);
				if (!dxf) {
					return;
				}

				const polylines: Point2D[][] = [];
				for (const entity of dxf.entities) {
					if (entity.type === 'POLYLINE') {
						const vertices = entity.vertices;
						const points: Point2D[] = [];
						for (const vertex of vertices) {
							points.push({
								x: vertex.x,
								y: vertex.y
							});
						}
						polylines.push(points);
						const offsetLine = offsetPolyline(points, 10, Side.RIGHT);
						polylines.push(offsetLine);
					}
				}
				if (polylines.length === 0) {
					return;
				}
				lines = polylines;
				refresh();
			};
			reader.onerror = (event) => {
				console.error('File could not be read! Code ' + event.target?.error?.code);
			};
		});
	});


	function drawXAxe() {
		const xAxe = [
			{ x: (-canvas.width / 2 - focalX) / scale, y: 0 },
			{ x: (canvas.width / 2 - focalX) / scale, y: 0 }
		];
		drawPolyline(xAxe);
	}

	function drawYAxe() {
		const yAxe = [
			{ x: 0, y: (-canvas.height / 2 - focalY) / scale },
			{ x: 0, y: (canvas.height / 2 - focalY) / scale }
		];
		drawPolyline(yAxe);
	}

	function drawPolyline(line: Point2D[]) {
		const ctx = canvas.getContext('2d');
		if (!ctx) {
			throw new Error('Could not get canvas context');
		}
		ctx.strokeStyle = 'black';
		ctx.lineWidth = 1;
		ctx.beginPath();
		for (let i = 0; i < line.length; i++) {
			const point = line[i];
			const x = canvas.width / 2 + (point.x * scale) + focalX;
			const y = canvas.height / 2 - ((point.y * scale) + focalY);
			if (i === 0) {
				ctx.moveTo(x, y);
			} else {
				ctx.lineTo(x, y);
			}
		}
		ctx.stroke();
	}

	function zoom(event: WheelEvent) {
		event.preventDefault();
		const { deltaY, clientX, clientY } = event;
		const scaleFactor = 1 + (Math.abs(deltaY) / 1000);
		const x = clientX - canvas.offsetLeft;
		const y = clientY - canvas.offsetTop;
		const coordinateX = (x - canvas.width / 2 - focalX) / scale;
		const coordinateY = (canvas.height / 2 - y - focalY) / scale;
		if (deltaY > 0) {
			scale /= scaleFactor;
			focalX += coordinateX * (scale - scale / scaleFactor);
			focalY += coordinateY * (scale - scale / scaleFactor);
		} else {
			focalX -= coordinateX * (scale - scale / scaleFactor);
			focalY -= coordinateY * (scale - scale / scaleFactor);
			scale *= scaleFactor;
		}
		refresh();
	}

	function pan(event: MouseEvent) {
		if (!isPanning) {
			return;
		}
		event.preventDefault();
		const { movementX, movementY } = event;
		focalX += movementX;
		focalY -= movementY;
		refresh();
	}

	function startPan(event: MouseEvent) {
		event.preventDefault();
		isPanning = true;
	}

	function stopPan(event: MouseEvent) {
		event.preventDefault();
		isPanning = false;
	}

	function drawSystem() {
		drawXAxe();
		drawYAxe();
	}

	function drawState() {
		for (const line of lines) {
			drawPolyline(line);
			const intersections = findIntersections(line);
			// for (const intersection of intersections) {
			// 	drawPoint(intersection.line1.start, 'blue');
			// 	drawPoint(intersection.line1.end, 'blue');
			// 	drawPoint(intersection.line2.start, 'green');
			// 	drawPoint(intersection.line2.end, 'green');
			// 	drawPoint(intersection);
			// }
		}
	}

	function drawPoint(point: Point2D, color: string = 'red') {
		const ctx = canvas.getContext('2d');
		if (!ctx) {
			throw new Error('Could not get canvas context');
		}
		ctx.strokeStyle = color;
		ctx.lineWidth = 1;
		ctx.beginPath();
		const x = canvas.width / 2 + (point.x * scale) + focalX;
		const y = canvas.height / 2 - ((point.y * scale) + focalY);
		ctx.arc(x, y, 5, 0, 2 * Math.PI, false);
		ctx.fillStyle = color;
		ctx.fill();
	}

	function refresh() {
		if (!canvas) {
			return;
		}
		const ctx = canvas.getContext('2d');
		if (!ctx) {
			throw new Error('Could not get canvas context');
		}
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		drawSystem();
		drawState();
	}


</script>

<div>
	<canvas
		bind:this={canvas}
		on:wheel={zoom}
		on:mousedown={startPan}
		on:mouseup={stopPan}
		on:mouseleave={stopPan}
		on:mousemove={pan}
	>
	</canvas>
</div>


<style>
    canvas {
        border: 1px solid black;
    }
</style>