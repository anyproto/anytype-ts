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
const transformThreshold = 1.5;

const ObjectLayout = {
	Human:	 1,
	Task:	 2,
	Bookmark: 11,
};

const EdgeType = {
	Link:		 0,
	Relation:	 1,
};

let canvas = null;
let data = {};
let ctx = null;
let width = 0;
let height = 0;
let density = 0;
let transform = null;
let nodes = [];
let edges = [];
let filteredNodes = [];
let filteredEdges = [];
let forceProps = {};
let images = {};
let simulation = null;
let Color = {};
let frame = 0;
let selected = [];

addEventListener('message', ({ data }) => { 
	if (this[data.id]) {
		this[data.id](data); 
	};
});

init = (param) => {
	data = param;
	canvas = data.canvas;
	forceProps = data.forceProps;

	ctx = canvas.getContext('2d');
	ctx.lineCap = 'round';

	util.ctx = ctx;
	resize(data);
	initColor(data.theme);

	transform = d3.zoomIdentity.translate(-width, -height).scale(1.5);
	simulation = d3.forceSimulation(nodes);

	initForces();

	simulation.on('tick', () => { redraw(); });
	simulation.on('end', () => { simulation.alphaTarget(1); });
	simulation.tick(100);
};

initColor = (theme) => {
	switch (theme) {
		default:
			Color = {
				bg: '#fff',
				link: '#cbc9bd',
				arrow: '#aca996',
				node: '#aca996',
				text: '#929082',
				highlight: '#ffb522',
				green: '#57c600',
			}; 
			break;

		case 'dark':
			Color = {
			};
			break;
	};
};

image = ({ src, bitmap }) => {
	if (!images[src]) {
		images[src] = bitmap;
	};
};

updateProps = (param) => {
	forceProps = Object.assign(forceProps, param.forceProps);
	updateForces();
};

initForces = () => {
	simulation
	.force('link', d3.forceLink().id(d => d.id))
	.force('charge', d3.forceManyBody())
	.force('collide', d3.forceCollide(nodes))
	.force('center', d3.forceCenter())
	.force('forceX', d3.forceX())
	.force('forceY', d3.forceY())

	updateForces();
};

updateForces = () => {
	const { center, charge, collide, link, forceX, forceY } = forceProps;
	const old = getNodeMap();

	edges = util.objectCopy(data.edges);
	nodes = util.objectCopy(data.nodes);

	// Filter links
	if (!forceProps.flags.link) {
		edges = edges.filter(d => d.type != EdgeType.Link);
	};

	// Filter relations
	if (!forceProps.flags.relation) {
		edges = edges.filter(d => d.type != EdgeType.Relation);
	};

	// Filter by user input
	if (forceProps.flags.filter) {
		const reg = new RegExp(util.filterFix(forceProps.flags.filter), 'ig');
		nodes = nodes.filter(d => {
			d.name = String(d.name || '');
			d.description = String(d.description || '');
			d.snippet = String(d.snippet || '');

			return d.name.match(reg) || d.description.match(reg) || d.snippet.match(reg);
		});
	};

	// Recalculate orphans
	nodes = nodes.map(d => {
		d.sourceCnt = edges.filter(it => it.source == d.id).length;
		d.targetCnt = edges.filter(it => it.target == d.id).length;
		d.isOrphan = !d.sourceCnt && !d.targetCnt;
		return d;
	});

	// Filter orphans
	if (!forceProps.flags.orphan) {
		nodes = nodes.filter(d => !d.isOrphan || d.isRoot);
	};

	const map = getNodeMap();

	nodes = nodes.map(d => Object.assign(old.get(d.id) || {}, d));
	edges = edges.filter(d => map.get(d.source) && map.get(d.target));

	simulation.nodes(nodes);

	simulation.force('center')
	.x(width * center.x)
	.y(height * center.y);

	simulation.force('charge')
	.strength(charge.strength * charge.enabled)
	.distanceMin(charge.distanceMin)
	.distanceMax(charge.distanceMax);

	simulation.force('collide')
	.strength(collide.strength * collide.enabled)
	.radius(collide.radius)
	.iterations(collide.iterations);

	simulation.force('link')
	.id(d => d.id)
	.distance(link.distance)
	.strength(link.strength * link.enabled)
	.iterations(link.iterations)
	.links(link.enabled ? edges : []);

	simulation.force('forceX')
	.strength(d => d.isOrphan ? forceX.strength * forceX.enabled : 0)
	.x(width * forceX.x);

	simulation.force('forceY')
	.strength(d => d.isOrphan ? forceY.strength * forceY.enabled : 0)
	.y(height * forceY.y);

	restart(0.3);
};

