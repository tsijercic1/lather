<script lang="ts">
	import { onMount } from 'svelte';
	import type { Point2D } from '$lib/common/model';

	let width = 500;
	let height = 500;
	let focalX = -250;
	let focalY = -200;
	let scale = 1;
	let canvas: HTMLCanvasElement;
	let line: Point2D[] = [{
		x: 0,
		y: 0
	}, {
		x: 100,
		y: 100
	}];

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
		drawPolyline(line);
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
		ctx.closePath();
		ctx.stroke();
	}



</script>

<canvas
	bind:this={canvas}

>
</canvas>


<style>
    canvas {
        border: 1px solid black;
    }
</style>