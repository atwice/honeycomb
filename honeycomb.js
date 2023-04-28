window.addEventListener("load", main, false);

const sqrt3 = Math.sqrt(3);

function main()
{
	let canvas = document.getElementById("canvas")
	let ctx = canvas.getContext('2d')

	let honeycomb = createHoneycomb(ctx, 10, 40);
	draw();

	function draw()
	{
		let width = window.innerWidth;
		let height = window.innerHeight;
		canvas.width = width;
		canvas.height = height;
		ctx.translate(width / 2, height / 2);

		honeycomb.drawGuides();

		//requestAnimationFrame( draw );
	}
}

function createHoneycomb(ctx, N, halfWidth)
{
	const width = 2*halfWidth;
	const halfHeight = sqrt3*halfWidth;

	function _drawGuides()
	{
		ctx.lineWidth = 1;
		ctx.strokeStyle = "#777";
		ctx.setLineDash([7, 7]);
		ctx.beginPath();
		for(var q = -N; q <= N; q++) {
			for(var r = -N; r <= N; r++) {
				const coord = createCoord(q, r);
				if( coord.ringN > N ) {
					continue;
				}
				const x = width*coord.x;
				const y = width*coord.y;
				//ctx.strokeText(q + "," + r , x, y);

				ctx.moveTo(x+halfWidth, y-halfHeight);
				ctx.lineTo(x+width, y);
				ctx.lineTo(x+halfWidth, y+halfHeight);
				ctx.moveTo(x+width, y);
				ctx.lineTo(x + 2*width, y);
			}
		}
		ctx.stroke();
	}

	let that = {
		drawGuides : _drawGuides
	};
	return that;
}

function createCoord(_q, _r)
{
	const _s = 0 - _q - _r;
	return {
		q : _q,
		r : _r,
		s : _s,
		ringN : Math.max(Math.abs(_q), Math.abs(_r), Math.abs(_s)),
		x : 3*_q/2,
		y : sqrt3*_r + sqrt3*_q/2,
	};
}
