importScripts('./d3/d3-quadtree.min.js');
importScripts('./d3/d3-zoom.min.js');
importScripts('./d3/d3-drag.min.js');
importScripts('./d3/d3-dispatch.min.js');
importScripts('./d3/d3-timer.min.js');
importScripts('./d3/d3-selection.min.js');
importScripts('./d3/d3-force.min.js');
importScripts('./util.js');

const util = new Util();

// CONSTANTS

const fontFamily = 'Helvetica';
const font = `3px ${fontFamily}`;
const fontBig = `20px ${fontFamily}`;
const transformThreshold = 2.5;

const ObjectLayout = {
	Human:	 1,
	Task:	 2,
	Bookmark: 11,
};

const EdgeType = {
	Link:		 0,
	Relation:	 1,
};

let offscreen = null;
let canvas = null;
let ctx = null;
let octx = null;
let width = 0;
let height = 0;
let density = 0;
let transform = null;
let nodes = [];
let edges = [];
let forceProps = {};
let images = {};
let simulation = null;
let theme = '';
let Color = {};
let LineWidth = 0.25;
let frame = 0;
let selected = [];
let groupForce = null;

addEventListener('message', ({ data }) => { 
	if (this[data.id]) {
		this[data.id](data); 
	};
});

init = (data) => {
	canvas = data.canvas;
	forceProps = data.forceProps;
	nodes = data.nodes;
	edges = data.edges;
	theme = data.theme;

	offscreen = new OffscreenCanvas(250, 40);
	octx = offscreen.getContext('2d');

	ctx = canvas.getContext('2d');
	ctx.lineCap = 'round';

	resize(data);
	initColor();
	requestAnimationFrame(() => { nodes = nodes.map(nameMapper); });

	transform = d3.zoomIdentity.translate(-width, -height).scale(3);
	simulation = d3.forceSimulation(nodes);

	initForces();

	simulation.on('tick', () => { redraw(); });
	simulation.on('end', () => { simulation.alphaTarget(1); });
	simulation.tick(200);
};

nameMapper = (d) => {
	if (d.isRoot) {
		d.fx = width / 2;
		d.fy = height / 2;
	};

	octx.save();
	octx.clearRect(0, 0, 250, 40);
	octx.font = fontBig;
	octx.fillStyle = Color.text;
	octx.textAlign = 'center';
	octx.fillText(d.shortName, 125, 20);
	octx.restore();

	d.textBitmap = offscreen.transferToImageBitmap();
	return d;
};

initColor = () => {
	switch (theme) {
		default:
			Color = {
				bg: '#fff',
				text: '#929082',
				iconText: '#aca996',
				link: {
					0: '#cbc9bd',
					1: '#8c9ea5',
					over: '#ffd15b',
					targetOver: '#5dd400',
					selected: '#c4e3fb',
				},
				node: {
					common: '#aca996',
					filter: '#e3f7d0',
					focused: '#fef3c5',
					over: '#ffd15b',
					targetOver: '#5dd400',
					selected: '#e3eff4',
				},
			}; 
			break;

		case 'dark':
			Color = {
				bg: '#2c2b27',
				text: '#dfddd3',
				iconText: '#dfddd3',
				link: {
					0: '#525148',
					1: '#8c9ea5',
					over: '#ffd15b',
					targetOver: '#5dd400',
					selected: '#212b30',
				},
				node: {
					common: '#484843',
					filter: '#e3f7d0',
					focused: '#fef3c5',
					over: '#ffd15b',
					targetOver: '#5dd400',
					selected: '#212b30',
				},
			};
			break;
	};
};

image = ({ src, bitmap }) => {
	if (!images[src]) {
		images[src] = bitmap;
	};
};

updateProps = (data) => {
	forceProps = data.forceProps;
	
	updateForces();
};

initForces = () => {
	simulation
	.force('link', d3.forceLink())
	.force('charge', d3.forceManyBody())
	.force('collide', d3.forceCollide(nodes))
	.force('center', d3.forceCenter())
	.force('forceX', d3.forceX())
	.force('forceY', d3.forceY())
	.force('forceInABox', groupForce);

	updateForces();
};

