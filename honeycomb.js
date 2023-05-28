window.addEventListener("load", main, false);

const sqrt3 = Math.sqrt(3);
const nf = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
	maximumFractionDigits: 0,
	roundingIncrement: 5,
});
const pf = new Intl.NumberFormat("en-US", {
	style: "percent",
	maximumFractionDigits: 1
});

function main()
{
	let settings = {
		numberOfCells : 1,
		depositOfCell : 10000,
		organizationFee : 0.1,
		partnerProgramFee : 0.3,
		profitability : 0.1,
		cellZeroTradingProfit : true,
		organizationFeeFromFullProfit : true
	};
	
	let canvas = document.getElementById("canvas")
	let ctx = canvas.getContext('2d')
	let width = window.innerWidth;
	let height = window.innerHeight;
	canvas.width = width;
	canvas.height = height;
	// работа с мышью
	let isDragging = false;
	canvas.addEventListener('mousedown', onMouseDown);
	canvas.addEventListener('mouseup', onMouseUp);
	canvas.addEventListener('mousemove', onMouseMove);
	canvas.addEventListener('wheel', onMouseWheel);
	// поддержка тач-скрина
	let dragStart = {x:0, y:0};
	canvas.addEventListener('touchstart', handleTouchStart)
	canvas.addEventListener('touchend',  handleTouchEnd)
	canvas.addEventListener('touchmove', handleTouchMove, false)
	let initialPinchDistance = null;

	let calculateButton = document.getElementById("calculateButton");
	calculateButton.addEventListener('click', onCalculateButton);

	let strategyModal = document.getElementById("strategy-modal");

	let honeycomb = createHoneycomb(ctx, 20, 40);
	let camera = createCamera(width, height, canvas);
	let allCells = [];
	draw();

	let strategyVideoEurUsd = document.getElementById("strategy-video_eur_usd");
	let strategyVideoUsdChf = document.getElementById("strategy-video_usd_chf");
	let strategyVideoGbpUsd = document.getElementById("strategy-video_gbp_usd");

	document.getElementById("lane_eur_usd").onclick = (ev) => showStrategy(strategyVideoEurUsd);
	document.getElementById("lane_usd_chf").onclick = (ev) => showStrategy(strategyVideoUsdChf);
	document.getElementById("lane_gbp_usd").onclick = (ev) => showStrategy(strategyVideoGbpUsd);

	var cellModalDialog = createCentralCellModal(settings);

	document.getElementById("close-strategy").onclick = (ev) => {
		strategyModal.style.visibility = "hidden";
		cellModalDialog.show();
	}

	function showStrategy(videoElement)
	{
		strategyVideoEurUsd.style.display="none";
		strategyVideoUsdChf.style.display="none";
		strategyVideoGbpUsd.style.display="none";
		videoElement.currentTime = 0;
		videoElement.style.display="block";

		cellModalDialog.close();
		strategyModal.style.visibility = "visible";
		videoElement.play();
	}

	function draw()
	{
		ctx.clearRect(0,0, width, height);
		ctx.save();
		camera.setupContext(ctx);

		honeycomb.drawGuides();
		allCells.forEach(cell => honeycomb.drawCell(cell));
		honeycomb.drawSelection();

		ctx.restore();
	}

	let wasMoved = false;
	function onMouseDown(e)
	{

		isDragging = true;
	}

	function onMouseUp(e)
	{
		if( !wasMoved ) {
			const selected = honeycomb.getSelectedCell();
			if( selected.q == 0 && selected.r == 0 ) {
				cellModalDialog.updateSettings(settings);
				cellModalDialog.show();
			}
		}
		isDragging = false;
		wasMoved = false;
	}

	function onMouseMove(e)
	{
		if( isDragging ) {
			if( e.movementX != 0 && e.movementY != 0 ) {
				wasMoved = true;
			}
			camera.logicCenter.x += e.movementX;
			camera.logicCenter.y += e.movementY;
			requestAnimationFrame( draw );
		} else {
			const canvasRect = canvas.getBoundingClientRect();
			honeycomb.onHover( camera.screenToLogic( {x: e.clientX - canvasRect.x, y: e.clientY - canvasRect.y } ) );
			requestAnimationFrame( draw );
		}
	}

	function onMouseWheel(e)
	{
		if( !isDragging ) {
			camera.adjustZoom( -e.deltaY * 0.0003, null );
			requestAnimationFrame( draw );
		}
	}

	function handleTouchStart(e)
	{
		dragStart = { x: e.touches[0].clientX - camera.logicCenter.x, y: e.touches[0].clientY - camera.logicCenter.y};
		isDragging = true;
	}
	
	function handleTouchEnd(e)
	{
		isDragging = false;
	}

	function handleTouchMove(e)
	{
		if ( e.touches.length == 1 ) {
			handleTouchMoveSingle(e)
		} else if (e.type == "touchmove" && e.touches.length == 2) {
			isDragging = false
			handlePinch(e)
		}
	}
	
	function handleTouchMoveSingle(e)
	{
		if( isDragging ) {
			camera.logicCenter.x = e.touches[0].clientX- dragStart.x;
			camera.logicCenter.y = e.touches[0].clientY- dragStart.y;
			requestAnimationFrame( draw );
		}
	}

	function handlePinch(e)
	{
		e.preventDefault();
		
		var touch = e.originalEvent.touches || e.originalEvent.changedTouches;
		
		// This is distance squared, but no need for an expensive sqrt as it's only used in ratio
		let currentDistance = (touch[0].clientX - touch[1].clientX)**2 + (touch[0].clientY - touch[1].clientY)**2;
		
		if (initialPinchDistance == null) {
			initialPinchDistance = currentDistance
		} else {
			camera.adjustZoom( null, currentDistance/initialPinchDistance );
			requestAnimationFrame( draw );
		}
	}

	function onCalculateButton()
	{
		settings.numberOfCells = document.getElementById("numberOfCells").value - 0;
		settings.depositOfCell = document.getElementById("depositOfCell").value - 0;
		settings.organizationFee = document.getElementById("organizationFee").value / 100;
		settings.partnerProgramFee = document.getElementById("partnerProgramFee").value / 100;
		settings.profitability = document.getElementById("profitability").value / 100;
		settings.cellZeroTradingProfit = document.getElementById("cellZeroTradingProfit").checked;
		settings.organizationFeeFromFullProfit = document.getElementById("organizationFeeFromFullProfit").checked;

		allCells = calculateHoneycomb(settings);
		requestAnimationFrame( draw );
	}
}

