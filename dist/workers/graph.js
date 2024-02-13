importScripts(
	'./lib/d3/d3-quadtree.min.js',
	'./lib/d3/d3-zoom.min.js',
	'./lib/d3/d3-drag.min.js',
	'./lib/d3/d3-dispatch.min.js',
	'./lib/d3/d3-timer.min.js',
	'./lib/d3/d3-selection.min.js',
	'./lib/d3/d3-force.min.js',
	'./lib/tween.js',
	'./lib/util.js'
);

const util = new Util();

// CONSTANTS

const transformThreshold = 1.5;
const transformThresholdHalf = transformThreshold / 2;
const delayFocus = 1000;

const ObjectLayout = {
	Human:		 1,
	Task:		 2,
	Bookmark:	 11,
	Participant: 19,
};

const EdgeType = {
	Link:		 0,
	Relation:	 1,
};

const forceProps = {
	center: {
		x: 0.5,
		y: 0.5,
	},
	charge: {
		strength: -250,
		distanceMax: 300,
	},
	link: {
		distance: 50,
	},
	forceX: {
		strength: 0.1,
		x: 0.45,
	},
	forceY: {
		strength: 0.1,
		y: 0.45,
	},
};

let canvas = null;
let data = {};
let ctx = null;
let width = 0;
let height = 0;
let density = 0;
let transform = {};
let nodes = [];
let edges = [];
let images = {};
let simulation = null;
let frame = 0;
let selected = [];
let settings = {};
let time = 0;
let isHovering = false;
let edgeMap = new Map();
let nodeMap = new Map();
let hoverAlpha = 0.3;
let fontFamily = 'Helvetica, san-serif';
let timeoutHover = 0;
let rootId = '';
let root = null;
let paused = false;
let isOver = '';

addEventListener('message', ({ data }) => { 
	if (this[data.id]) {
		this[data.id](data); 
	};
});

init = (param) => {
	data = param;
	canvas = data.canvas;
	settings = data.settings;
	rootId = data.rootId;
	ctx = canvas.getContext('2d');

	util.ctx = ctx;
	resize(data);
	initTheme(data.theme);
	initFonts();

	ctx.lineCap = 'round';
	ctx.fillStyle = data.colors.bg;
	
	transform = d3.zoomIdentity.translate(0, 0).scale(1.5);
	simulation = d3.forceSimulation(nodes);
	simulation.alpha(1);

	initForces();

	simulation.on('tick', () => redraw());
	simulation.tick(100);

	setTimeout(() => {
		root = getNodeById(rootId);

		let x = width / 2;
		let y = height / 2;

		if (root) {
			x = root.x;
			y = root.y;
		};

		transform = Object.assign(transform, getCenter(x, y));
		send('onTransform', { ...transform });
		redraw();
	}, 100);
};

initTheme = (theme) => {
	switch (theme) {
		case 'dark':
			hoverAlpha = 0.2;
			break;
	};
};

initFonts = () => {
	if (!self.FontFace) {
		return;
	};

	const name = 'Inter';
	const fontFace = new FontFace(name, `url("../font/inter/regular.woff2") format("woff2")`);

	self.fonts.add(fontFace);
	fontFace.load().then(() => fontFamily = name);
};

image = ({ src, bitmap }) => {
	if (!images[src]) {
		images[src] = bitmap;
	};
};

initForces = () => {
	const { center, charge, link, forceX, forceY } = forceProps;

	updateOrphans();

	simulation
	.force('link', d3.forceLink().id(d => d.id))
	.force('charge', d3.forceManyBody())
	.force('center', d3.forceCenter())
	.force('forceX', d3.forceX(nodes))
	.force('forceY', d3.forceY(nodes));

	simulation.force('center')
	.x(width * center.x)
	.y(height * center.y);

	simulation.force('charge')
	.strength(charge.strength)
	.distanceMax(charge.distanceMax);

	simulation.force('link')
	.links(edges)
	.distance(link.distance);

	simulation.force('forceX')
	.strength(d => d.isOrphan ? forceX.strength : 0)
	.x(width * forceX.x);

	simulation.force('forceY')
	.strength(d => d.isOrphan ? forceY.strength : 0)
	.y(height * forceY.y);

	updateForces();
	redraw();
};

