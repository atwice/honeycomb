window.addEventListener("load", main, false);

const sqrt3 = Math.sqrt(3);

function main()
{
	let canvas = document.getElementById("canvas")
	let ctx = canvas.getContext('2d')
	let width = window.innerWidth;
	let height = window.innerHeight;
	canvas.width = width;
	canvas.height = height;
	canvas.addEventListener('mousedown', onMouseDown);
	canvas.addEventListener('mouseup', onMouseUp);
	canvas.addEventListener('mousemove', onMouseMove);
	canvas.addEventListener( 'wheel', onMouseWheel)
	let isDragging = false;

	let honeycomb = createHoneycomb(ctx, 10, 40);
	let camera = createCamera(width, height);
	draw();

	function draw()
	{
		ctx.clearRect(0,0, width, height);
		ctx.save();
		camera.setupContext(ctx);
		honeycomb.drawGuides();
		ctx.restore();

		requestAnimationFrame( draw );
	}

	function onMouseDown(e)
	{
		isDragging = true;
	}

	function onMouseUp(e)
	{
		isDragging = false;
	}

	function onMouseMove(e)
	{
		if( isDragging ) {
			camera.logicCenter.x += e.movementX;
			camera.logicCenter.y += e.movementY;
		}
	}

	function onMouseWheel(e)
	{
		if( !isDragging ) {
			camera.adjustZoom( -e.deltaY * 0.0003, null );
		}
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
		ctx.font = "20px serif";
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
				ctx.strokeText(q + "," + r , x, y);

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

function createCamera(_w, _h)
{
	const MIN_ZOOM = 0.5;
	const MAX_ZOOM = 2.5;
	return {
		logicCenter : { x: 0, y : 0 },
		zoom : 1,
		size : { x : _w, y : _h },

		screenToLogic : function( screenCoord ) {
			return {
				x : screenCoord.x / this.zoom - this.logicCenter.x,
				y : screenCoord.y / this.zoom - this.logicCenter.y
			};
		},

		logicToScreen : function( logicCoord ) {
			return {
				x : (logicCoord.x - this.logicCenter.x) * this.zoom + this.size.x / 2,
				y : (logicCoord.y - this.logicCenter.y) * this.zoom + this.size.y / 2
			}
		},

		setupContext : function( ctx ) {
			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.translate( this.logicCenter.x + this.size.x/ 2, this.logicCenter.y + this.size.y / 2);
			ctx.scale( this.zoom, this.zoom );
		},

		adjustZoom : function(zoomAmount, zoomFactor)
		{
			if( zoomAmount ) {
				this.zoom += zoomAmount;
			} else if( zoomFactor ) {
				this.zoom = zoomFactor * this.zoom;
			}
			this.zoom = Math.min( this.zoom, MAX_ZOOM );
			this.zoom = Math.max( this.zoom, MIN_ZOOM );
		}
	}
}