function createHoneycomb(ctx, N, halfWidth)
{
	const width = 2*halfWidth;
	const halfHeight = sqrt3*halfWidth;
	const ringBackground = [
		"#EE7809", // 0
		"#B8B6C4", // 1
		"#A09DB0", // 2
		"#88859D", // 3
		"#706C89", // 4
		"#595475", // 5
		"#413B61", // 6
		"#29234E", // 7
		"#1C1641", // 8
		"#140F30", // 9
		"#100A31", // 10
	];
	let _selectedCell = createCoord(0, 0);

	return {
		drawGuides : _drawGuides,
		drawCell: _drawCell,
		drawSelection: _drawSelection,
		onHover: _onHover,
		getSelectedCell: () => _selectedCell
	};

	function _drawGuides()
	{
		ctx.save();
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

				ctx.moveTo(x+halfWidth, y-halfHeight);
				ctx.lineTo(x+width, y);
				ctx.lineTo(x+halfWidth, y+halfHeight);
				ctx.moveTo(x+width, y);
				ctx.lineTo(x + 2*width, y);
			}
		}
		ctx.stroke();
		ctx.restore();
	}

	function _drawCell(cell)
	{
		ctx.lineWidth = 1;
		ctx.strokeStyle = "#110A3A";
		ctx.fillStyle = ringBackground[Math.min(10, cell.coord.ringN)];

		const x = width*cell.coord.x;
		const y = width*cell.coord.y;
		_drawHex(x, y, true);
		
		ctx.font = "20px noserif";
		ctx.fillStyle = "#fff";
		ctx.textAlign = "center";
		const cellText = nf.format(cell.fullProfit());
		ctx.fillText(cellText, x, y);
		ctx.fillStyle = "#30ff80";
		const percentText = pf.format(cell.profitPercent);
		ctx.fillText(percentText, x, y+20);
	}

	function _drawSelection()
	{
		const x = width*_selectedCell.x;
		const y = width*_selectedCell.y;
		ctx.lineWidth = 2;
		ctx.strokeStyle = "#00EEFF";
		_drawHex(x, y, false);
	}

	function _drawHex(x, y, needFill)
	{
		ctx.beginPath();
		ctx.moveTo(x+halfWidth, y-halfHeight);
		ctx.lineTo(x+width, y);
		ctx.lineTo(x+halfWidth, y+halfHeight);
		ctx.lineTo(x-halfWidth, y+halfHeight);
		ctx.lineTo(x-width, y);
		ctx.lineTo(x-halfWidth, y-halfHeight);
		ctx.lineTo(x+halfWidth, y-halfHeight);
		if( needFill ) {
			ctx.fill();
		}
		ctx.stroke();
	}

	function _onHover(coord)
	{
		_selectedCell = pixelToCell(coord);
	}

	function pixelToCell(coord)
	{
		const q = coord.x / width * 2 / 3;
		const r = q/2 - coord.y / width / sqrt3;
		return createCoord( Math.round(q), -Math.round(r) );
	}
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
		hash: "" + _q + ":" + _r,
		isEqual: function(cell) { return cell.q == this.q && cell.r == this.r },
	};
}