draw = () => {
	const radius = 6 / transform.k;
	const diameter = radius * 2;

	ctx.save();
	ctx.clearRect(0, 0, width, height);
	ctx.translate(transform.x, transform.y);
	ctx.scale(transform.k, transform.k);
	ctx.font = getFont();

	edges.forEach(d => {
		if (checkNodeInViewport(d.source) || checkNodeInViewport(d.target)) {
			drawLine(d, radius, diameter, forceProps.flags.marker && d.isDouble, forceProps.flags.marker);
		};
	});

	nodes.forEach(d => {
		if (checkNodeInViewport(d)) {
			drawNode(d);
		};
	});

	ctx.restore();
};

redraw = () => {
	cancelAnimationFrame(frame);
	frame = requestAnimationFrame(draw);
};

drawLine = (d, arrowWidth, arrowHeight, arrowStart, arrowEnd) => {
	const x1 = d.source.x;
	const y1 = d.source.y;
	const r1 = getRadius(d.source);
	const x2 = d.target.x;
	const y2 = d.target.y;
	const r2 = getRadius(d.target);
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
	const k = 5 / transform.k;
	const lineWidth = r1 / 10;

	let colorLink = Color.link;
	let colorArrow = Color.arrow;
	let colorText = Color.text;

	if (d.source.isOver) {
		colorLink = Color.highlight;
		colorArrow = Color.highlight;
		colorText = Color.highlight;
	};

	if (d.target.isOver) {
		colorLink = Color.green;
		colorArrow = Color.green;
		colorText = Color.green;
	};

	util.line(sx1, sy1, sx2, sy2, r1 / 10, colorLink);

	let tw = 0;
	let th = 0;
	let offset = arrowStart && arrowEnd ? -k : 0;

	// Relation name
	if (d.name && forceProps.flags.label && (transform.k >= transformThreshold)) {
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';

		const { top, bottom, left, right } = util.textMetrics(d.name);

		tw = Math.abs(right - left);
		th = Math.abs(bottom - top);
		offset = 0;

		// Rectangle
		ctx.save();
		ctx.translate(mx, my);
		ctx.rotate(Math.abs(a1) <= 1.5 ? a1 : a2);
		util.roundedRect(left - k, top - k, tw + k * 2, th + k * 2, r1 / 4);

		ctx.strokeStyle = colorLink;
		ctx.lineWidth = lineWidth;
		ctx.fillStyle = Color.bg;
		ctx.fill();
		ctx.stroke();

		// Label
		ctx.fillStyle = colorText;
		ctx.fillText(d.name, 0, 0);
		ctx.restore();
	};

	// Arrow heads
	const move = arrowHeight * 2 + tw / 2 + offset;
	const sax1 = mx - move * cos1;
	const say1 = my - move * sin1;
	const sax2 = mx - move * cos2;
	const say2 = my - move * sin2;

	if (arrowStart) {
		util.arrowHead(sax1, say1, a1, arrowWidth, arrowHeight, colorArrow);
    };

    if (arrowEnd) {
		util.arrowHead(sax2, say2, a2, arrowWidth, arrowHeight, colorArrow);
    };
};