updateForces = () => {
	const old = getNodeMap();

	edges = util.objectCopy(data.edges);
	nodes = util.objectCopy(data.nodes);

	updateOrphans();

	// Filter links
	if (!settings.link) {
		nodes = nodes.filter(d => !d.linkCnt);
	};

	// Filter relations
	if (!settings.relation) {
		nodes = nodes.filter(d => !d.relationCnt);
	};

	// Filte local only edges
	if (settings.local) {
		edges = getEdgesByNodeId(rootId);

		const nodeIds = util.arrayUnique([ rootId ].concat(edges.map(d => d.source)).concat(edges.map(d => d.target)));
		nodes = nodes.filter(d => nodeIds.includes(d.id));
	};

	let map = getNodeMap();
	edges = edges.filter(d => map.get(d.source) && map.get(d.target));

	// Filter orphans
	if (!settings.orphan) {
		nodes = nodes.filter(d => !d.isOrphan || d.forceShow);
	};

	map = getNodeMap();
	edges = edges.filter(d => map.get(d.source) && map.get(d.target));

	// Shallow copy to disable mutations
	nodes = nodes.map(d => {
		let o = old.get(d.id);
		if (!o) {
			o = settings.local ? { x: width / 2, y: width / 2 } : {};
		};
		return Object.assign(o, d);
	});
	edges = edges.map(d => Object.assign({}, d));

	simulation.nodes(nodes);
	simulation.force('link')
	.id(d => d.id)
	.links(edges);

	edgeMap.clear();
	nodes.forEach(d => {
		const sources = edges.filter(it => it.target.id == d.id).map(it => it.source.id);
		const targets = edges.filter(it => it.source.id == d.id).map(it => it.target.id);

		edgeMap.set(d.id, [].concat(sources).concat(targets));
	});

	simulation.alpha(1).restart();

	nodeMap = getNodeMap();
	redraw();
};

updateSettings = (param) => {
	const updateKeys = [ 'link', 'relation', 'orphan', 'local' ];
	
	let needUpdate = false;
	let needFocus = false;

	for (let key of updateKeys) {
		if (param[key] != settings[key]) {
			needUpdate = true;

			if (key == 'local') {
				needFocus = true;
			};

			break;
		};
	};

	settings = Object.assign(settings, param);
	needUpdate ? updateForces() : redraw();

	if (needFocus) {
		setTimeout(() => this.setRootId({ rootId }), delayFocus);
	};
};

updateTheme = ({ theme }) => {
	initTheme(theme);
	redraw();
};

updateOrphans = () => {
	nodes = nodes.map(d => {
		const edges = getEdgesByNodeId(d.id);
		
		d.isOrphan = !edges.length;
		d.linkCnt = edges.filter(it => it.type == EdgeType.Link).length;
		d.relationCnt = edges.filter(it => it.type == EdgeType.Relation).length;

		return d;
	});
};