function createCamera(_w, _h, _canvas)
{
	const MIN_ZOOM = 0.5;
	const MAX_ZOOM = 2.5;
	const canvasRect = _canvas.getBoundingClientRect();
	return {
		logicCenter: {x: 0, y: 0},
		zoom : 1,
		size : { x : _w, y : _h },

		screenToLogic : function( screenCoord ) {
			return {
				x : ( screenCoord.x - canvasRect.width / 2 - this.logicCenter.x) / this.zoom ,
				y : ( screenCoord.y - canvasRect.height / 2 - this.logicCenter.y) / this.zoom 
			};
		},

		logicToScreen : function( logicCoord ) {
			// TODO: требуется отладить
			return {
				x : (logicCoord.x - window.innerWidth / 2) * this.zoom + this.size.x / 2,
				y : (logicCoord.y - window.innerHeight / 2) * this.zoom + this.size.y / 2
			}
		},

		setupContext : function( ctx ) {
			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.translate( this.logicCenter.x + this.size.x/ 2, this.logicCenter.y + this.size.y / 2);
			ctx.scale( this.zoom, this.zoom );
		},

		adjustZoom : function(zoomAmount, zoomFactor)
		{
			zoomFactor = (zoomFactor > 1 ? 1.02 : 0.98 );
			if( zoomAmount ) {
				this.zoom += zoomAmount;
			} else if( zoomFactor ) {
				this.zoom *= zoomFactor;
			}
			this.zoom = Math.min( this.zoom, MAX_ZOOM );
			this.zoom = Math.max( this.zoom, MIN_ZOOM );
		}
	}
}

function isCornerCell(coord)
{
	return coord.q == 0 || coord.r == 0 || coord.s == 0;
}

function isCornerNeighbour(coord)
{
	return Math.abs(coord.q) == 1 || Math.abs(coord.r) == 1 || Math.abs(coord.s) == 1;
}

