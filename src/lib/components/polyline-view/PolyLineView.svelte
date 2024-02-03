<script lang="ts">
	import { onMount } from 'svelte';
	import { type Point2D } from '$lib/common/model';
	import { parseDXF } from '$lib/dxf';
	import { generateGCode } from '$lib/common/util';
	import type { IPolylineEntity } from 'dxf-parser';
	interface Line {
		name: string;
		points: Point2D[];
	}

	let width = 500;
	let height = 500;
	let focalX = -250;
	let focalY = -200;
	let scale = 1;
	let isPanning = false;
	let canvas: HTMLCanvasElement;
	let lines: Line[] = [];
	let linesForPath = {
		lines: [] as Line[],
	};
	let toolNumber = 3;
	let feedRate = 10000;
	let spindleSpeed = 12000;
	let mmPerRotation = 1;
	let homeZ = 150;

	const sortLines = (a: Line, b: Line) => {
		// sort lines with starting point farthest from origin first by absolute value
		const aX = a.points[0].x;
		const bX = b.points[0].x;
		if (Math.abs(aX) > Math.abs(bX)) {
			return -1;
		}
		if (Math.abs(aX) < Math.abs(bX)) {
			return 1;
		}
		return 0;
	};

	const updateLinesForPath = (line: Line) => {
		if(linesForPath.lines.find(pat => pat.name === line.name)) {
			// Remove if found
			linesForPath.lines = linesForPath.lines.filter(pat => pat.name !== line.name)
		} else {
			linesForPath.lines = [...linesForPath.lines, line].sort(sortLines)
		}
		refresh();
	};

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

				const polylines: Line[] = [];
				let i = 0;
				for (const entity of dxf.entities) {
					if (entity.type === 'POLYLINE') {
						const polyline: IPolylineEntity = <IPolylineEntity>entity
						const vertices = polyline.vertices;
						const points: Point2D[] = [];
						for (const vertex of vertices) {
							points.push({
								x: vertex.x,
								y: vertex.y
							});
						}
						polylines.push({
							name: "Line " + i++,
							points: points
						});
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

	function drawPolyline(line: Point2D[], color: string = 'black') {
		const ctx = canvas.getContext('2d');
		if (!ctx) {
			throw new Error('Could not get canvas context');
		}
		ctx.strokeStyle = color;
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
			drawPolyline(line.points);
			drawPoint(line.points[0], 'green');
		}
		for (const line of linesForPath.lines) {
			drawPolyline(line.points, 'red');
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

	const generateCodeForPath = () => {
		let linesToPath = [...linesForPath.lines];
		// sort lines with starting point farthest from origin first by absolute value
		linesToPath = linesToPath.sort((a, b) => {
			const aX = a.points[0].x;
			const bX = b.points[0].x;
			if (Math.abs(aX) > Math.abs(bX)) {
				return -1;
			}
			if (Math.abs(aX) < Math.abs(bX)) {
				return 1;
			}
			return 0;
		});
		// reverse line points for odd lines
		linesToPath = linesToPath.map((line, index) => {
			if (index % 2 === 1) {
				return {
					name: line.name,
					points: line.points.reverse()
				};
			}
			return line;
		});
		const points = linesToPath.map(line => line.points).flat();
		const options = {
			toolNumber,
			feedRate,
			spindleSpeed,
			mmPerRotation,
			homeZ,
		};
		const gCode = generateGCode(points, options);
		console.log(gCode);

		const uriContent = "data:application/octet-stream," + encodeURIComponent(gCode);
		window.open(uriContent, 'gcode');
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
	{#each lines.sort(sortLines) as pattern}
		<label for={pattern.name}>
			<input type="checkbox"
						 id={pattern.name}
						 value={pattern}
						 checked={!!linesForPath.lines.find(pat => pat.name === pattern.name)}
						 on:change={() => {updateLinesForPath(pattern)}}
			/>{pattern.name}
		</label>
		<br/>
	{/each}
	<label for="tool_number">Tool number</label>
	<input type="number" id="tool_number" bind:value={toolNumber} min="1" max="8" />
	<br/>
	<label for="feed_rate">Feed rate</label>
	<input type="number" id="feed_rate" bind:value={feedRate} min="1" max="10000" />
	<br/>
	<label for="spindle_speed">Spindle speed</label>
	<input type="number" id="spindle_speed" bind:value={spindleSpeed} min="1" max="10000" />
	<br/>
	<label for="mm_per_rotation">MM per Rotation</label>
	<input type="number" id="mm_per_rotation" bind:value={mmPerRotation} min="0.1" max="10000" />
	<br/>
	<label for="home_z">Home Z</label>
	<input type="number" id="home_z" bind:value={homeZ} min="0" max="300" />
	<br/>
	<button on:click={generateCodeForPath}>Generate GCode</button>
</div>


<style>
    canvas {
        border: 1px solid black;
    }
</style>