drawNode = (d) => {
	const radius = getRadius(d);
	const img = images[d.src];
	const diameter = radius * 2;
	
	let colorNode = Color.node;
	let colorText = Color.text;
	let colorLine = '';
	let lineWidth = 0;

	if (d.isOver) {
		colorNode = Color.highlight;
		colorText = Color.highlight;
		colorLine = Color.highlight;
		lineWidth = radius / 5;
	};

	if (forceProps.flags.icon && img) {
		ctx.save();

		if (lineWidth) {
			util.roundedRect(d.x - radius - lineWidth, d.y - radius - lineWidth, diameter + lineWidth * 2, diameter + lineWidth * 2, radius / 4);
			ctx.fillStyle = Color.bg;
			ctx.fill();

			ctx.strokeStyle = colorLine;
			ctx.lineWidth = lineWidth;
			ctx.stroke();
		};

		let x = d.x - radius;
		let y = d.y - radius;
		let w = diameter;
		let h = diameter;
	
		if (d.iconImage) {
			x = d.x - radius;
			y = d.y - radius;
	
			if (isIconCircle(d)) {
				util.circle(d.x, d.y, radius);
			} else {
				util.roundedRect(d.x - radius, d.y - radius, diameter, diameter, radius / 4);
			};
	
			ctx.fill();
			ctx.clip();
	
			if (img.width > img.height) {
				w = h * (img.width / img.height);
				x -= (w - diameter) / 2;
			} else {
				h = w * (img.height / img.width);
				y -= (h - diameter) / 2;
			};
		};

		ctx.drawImage(img, 0, 0, img.width, img.height, x, y, w, h);
		ctx.restore();
	} else {
		util.circle(d.x, d.y, radius);
		ctx.fillStyle = colorNode;
		ctx.fill();
	};

	// Node name
	if (forceProps.flags.label && (transform.k >= transformThreshold)) {
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';

		const { top, bottom, left, right } = util.textMetrics(d.shortName);
		const tw = right - left;
		const th = bottom - top;

		// Rectangle
		ctx.save();
		ctx.translate(d.x, d.y);
		ctx.fillStyle = Color.bg;
		util.rect(left, top + diameter, tw, th);
		ctx.fill();

		// Label
		ctx.fillStyle = colorText;
		ctx.fillText(d.shortName, 0, diameter + 4 / transform.k);
		ctx.restore();
	};
};

onZoom = (data) => {
	transform = Object.assign(transform, data.transform);

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

	const radius = getRadius(d);

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

onAddNode = ({ sourceId, target }) => {
	const id = data.nodes.length;
	const source = nodes.find(it => it.id == sourceId);

	if (!source) {
		return;
	};

	target = Object.assign(target, {
		index: id, 
		x: source.x + target.radius * 2, 
		y: source.y + target.radius * 2, 
		vx: 1, 
		vy: 1,
	});

	data.nodes.push(target);
	data.edges.push({ type: EdgeType.Link, source: source.id, target: target.id });

	updateForces();
};

onRemoveNode = ({ ids }) => {
	data.nodes = data.nodes.filter(d => !ids.includes(d.id));
	data.edges = data.edges.filter(d => !ids.includes(d.source.id) && !ids.includes(d.target.id));

	updateForces();
};

onSetEdges = (param) => {
	data.edges = param.edges;
	updateForces();
};

onSelected = ({ ids }) => {
	selected = ids;
};

onResize = (data) => {
	resize(data);
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
};

const checkNodeInViewport = (d) => {
	const dr = d.radius * transform.k;
	const distX = transform.x + d.x * transform.k - dr;
	const distY = transform.y + d.y * transform.k - dr;

	return (distX >= -dr * 2) && (distX <= width) && (distY >= -dr * 2) && (distY <= height);
};

const isLayoutHuman = (d) => {
	return d.layout == ObjectLayout.Human;
};

const isLayoutBookmark = (d) => {
	return d.layout == ObjectLayout.Bookmark;
};

const isIconCircle = (d) => {
	return isLayoutHuman(d) || isLayoutBookmark(d);
};

const getNodeByCoords = (x, y) => {
	return simulation.find(transform.invertX(x), transform.invertY(y), 20 / transform.k);
};

const getRadius = (d) => {
	return d.radius / transform.k * (forceProps.flags.icon && images[d.src] ? 2 : 1);
};

const getFont = () => {
	return `${12 / transform.k}px ${fontFamily}`;
};

const getNodeMap = () => {
	return new Map(nodes.map(d => [ d.id, d ]));
};