function rotate60( coord, n )
{
	if( n < 0 ) {
		n += 6;
	}
	for( var i = 0; i < n; i++ ) {
		coord = createCoord( -coord.r, -coord.s );
	}
	return coord;
}

// функция вычисляет массив ячеек партнеров в партнерской программе
function cellPartners(coord)
{
	if( coord.ringN == 0 ) {
		return [];
	}
	if( coord.ringN == 1 ) {
		return [createCoord(0, 0)];
	}
	// угловая ячейка на любом кольце
	if( isCornerCell(coord) ) {
		// вращаем на север (0, ringN, -ringN). Потом прибавляем известные смещения, вращаем обратно
		let rotation = 0;
		while( !(coord.q == 0 && coord.r > 0) ) {
			coord = rotate60(coord, 1);
			rotation += 1;
		}
		return [
			rotate60(createCoord(coord.q, coord.r-1), -rotation),
			rotate60(createCoord(coord.q-1, coord.r-1), -rotation),
			rotate60(createCoord(coord.q+1, coord.r-2), -rotation),
		];
	}

	// вращаем так, чтобы q == ringN
	let rotation = 0;
	const ringN = coord.ringN;
	while( coord.q != ringN ) {
		coord = rotate60(coord, 1);
		rotation += 1;
	}

	// не угол во втором кольце
	if( ringN == 2 ) {
		return [
			rotate60(createCoord(1, 0), -rotation),
			rotate60(createCoord(1, -1), -rotation),
			createCoord(0, 0),
		];
	}
	// кольцо 3+ рядом с углом - один из соседей на том же кольце.
	// Зависит от
	if( isCornerNeighbour(coord) ) {
		if( coord.r == -1 ) {
			return [
				rotate60(createCoord(ringN-2, 0), -rotation), // через кольцо
				rotate60(createCoord(ringN-1, 0), -rotation),
				rotate60(createCoord(ringN-1, -1), -rotation),
				rotate60(createCoord(ringN-1, -2), -rotation),
			];
		} else {
			return [
				rotate60(createCoord(ringN-2, 2-ringN), -rotation), // через кольцо
				rotate60(createCoord(ringN-1, coord.r), -rotation),
				rotate60(createCoord(ringN-1, coord.r+1), -rotation),
				rotate60(createCoord(ringN-1, coord.r+2), -rotation),
			];
		}
	
	}
	// else
	// кольцо 4+. Ячейка не рядом с углом. Всегда есть 4 соседа + через кольцо
	return [
		rotate60(createCoord(coord.q-1, coord.r-1), -rotation),
		rotate60(createCoord(coord.q-1, coord.r), -rotation),
		rotate60(createCoord(coord.q-1, coord.r+1), -rotation),
		rotate60(createCoord(coord.q-1, coord.r+2), -rotation),
		rotate60(createCoord(coord.q-2, coord.r+1), -rotation), // через кольцо
	];
}

function nextNeighbour(coord)
{
	if(coord.r == coord.ringN && coord.s < 0) {
		return createCoord(coord.q-1, coord.r);
	}
	if(coord.q == -coord.ringN && coord.r > 0) {
		return createCoord(coord.q, coord.r-1);
	}
	if(coord.s == coord.ringN && coord.q < 0) {
		return createCoord(coord.q+1, coord.r-1);
	}
	if(coord.r == -coord.ringN && coord.s > 0) {
		return createCoord(coord.q+1, coord.r);
	}
	if(coord.q == coord.ringN && coord.r < 0) {
		return createCoord(coord.q, coord.r+1);
	}
	if(coord.s == -coord.ringN && coord.q > 0) {
		return createCoord(coord.q-1, coord.r+1);
	}
	console.assert(false, "Unknown state");
}