updateForces = () => {
	const { center, charge, collide, link, forceX, forceY } = forceProps;

	simulation.force('center')
	.x(width * center.x)
	.y(height * center.y);

	simulation.force('charge')
	.strength(charge.strength * charge.enabled)
	.distanceMin(charge.distanceMin)
	.distanceMax(charge.distanceMax);

	simulation.force('collide')
	.strength(collide.strength * collide.enabled)
	.radius(10 * collide.radius)
	.iterations(collide.iterations);

	simulation.force('link')
	.id(d => d.id)
	.distance(link.distance)
	.strength(link.strength * link.enabled)
	.iterations(link.iterations)
	.links(link.enabled ? edges : []);

	simulation.force('forceX')
	.strength((d) => {
		const hasLinks = (d.sourceCnt + d.targetCnt) > 0;
		return hasLinks ? 0 : forceX.strength * forceX.enabled;
	})
	.x(width * forceX.x);

	simulation.force('forceY')
	.strength((d) => {
		const hasLinks = (d.sourceCnt + d.targetCnt) > 0;
		return hasLinks ? 0 : forceY.strength * forceY.enabled;
	})
	.y(height * forceY.y);

	restart(0.3);
};

draw = () => {
	ctx.save();
	ctx.clearRect(0, 0, width, height);
	ctx.translate(transform.x, transform.y);
	ctx.scale(transform.k, transform.k);

	edges.forEach(d => {
		if (!forceProps.links && (d.type == EdgeType.Link)) {
			return;
		};
		if (!forceProps.relations && (d.type == EdgeType.Relation)) {
			return;
		};
		if (!checkNodeInViewport(d.source) && !checkNodeInViewport(d.target)) {
			//return;
		};

	 	const radius = 6 / transform.k;
		drawLine(d, radius, radius * 2, false, forceProps.markers);
	});

	nodes.forEach(d => {
		if (!forceProps.orphans && d.isOrphan && !d.isRoot) {
			return;
		};
		if (!checkNodeInViewport(d)) {
			//return;
		};

		drawNode(d);
	});

	ctx.restore();
};

redraw = () => {
	cancelAnimationFrame(frame);
	frame = requestAnimationFrame(draw);
};

drawLine = (d, aWidth, aLength, arrowStart, arrowEnd) => {
	const x1 = d.source.x;
	const y1 = d.source.y;
	const r1 = nodeRadius(d.source);
	const x2 = d.target.x;
	const y2 = d.target.y;
	const r2 = nodeRadius(d.target);
	const a1 = Math.atan2(y2 - y1, x2 - x1);
	const a2 = Math.atan2(y1 - y2, x1 - x2);
	const cos1 = Math.cos(a1);
	const sin1 = Math.sin(a1);
	const cos2 = Math.cos(a2);
	const sin2 = Math.sin(a2);
	const mx = (x1 + x2) / 2;  
    const my = (y1 + y2) / 2;
	const sx1 = x1 + r1 * cos1;
	const sy1 = y1 + r1 * sin1;
	const sx2 = x2 + r2 * cos2;
	const sy2 = y2 + r2 * sin2;

	ctx.globalAlpha = 1;

	if (forceProps.filter && !d.source.name.match(forceProps.filter) && !d.target.name.match(forceProps.filter)) {
		ctx.globalAlpha = 0.2;
	};

	let bg = Color.link[0];
	if (d.source.isOver) {
		//bg = Color.link.over;
	};
	if (d.target.isOver) {
		//bg = Color.link.targetOver;
	};

	ctx.lineWidth = LineWidth;
	ctx.strokeStyle = bg;
	ctx.fillStyle = bg;

	ctx.beginPath();
	ctx.moveTo(sx1, sy1);
	ctx.lineTo(sx2, sy2);
	ctx.stroke();

	let tw = 0;
	let th = 0;

	// draw name
	if (d.name && forceProps.labels && (transform.k >= transformThreshold)) {
		const metrics = ctx.measureText(d.name);
		const left = metrics.actualBoundingBoxLeft * -1;
		const top = metrics.actualBoundingBoxAscent * -1;
		const right = metrics.actualBoundingBoxRight;
		const bottom = metrics.actualBoundingBoxDescent;

		tw = right - left;
		th = bottom - top;

		ctx.save();
		ctx.translate(mx, my);
		ctx.rotate(a1);

		ctx.fillStyle = Color.bg;
		util.roundedRect(ctx, left - tw / 2 - 1, top, tw + 2, th + 1.5, 1);

		ctx.fill();
		ctx.stroke();

		ctx.fillStyle = bg;
		ctx.textAlign = 'center';
		ctx.fillText(d.name, 0, 1);

		ctx.restore();
	};

	const sax1 = mx - (aLength - tw / 2 - 2) * cos1;
	const say1 = my - (aLength - tw / 2 - 2) * sin1;
	const sax2 = mx - (aLength + tw / 2 + 2) * cos2;
	const say2 = my - (aLength + tw / 2 + 2) * sin2;

	if (arrowStart) {
		util.arrowHead(ctx, sax1, say1, aWidth, aLength, a1);
    };

    if (arrowEnd) {
		util.arrowHead(ctx, sax2, say2, aWidth, aLength, a2);
    };

};