draw = (t) => {
	const radius = 5.7 / transform.k;

	time = t;
	TWEEN.update();

	ctx.save();
	ctx.clearRect(0, 0, width, height);
	ctx.translate(transform.x, transform.y);
	ctx.scale(transform.k, transform.k);
	ctx.font = getFont();

	edges.forEach(d => {
		drawEdge(d, radius, radius * 1.3, settings.marker && d.isDouble, settings.marker);
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
	if (!paused) {
		frame = requestAnimationFrame(draw);
	};
};

drawEdge = (d, arrowWidth, arrowHeight, arrowStart, arrowEnd) => {
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
	const io = (isOver == d.source.id) || (isOver == d.target.id);
	const showName = io && d.name && settings.label;
	const lineWidth = getLineWidth();

	let colorLink = data.colors.link;
	let colorArrow = data.colors.arrow;
	let colorText = data.colors.text;

	if (isHovering) {
		ctx.globalAlpha = hoverAlpha;
	};

	if (io) {
		colorLink = colorArrow = colorText = data.colors.highlight;
		ctx.globalAlpha = 1;
	};

	util.line(sx1, sy1, sx2, sy2, lineWidth, colorLink);

	let tw = 0;
	let th = 0;
	let offset = arrowStart && arrowEnd ? -k : 0;

	// Relation name
	if (showName) {
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';

		const { top, bottom, left, right } = util.textMetrics(d.name);

		tw = Math.abs(right - left);
		th = Math.abs(bottom - top);
		offset = arrowHeight / 2;

		// Rectangle
		ctx.save();
		ctx.translate(mx, my);
		ctx.rotate(Math.abs(a1) <= 1.5 ? a1 : a2);
		util.roundedRect(left - k, top - k, tw + k * 2, th + k * 2, getBorderRadius());

		ctx.strokeStyle = colorLink;
		ctx.lineWidth = lineWidth * 3;
		ctx.fillStyle = data.colors.bg;
		ctx.fill();
		ctx.stroke();

		// Label
		ctx.fillStyle = colorText;
		ctx.fillText(d.name, 0, 0);
		ctx.restore();
	};

	// Arrow heads

	if ((arrowStart || arrowEnd) && (transform.k >= transformThresholdHalf)) {
		let move = arrowHeight;
		if (showName) {
			move = arrowHeight * 2 + tw / 2 + offset;
		} else 
		if (arrowStart && arrowEnd) {
			move = arrowHeight * 2;
		};

		if (arrowStart) {
			const sax1 = mx - move * cos1;
			const say1 = my - move * sin1;

			util.arrowHead(sax1, say1, a1, arrowWidth, arrowHeight, colorArrow);
		};

		if (arrowEnd) {
			const sax2 = mx - move * cos2;
			const say2 = my - move * sin2;

			util.arrowHead(sax2, say2, a2, arrowWidth, arrowHeight, colorArrow);
		};
	};
};

drawNode = (d) => {
	const radius = getRadius(d);
	const img = images[d.src];
	const diameter = radius * 2;
	const isSelected = selected.includes(d.id);
	const io = isOver == d.id;
	
	let colorNode = data.colors.node;
	let colorText = data.colors.text;
	let colorLine = '';
	let lineWidth = 0;

	if (isHovering) {
		ctx.globalAlpha = hoverAlpha;

		const connections = edgeMap.get(d.id);
		if (connections && connections.length) {
			for (let i = 0; i < connections.length; i++) {
				if (isOver == connections[i]) {
					ctx.globalAlpha = 1;
					break;
				};
			};
		};
	};

	if (io || (root && (d.id == root.id))) {
		colorNode = colorText = colorLine = data.colors.highlight;
		lineWidth = getLineWidth() * 3;
		ctx.globalAlpha = 1;
	};

	if (isSelected) {
		colorNode = colorText = colorLine = data.colors.selected;
	};

	if (io || isSelected) {
		lineWidth = getLineWidth() * 3;
	};

	if (settings.icon && img && (transform.k >= transformThresholdHalf)) {
		ctx.save();

		if (lineWidth) {
			util.roundedRect(d.x - radius - lineWidth * 2, d.y - radius - lineWidth * 2, diameter + lineWidth * 4, diameter + lineWidth * 4, getBorderRadius());
			ctx.fillStyle = data.colors.bg;
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
	
			if (isLayoutHuman(d) || isLayoutParticipant(d)) {
				util.circle(d.x, d.y, radius);
			} else {
				util.roundedRect(d.x - radius, d.y - radius, diameter, diameter, getBorderRadius());
			};
	
			ctx.fillStyle = data.colors.bg;
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
	if (settings.label && (transform.k >= transformThreshold)) {
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';

		const { top, bottom, left, right } = util.textMetrics(d.shortName);
		const tw = right - left;
		const th = bottom - top;
		const offset = 4 / transform.k;

		// Rectangle
		ctx.save();
		ctx.translate(d.x, d.y);
		ctx.fillStyle = data.colors.bg;
		util.rect(left, top + diameter + offset, tw, th);
		ctx.fill();

		// Label
		ctx.fillStyle = colorText;
		ctx.fillText(d.shortName, 0, diameter + offset);
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
	send('onDragMove');

	if (!subjectId) {
		return;
	};

	const d = getNodeById(subjectId);
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
		send('onClick', { node: d.id });
	};
};

onSelect = ({ x, y, selectRelated }) => {
  	const d = getNodeByCoords(x, y);
  	let related = [];
	if (d) {
		if (selectRelated) {
			related = edgeMap.get(d.id);
		};

		send('onSelect', { node: d.id, related });
	};
};

onSetRootId = ({ x, y }) => {
  	const d = getNodeByCoords(x, y);
	if (d) {
		this.setRootId({ rootId: d.id });
	};
};

onSetEdges = (param) => {
	data.edges = param.edges;
	updateForces();
};

onSetSelected = ({ ids }) => {
	selected = ids;
};

onMouseMove = ({ x, y }) => {
	const d = getNodeByCoords(x, y);

	isOver = d ? d.id : '';

	send('onMouseMove', { node: (d ? d.id : ''), x, y, k: transform.k });
	redraw();
	clearTimeout(timeoutHover);

	if (!d) {
		isHovering = false;
		return;
	};

	timeoutHover = setTimeout(() => {
		const d = getNodeByCoords(x, y);
		if (d) {
			isHovering = true;
		};

		redraw();
	}, 200);
};

onContextMenu = ({ x, y }) => {
	const d = getNodeByCoords(x, y);

	isOver = d ? d.id : '';

	if (d) {
		send('onContextMenu', { node: d, x, y });
	} else {
		send('onContextSpaceClick', { x, y });
	};

	redraw();
};

onAddNode = ({ target, sourceId }) => {
	const id = data.nodes.length;

	let x = 0;
	let y = 0;

	if (sourceId) {
		const source = getNodeById(sourceId);
		if (!source) {
			return;
		};

		x = source.x + target.radius * 2;
		y = source.y + target.radius * 2;

		data.edges.push({ type: EdgeType.Link, source: source.id, target: target.id });
	};

	target = Object.assign(target, {
		index: id,
		vx: 1, 
		vy: 1,
		forceShow: true,
	});

	if (!target.x && !target.y) {
		target = Object.assign(target, { x, y });
	};

	data.nodes.push(target);

	updateForces();
};

onRemoveNode = ({ ids }) => {
	isHovering = false;

	data.nodes = data.nodes.filter(d => !ids.includes(d.id));
	data.edges = data.edges.filter(d => !ids.includes(d.source.id) && !ids.includes(d.target.id));

	updateForces();
};

setRootId = (param) => {
	rootId = param.rootId;
	root = getNodeById(rootId);

	if (!root) {
		return;
	};

	const coords = { x: transform.x, y: transform.y };
	const to = getCenter(root.x, root.y);

	new TWEEN.Tween(coords)
	.to(to, 500)
	.easing(TWEEN.Easing.Quadratic.InOut)
	.onUpdate(() => {
		transform = Object.assign(transform, coords);
		redraw();
	})
	.onComplete(() => send('onTransform', { ...transform }))
	.start();

	if (settings.local) {
		updateForces();
	} else {
		redraw();
	};
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

	redraw();
};

//------------------- Util -------------------

const send = (id, data) => {
	this.postMessage({ id, data });
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

const isLayoutParticipant = (d) => {
	return d.layout == ObjectLayout.Participant;
};

const isLayoutBookmark = (d) => {
	return d.layout == ObjectLayout.Bookmark;
};

const getNodeById = (id) => {
	return nodeMap.get(id) || nodes.find(d => d.id == id);
};

const getNodeByCoords = (x, y) => {
	return simulation.find(transform.invertX(x), transform.invertY(y), 10 / transform.k);
};

const getEdgesByNodeId = (id) => {
	return edges.filter(d => (d.source == id) || (d.target == id));
};

const getRadius = (d) => {
	let k = 1;
	if (settings.icon && images[d.src] && (transform.k >= transformThresholdHalf)) {
		k = 2;
	};
	return d.radius / transform.k * k;
};

const getFont = () => {
	return `${12 / transform.k}px ${fontFamily}`;
};

const getNodeMap = () => {
	return new Map(nodes.map(d => [ d.id, d ]));
};

const getCenter = (x, y) => {
	return { x: width / 2 - x * transform.k, y: height / 2 - y * transform.k };
};

const getLineWidth = () => {
	return 0.4 / transform.k;
};

const getBorderRadius = () => {
	return 3.33 / transform.k;
};