function calculateHoneycomb(settings)
{
	const zeroCoord = createCoord(0,0);
	const cellZero = createCellDeposit( zeroCoord );
	const allCells = [cellZero];
	const rings = [[cellZero]];
	const coordToCell = new Map();
	coordToCell.set(zeroCoord.hash, cellZero);

	fillCells();
	fillPartnerLinks();
	calculateProfits();

	return allCells;

	function fillCells()
	{
		if( settings.numberOfCells < 2 ) {
			return;
		}
		let isReady = false;
		let ringN = 1;
		while(!isReady) {
			let coord = createCoord(0, ringN);
			let ringCells = [];
			for( var i = 0; i < 6*ringN; i++ ) {
				let cell = createCellDeposit(coord);
				allCells.push(cell);
				ringCells.push(cell);
				coordToCell.set(coord.hash, cell);
				coord = nextNeighbour(coord);

				isReady = (allCells.length == settings.numberOfCells);
				if(isReady) {
					break;
				}
			}
			rings.push(ringCells);
			ringN += 1;
		}
	}

	function fillPartnerLinks()
	{
		for( var i = 0; i < allCells.length; i++ ) {
			let cell = allCells[i];
			const partnerCoords = cellPartners(cell.coord);
			cell.partners = [];
			for( var j = 0; j < partnerCoords.length; j++ ) {
				cell.partners.push( coordToCell.get(partnerCoords[j].hash) );
			}
		}
	}

	function calculateProfits()
	{
		const tradingProfit = settings.depositOfCell * settings.profitability;

		for(var i = rings.length - 1; i >= 1; i-- ) {
			rings[i].forEach( cell => calculateCellProfit(cell, tradingProfit) );
		}

		if( settings.cellZeroTradingProfit ) {
			cellZero.tradingProfit += tradingProfit;
		}
		cellZero.profitPercent = cellZero.fullProfit() / settings.depositOfCell;
	}

	function calculateCellProfit(cell, tradingProfit)
	{
		const partnerProfit = cell.partnersProfit;
	
		// комиссия организации
		const organizationFeeForTrading = tradingProfit * settings.organizationFee;
		const organizationFeeForPartner = settings.organizationFeeFromFullProfit ? partnerProfit * settings.organizationFee : 0;
		const organizationFee = organizationFeeForTrading + organizationFeeForPartner;
		cellZero.partnersProfit += organizationFee;

		// партнерская программа
		const partnersFeeForTrading = tradingProfit * settings.partnerProgramFee;
		const partnersFeeForPartner = partnerProfit * settings.partnerProgramFee;
		const partnersFee = partnersFeeForTrading + partnersFeeForPartner;

		// итоговая прибыль ячейки
		cell.partnersProfit = partnerProfit - partnersFee;
		cell.tradingProfit = tradingProfit - organizationFee;
		cell.profitPercent = cell.fullProfit() / settings.depositOfCell;

		// распределяем партнерские выплаты
		const onePartnerShare = partnersFee / cell.partners.length;
		cell.partners.forEach( partner => partner.partnersProfit += onePartnerShare );
	}
}

function createCellDeposit(_coord)
{
	return {
		coord: _coord,
		tradingProfit: 0,
		partnersProfit: 0,
		fullProfit: function() { return this.tradingProfit + this.partnersProfit; },
		profitPercent: 0,
		partners: []
	};
}

function createDynamicDeposit(element, _deposit, profitability, delays)
{
	let index = 0;
	let deposit = _deposit;
	let profit = 0;
	let onUpdateCallback = null;
	let lastTimeout = null;

	function _restart(_deposit)
	{
		deposit = _deposit;
		profit = 0;
		index = 0;
		element.textContent = "$" + (deposit + profit);
		lastTimeout = setTimeout(_nextValue, delays[0]);
	}

	function _nextValue()
	{
		profit += deposit*profitability;
		if( onUpdateCallback != null) {
			onUpdateCallback(deposit*profitability);
		}
		element.textContent = "$" + (deposit + profit);
		index += 1;
		if( index < delays.length ) {
			lastTimeout = setTimeout( _nextValue, delays[index] - delays[index - 1] );
		}
	}

	function _stop()
	{
		if( lastTimeout != null ) {
			clearTimeout( lastTimeout );
		}
		lastTimeout = null;
	}
	
	return {
		onUpdate : (_callback) => onUpdateCallback = _callback,
		restart: _restart,
		stop: _stop
	}
}