checkNodeInViewport = (d) => {
	const dr = d.radius * transform.k;
	const distX = transform.x + d.x * transform.k - dr;
	const distY = transform.y + d.y * transform.k - dr;

	return (distX >= -dr * 2) && (distX <= width) && (distY >= -dr * 2) && (distY <= height);
};

drawNode = (d) => {
	let bg = Color.node.common;
	let stroke = '';
	let img = images[d.src];
	let isMatched = forceProps.filter && d.name.match(forceProps.filter);
	let radius = nodeRadius(d);

	ctx.save();
	ctx.lineWidth = 0;
	ctx.globalAlpha = 1;

	if (d.isRoot) {
		bg = Color.node.focused;
	};

	if (selected.includes(d.id)) {
		stroke = Color.link.selected;
		bg = Color.node.selected;
		ctx.lineWidth = 1;
	};

	if (d.isOver) {
		stroke = Color.node.over;
		ctx.lineWidth = 1;
	};

	if (isMatched) {
		stroke = Color.node.over;
		ctx.lineWidth = 2;
	};

	if (forceProps.filter && !isMatched) {
		ctx.globalAlpha = 0.4;
	};

	// Circle background
	if (!forceProps.icons || !img) {
		ctx.beginPath();
		ctx.arc(d.x, d.y, radius, 0, 2 * Math.PI, true);
		ctx.closePath();
	};

	if (stroke) {
		ctx.strokeStyle = stroke;
		ctx.stroke();
	};
	
	ctx.fillStyle = bg;
	ctx.fill();

	if (forceProps.labels && d.textBitmap && (transform.k >= transformThreshold)) {
		const h = 5;
		const div = 6.25;

		ctx.drawImage(d.textBitmap, 0, 0, 250, 40, d.x - h * div / 2, d.y + radius + 1, h * div, h);
	};

	if (img && forceProps.icons) {
		let x = d.x - radius;
		let y = d.y - radius;
		let w = radius * 2;
		let h = radius * 2;
	
		if (d.iconImage) {
			x = d.x - radius;
			y = d.y - radius;
	
			if (isIconCircle(d)) {
				ctx.beginPath();
				ctx.arc(d.x, d.y, radius, 0, 2 * Math.PI, true);
				ctx.closePath();
			} else {
				const r = radius / (d.iconImage ? 8 : 4);
				util.roundedRect(ctx, d.x - radius, d.y - radius, radius * 2, radius * 2, r);
			};
	
			ctx.fill();
			ctx.clip();
	
			if (img.width > img.height) {
				h = radius * 2;
				w = h * (img.width / img.height)
				x -= (w - radius * 2) / 2;
			} else {
				w = radius * 2;
				h = w * (img.height / img.width);
				y -= (h - radius * 2) / 2;
			};
		};
	
		ctx.drawImage(img, 0, 0, img.width, img.height, x, y, w, h);
	};

	ctx.restore();
};

onZoom = (data) => {
	const { x, y, k } = data.transform;

	transform.x = x;
	transform.y = y;
	transform.k = k;

	redraw();
};

onDragStart = ({ active }) => {
	if (!active) {
		restart(0.3);
	};
};

onDragMove = ({ subjectId, x, y }) => {
	if (!subjectId) {
		return;
	};

	const d = nodes.find(it => it.id == subjectId);
	if (!d) {
		return;
	};

	const radius = nodeRadius(d);

	d.fx = transform.invertX(x) - radius / 2;
	d.fy = transform.invertY(y) - radius / 2;

	redraw();
};

onDragEnd = ({ active }) => {
	if (!active) {
		simulation.alphaTarget(0);
	};
};

onClick = ({ x, y }) => {
  	const d = getNodeByCoords(x, y);
	if (d) {
		this.postMessage({ id: 'onClick', node: d });
	};
};

onSelect = ({ x, y }) => {
  	const d = getNodeByCoords(x, y);
	if (d) {
		this.postMessage({ id: 'onSelect', node: d });
	};
};

onMouseMove = ({ x, y }) => {
	const active = nodes.find(d => d.isOver);
	if (active) {
		active.isOver = false;
	};

	const d = getNodeByCoords(x, y);
	if (d) {
		d.isOver = true;
	};

	this.postMessage({ id: 'onMouseMove', node: (d ? d.id : ''), x, y });
};

onContextMenu = ({ x, y }) => {
	const active = nodes.find(d => d.isOver);
	if (active) {
		active.isOver = false;
	};

	const d = getNodeByCoords(x, y);
	if (d) {
		d.isOver = true;
	};

	this.postMessage({ id: 'onContextMenu', node: (d ? d.id : ''), x, y });
};

onAddNode = (data) => {
	const { sourceId, target } = data;
	const id = nodes.length;
	const source = nodes.find(it => it.id == sourceId);

	if (!source) {
		return;
	};

	nodes.push(nameMapper({
		...target,
		index: id, 
		x: source.x + target.radius * 2, 
		y: source.y + target.radius * 2, 
		vx: 1, 
		vy: 1,
	}));
	simulation.nodes(nodes);
	edges.push({ type: EdgeType.Link, source: source.id, target: target.id });

	updateForces();
};

onRemoveNode = ({ ids }) => {
	nodes = nodes.filter(d => !ids.includes(d.id));
	edges = edges.filter(d => !ids.includes(d.source.id) && !ids.includes(d.target.id));
	
	updateForces();
};

onSetEdges = (data) => {
	edges = data.edges.map((d) => {
		return { 
			...d, 
			source: nodes.find(n => d.source == n.id),
			target: nodes.find(n => d.target == n.id),
		};
	});

	updateForces();
};

onSetSelected = ({ ids }) => {
	selected = ids;
};

getNodeByCoords = (x, y) => {
	return simulation.find(transform.invertX(x), transform.invertY(y), 10);
};

restart = (alpha) => {
	simulation.alphaTarget(alpha).restart();
};

resize = (data) => {
	width = data.width;
	height = data.height;
	density = data.density;

	ctx.canvas.width = width * density;
	ctx.canvas.height = height * density;
	ctx.scale(density, density);
	ctx.font = font;
};

onResize = (data) => {
	resize(data);
	redraw();
};

// Utils

const isLayoutHuman = (d) => {
	return d.layout === ObjectLayout.Human;
};

const isLayoutTask = (d) => {
	return d.layout === ObjectLayout.Task;
};

const isLayoutBookmark = (d) => {
	return d.layout === ObjectLayout.Bookmark;
};

const isIconCircle = (d) => {
	return isLayoutHuman(d) || isLayoutTask(d) || isLayoutBookmark(d);
};

const nodeRadius = (d) => {
	return d.radius / transform.k * (forceProps.icons && !d.iconImage ? 2 : 1);
};