function createLanes(onTotalProfit)
{
	let _totalProfit = 0;
	var _lanes = new Array();
	function _onUpdate(profit)
	{
		_totalProfit += profit;
		onTotalProfit(_totalProfit);
	}
	return {
		addLane : (lane) => {lane.onUpdate(_onUpdate); _lanes.push( lane )},
		restart : (deposit) => { for(lane of _lanes) {lane.restart(deposit)} },
		stop : () => { _totalProfit = 0; for(lane of _lanes) {lane.stop()} }
	}
}

function createCentralCellModal(settings)
{
	let cellModalDialog = document.getElementById("center-cell-modal");
	document.getElementById("close-cell-modal").onclick = (ev) => _close();
	
	let lanesVideo = document.getElementById("lanes-video-player");
	let modalCentralTradingProfit = document.getElementById("profit-from-trading");
	let modalCentralPartnersProfit = document.getElementById("profit-from-partners");
	let modalCentralProfitPercent = document.getElementById("modal-header-cell-profit-percent");

	let _centralCell = null;
	_updateSettings(settings);
	let lanes = createLanes(_writeProfit);

	lanes.addLane( createDynamicDeposit(document.getElementById("lane_eur_usd"), 10000, 0.015, [1000, 13000, 27500]) );
	lanes.addLane( createDynamicDeposit(document.getElementById("lane_usd_chf"), 10000, 0.02, [5000, 16000, 20000]) );
	lanes.addLane( createDynamicDeposit(document.getElementById("lane_gbp_usd"), 10000, 0.01, [3000, 7900, 18000, 26000, 30000]) );
	lanes.addLane( createDynamicDeposit(document.getElementById("lane_eur_jpy"), 10000, 0.03, [6500, 11000, 24000, 27000]) );
	lanes.addLane( createDynamicDeposit(document.getElementById("lane_xau_usd"), 10000, 0.025, [10000, 15000, 23000, 28000]) );

	function _show() {
		modalCentralTradingProfit.textContent = "$0";
		modalCentralPartnersProfit.textContent = "$0";
		modalCentralProfitPercent.textContent = "0%";
		
		document.getElementById("modal-header-cell-size").textContent = "$" + settings.depositOfCell;
		const depositShare = settings.depositOfCell / 5;
		lanesVideo.onplay = () => lanes.restart( depositShare );
		lanesVideo.play();
		cellModalDialog.style.visibility = "visible";
	}

	function _writeProfit(tradingProfit)
	{
		const shareOfTotal = tradingProfit / _centralCell.tradingProfit;
		modalCentralTradingProfit.textContent = "$" + tradingProfit;
		modalCentralPartnersProfit.textContent = nf.format(_centralCell.partnersProfit * shareOfTotal);
		modalCentralProfitPercent.textContent = pf.format(_centralCell.profitPercent * shareOfTotal);
	}

	function _close()
	{
		cellModalDialog.style.visibility = "hidden";
		lanes.stop();
		lanesVideo.pause();
		lanesVideo.currentTime = 0;
	}

	function _updateSettings(settings)
	{
		_localSettings = {
			numberOfCells : settings.numberOfCells,
			depositOfCell : settings.depositOfCell,
			organizationFee : settings.organizationFee,
			partnerProgramFee : settings.partnerProgramFee,
			profitability : 0.075,
			cellZeroTradingProfit : true,
			organizationFeeFromFullProfit : true
		};
		_centralCell = calculateHoneycomb(_localSettings)[0];
	}

	return {
		show : _show,
		close : _close,
		updateSettings : _updateSettings
	}
}