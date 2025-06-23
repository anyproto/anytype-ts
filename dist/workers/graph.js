/**
 * Graph rendering worker for force-directed and clustered layouts using D3 and canvas.
 * Handles simulation, drawing, and user interaction logic for graph visualization.
 *
 * @file dist/workers/graph.js
 */
importScripts(
	'./lib/d3/d3-quadtree.min.js',
	'./lib/d3/d3-zoom.min.js',
	'./lib/d3/d3-drag.min.js',
	'./lib/d3/d3-dispatch.min.js',
	'./lib/d3/d3-timer.min.js',
	'./lib/d3/d3-selection.min.js',
	'./lib/d3/d3-force.min.js',
	'./lib/d3/d3-force-cluster.min.js',
	'./lib/tween.js',
	'./lib/util.js'
);

const util = new Util();

// CONSTANTS

const transformThreshold = 1;
const transformThresholdHalf = transformThreshold / 2;
const delayFocus = 1000;

const Layout = {
	Human:		 1,
	Task:		 2,
	File:		 6,
	Image:		 8,
	Audio:		 15,
	Video:		 16,
	Bookmark:	 11,
	Participant: 19,
	Pdf:		 20,
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
		distanceMax: 1000,
	},
	link: {
		distance: 100,
	},
	forceX: {
		strength: 0.01,
		x: 0.5,
	},
	forceY: {
		strength: 0.01,
		y: 0.5,
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
let maxDegree = 0;
let clusters = {};
let selectBox = { x: 0, y: 0, width: 0, height: 0 };
let borderRadius = 0;
let lineWidth = 0;
let lineWidth3 = 0;

addEventListener('message', ({ data }) => { 
	if (this[data.id]) {
		this[data.id](data); 
	};
});

/**
 * Initializes the graph worker with provided parameters and sets up the simulation.
 * @param {Object} param - Initialization parameters including canvas, nodes, edges, settings, etc.
 */
init = (param) => {
	data = param;
	canvas = data.canvas;
	settings = data.settings;
	rootId = data.rootId;
	ctx = canvas.getContext('2d');
	edges = util.objectCopy(data.edges);
	nodes = util.objectCopy(data.nodes);

	util.ctx = ctx;
	resize(data);
	initTheme(data.theme);
	initFonts();
	recalcConstants();

	ctx.lineCap = 'round';
	ctx.fillStyle = data.colors.bg;
	
	transform = d3.zoomIdentity.translate(0, 0).scale(1);
	simulation = d3.forceSimulation(nodes);
	simulation.alpha(1);
	simulation.alphaDecay(0.05);

	initForces();

	simulation.on('tick', () => redraw());
	simulation.tick(100);

	root = getNodeById(rootId);

	const x = root ? root.x : width / 2;
	const y = root ? root.y : height / 2;

	transform = Object.assign(transform, getCenter(x, y));
	send('onTransform', { ...transform });
};

/**
 * Initializes theme-specific settings.
 * @param {string} theme - The theme name (e.g., 'dark').
 */
initTheme = (theme) => {
	switch (theme) {
		case 'dark':
			hoverAlpha = 0.2;
			break;
	};
};

/**
 * Loads and registers custom fonts for the graph.
 */
initFonts = () => {
	if (!self.FontFace) {
		return;
	};

	const name = 'Inter';
	const fontFace = new FontFace(name, `url("../font/inter/regular.woff2") format("woff2")`);

	self.fonts.add(fontFace);
	fontFace.load().then(() => fontFamily = name);
};

/**
 * Registers an image bitmap for a given source.
 * @param {{src: string, bitmap: ImageBitmap}} param - Image source and bitmap.
 */
image = ({ src, bitmap }) => {
	if (!images[src]) {
		images[src] = bitmap;
	};
};

/**
 * Initializes D3 forces and clusters for the simulation.
 */
initForces = () => {
	const { center, charge, link, forceX, forceY } = forceProps;
	const maxRadius = 500;

	updateOrphans();

	nodes.forEach(d => {
		if (d.typeKey && !clusters[d.typeKey]) {
			clusters[d.typeKey] = { id: d.typeKey, radius: 0, x: 0, y: 0 };
		};
	});

	clusters = Object.values(clusters);

	const l = clusters.length;

	clusters = Object.values(clusters).map((c, i) => {
		c.radius = Math.sqrt((i + 1) / l * -Math.log(Math.random())) * maxRadius;
		c.x = Math.cos(i / l * 2 * Math.PI) * 150 + width / 2 + Math.random();
		c.y = Math.sin(i / l * 2 * Math.PI) * 150 + height / 2 + Math.random();
		return c;
	});

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
	.distance(link.distance)
	.strength(d => d.source.type == d.target.type ? 1 : 0.5);

	simulation.force('forceX')
	.strength(d => !d.isOrphan ? forceX.strength : 0)
	.x(width * forceX.x);

	simulation.force('forceY')
	.strength(d => !d.isOrphan ? forceY.strength : 0)
	.y(height * forceY.y);

	updateForces();
	redraw();
};

/**
 * Updates the simulation forces and filters nodes/edges based on settings.
 */
updateForces = () => {
	const old = getNodeMap();
	let types = [];
	if (settings.link) types.push(EdgeType.Link);
	if (settings.relation) types.push(EdgeType.Relation);

	edges = util.objectCopy(data.edges);
	nodes = util.objectCopy(data.nodes);

	updateOrphans();

	// Filter types
	if (settings.filterTypes && settings.filterTypes.length) {
		nodes = nodes.filter(d => !settings.filterTypes.includes(d.type));
	};

	// Filter links
	if (!settings.link) {
		const typesSet = new Set(types);
		edges = edges.filter(d => d.isDouble ? d.types.some(t => typesSet.has(t)) : d.type != EdgeType.Link);
		const ids = nodeIdsFromEdges(edges);
		nodes = nodes.filter(d => ids.has(d.id) || d.isOrphan);
	};

	// Filter relations
	if (!settings.relation) {
		const typesSet = new Set(types);
		edges = edges.filter(d => d.isDouble ? d.types.some(t => typesSet.has(t)) : d.type != EdgeType.Relation);
		const ids = nodeIdsFromEdges(edges);
		nodes = nodes.filter(d => ids.has(d.id) || d.isOrphan);
	};

	// Filter local only edges
	if (settings.local) {
		edges = filterEdgesByDepth([ rootId ], settings.depth || 1);
		const ids = nodeIdsFromEdges(edges); ids.add(rootId);
		nodes = nodes.filter(d => ids.has(d.id));
	};

	// Filter orphans
	if (!settings.orphan) {
		nodes = nodes.filter(d => !d.isOrphan || d.forceShow);
	};

	// Cluster by object type
	if (settings.cluster) {
		simulation.force('cluster', d3.forceCluster()
			.centers(d => clusters.find(c => c.id == d.type))
			.strength(1)
			.centerInertia(0.75));
		simulation.force('collide', d3.forceCollide(d => getRadius(d) * 2));
	} else {
		simulation.force('cluster', null);
		simulation.force('collide', null);
	};

	let map = getNodeMap();
	edges = edges.filter(d => map.get(d.source) && map.get(d.target));

	// Shallow copy to disable mutations
	nodes = nodes.map(d => {
		let o = old.get(d.id) || (settings.local ? { x: width / 2, y: width / 2 } : {});
		return Object.assign(o, d);
	});
	edges = edges.map(d => Object.assign({}, d));

	simulation.nodes(nodes);
	simulation.force('link')
		.id(d => d.id)
		.links(edges);

	// Build edgeMap in a single pass over edges
	const tmpEdgeMap = getEdgeMap();

	edgeMap.clear();
	nodes.forEach(d => {
		edgeMap.set(d.id, tmpEdgeMap.get(d.id) || []);
	});

	simulation.alpha(1).restart();

	nodeMap = getNodeMap();
	redraw();
};

/**
 * Updates settings and triggers force update or redraw if needed.
 * @param {Object} param - Settings to update.
 */
updateSettings = (param) => {
	const updateKeys = [ 'link', 'relation', 'orphan', 'local', 'depth', 'cluster', 'filterTypes' ];
	
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

/**
 * Updates theme colors and triggers redraw.
 * @param {{theme: string, colors: Object}} param - Theme and color settings.
 */
updateTheme = ({ theme, colors }) => {
	data.colors = colors;
	initTheme(theme);
	redraw();
};

/**
 * Builds a map of edges grouped by their connected vertex IDs.
 *
 * Iterates over the global `edges` array and creates a `Map` where each key
 * is a vertex ID (`source` or `target`), and the value is an array of edges
 * connected to that vertex.
 *
 * @returns {Map<*, Object[]>} A map where each key is a vertex ID and each value is an array of edge objects.
 */
getEdgeMap = () => {
	const map = new Map();

	for (let i = 0; i < edges.length; i++) {
		const e = edges[i];

		if (!map.has(e.source)) {
			map.set(e.source, []);
		};
		if (!map.has(e.target)) {
			map.set(e.target, []);
		};

		map.get(e.source).push(e);
		map.get(e.target).push(e);
	};

	return map;
};

/**
 * Updates orphan status and degree counts for all nodes.
 */
updateOrphans = () => {
	const edgeMap = getEdgeMap();

	// Update nodes using the map
	nodes = nodes.map(d => {
		const edges = edgeMap.get(d.id) || [];

		d.isOrphan = !edges.length;
		d.linkCnt = 0;
		d.relationCnt = 0;

		for (let i = 0; i < edges.length; i++) {
			const t = edges[i].type;

			if (t == EdgeType.Link) {
				d.linkCnt++;
			};

			if (t == EdgeType.Relation) {
				d.relationCnt++;
			};
		};

		return d;
	});
};

/**
 * Draws the entire graph (edges, nodes, selection box) for the current frame.
 * @param {number} t - The current animation time.
 */
draw = (t) => {
	const radius = 5.7 / transform.k;

	recalcConstants();

	time = t;
	TWEEN.update();

	ctx.save();
	ctx.clearRect(0, 0, width, height);
	ctx.translate(transform.x, transform.y);
	ctx.scale(transform.k, transform.k);
	ctx.font = getFont();

	edges.forEach(d => {
		if (checkNodeInViewport(d.target) || checkNodeInViewport(d.source)) {
			drawEdge(d, radius, radius * 1.3, settings.marker && d.isDouble, settings.marker);
		};
	});

	nodes.forEach(d => {
		if (checkNodeInViewport(d)) {
			drawNode(d);
		};
	});

	if (selectBox.x && selectBox.y && selectBox.width && selectBox.height) {
		drawSelectBox();
	};

	ctx.restore();
};

/**
 * Requests a redraw on the next animation frame.
 */
redraw = () => {
	cancelAnimationFrame(frame);
	if (!paused) {
		frame = requestAnimationFrame(draw);
	};
};

/**
 * Draws a single edge, including optional arrowheads and labels.
 * @param {Object} d - The edge object.
 * @param {number} arrowWidth - Width of the arrowhead.
 * @param {number} arrowHeight - Height of the arrowhead.
 * @param {boolean} arrowStart - Whether to draw an arrow at the start.
 * @param {boolean} arrowEnd - Whether to draw an arrow at the end.
 */
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
		util.roundedRect(left - k, top - k, tw + k * 2, th + k * 2, borderRadius);

		ctx.strokeStyle = colorLink;
		ctx.lineWidth = lineWidth3;
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

/**
 * Draws a single node, including icon, selection, and label.
 * @param {Object} d - The node object.
 */
drawNode = (d) => {
	const radius = getRadius(d);
	const img = images[d.src];
	const diameter = radius * 2;
	const isSelected = selected.includes(d.id);
	const io = isOver == d.id;
	
	let colorNode = data.colors.node;
	let colorText = data.colors.text;
	let colorLine = '';
	let lw = 0;

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
		lw = lineWidth3;
		ctx.globalAlpha = 1;
	};

	if (isSelected) {
		colorNode = colorText = colorLine = data.colors.selected;
	};

	if (io || isSelected) {
		lw = lineWidth3;
	};

	if (settings.icon && img && (transform.k >= transformThresholdHalf)) {
		ctx.save();

		if (lw) {
			util.roundedRect(d.x - radius - lw * 2, d.y - radius - lw * 2, diameter + lw * 4, diameter + lw * 4, borderRadius);
			ctx.fillStyle = data.colors.bg;
			ctx.fill();

			ctx.strokeStyle = colorLine;
			ctx.lineWidth = lw;
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
				util.roundedRect(d.x - radius, d.y - radius, diameter, diameter, borderRadius);
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

/**
 * Draws the selection box for drag-to-select.
 */
drawSelectBox = () => {
	const { x, y, width, height } = selectBox;

	ctx.save();
	util.roundedRect(x, y, width, height, 1);

	ctx.strokeStyle = data.colors.selected;
	ctx.lineWidth = lineWidth3;
	ctx.stroke();
	ctx.restore();
}

/**
 * Handles zoom events and updates the transform.
 * @param {Object} data - Zoom event data.
 */
onZoom = (data) => {
	transform = Object.assign(transform, data.transform);

	util.clearCache('text');
	recalcConstants();
	redraw();
};

/**
 * Recalculates constants to avoid recomputations with floats
 */
recalcConstants = () => {
	borderRadius = getBorderRadius();
	lineWidth = getLineWidth();
	lineWidth3 = lineWidth * 3;
};

/**
 * Handles the start of a drag-to-select operation.
 * @param {Object} data - Drag start data.
 */
onDragToSelectStart = (data) => {
	const { x, y } = data;

	selectBox.x = transform.invertX(x);
	selectBox.y = transform.invertY(y);
};

/**
 * Handles movement during drag-to-select.
 * @param {Object} data - Drag move data.
 */
onDragToSelectMove = (data) => {
	const x = transform.invertX(data.x);
	const y = transform.invertY(data.y);

	selectBox.width = x - selectBox.x;
	selectBox.height = y - selectBox.y;

	const left = Math.min(selectBox.x, x);
	const top = Math.min(selectBox.y, y);
	const right = Math.max(selectBox.x, x);
	const bottom = Math.max(selectBox.y, y);
	const selected = [];

	nodes.forEach(d => {
		if ((d.x >= left) && (d.x <= right) && (d.y >= top) && (d.y <= bottom)) {
			selected.push(d.id);
		};
	});

	send('onSelectByDragToSelect', { selected })
	redraw();
};

/**
 * Handles the end of a drag-to-select operation.
 */
onDragToSelectEnd = () => {
	selectBox = { x: 0, y: 0, width: 0, height: 0 };
	send('onTransform', { ...transform });
};

/**
 * Handles the start of a drag event.
 * @param {Object} param - Drag event data.
 */
onDragStart = ({ active }) => {
	if (!active) {
		restart(0.3);
	};
};

/**
 * Handles movement during a drag event.
 * @param {Object} param - Drag move data.
 */
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

/**
 * Handles the end of a drag event.
 * @param {Object} param - Drag end data.
 */
onDragEnd = ({ active }) => {
	if (!active) {
		simulation.alphaTarget(0);
	};
};

/**
 * Handles click events on the canvas.
 * @param {Object} param - Click event data.
 */
onClick = ({ x, y }) => {
  	const d = getNodeByCoords(x, y);
	send('onClick', { node: d?.id });
};

/**
 * Handles selection events, optionally selecting related nodes.
 * @param {Object} param - Selection event data.
 */
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

/**
 * Handles setting the root node by coordinates.
 * @param {Object} param - Set root event data.
 */
onSetRootId = ({ x, y }) => {
  	const d = getNodeByCoords(x, y);
	if (d) {
		this.setRootId({ rootId: d.id });
		send('setRootId', { node: d.id });
	};
};

/**
 * Sets the edge list and updates forces.
 * @param {Object} param - Edge data.
 */
onSetEdges = (param) => {
	data.edges = param.edges;
	updateForces();
};

/**
 * Sets the selected node IDs and redraws.
 * @param {Object} param - Selection data.
 */
onSetSelected = ({ ids }) => {
	selected = ids;
	redraw();
};

/**
 * Handles mouse move events, updating hover state and triggering redraws.
 * @param {Object} param - Mouse move data.
 */
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

/**
 * Handles context menu events on nodes or space.
 * @param {Object} param - Context menu event data.
 */
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

/**
 * Adds a new node to the graph, optionally linking to a source node.
 * @param {Object} param - Node addition data.
 */
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

/**
 * Removes nodes and their edges from the graph.
 * @param {Object} param - Node removal data.
 */
onRemoveNode = ({ ids }) => {
	isHovering = false;

	data.nodes = data.nodes.filter(d => !ids.includes(d.id));
	data.edges = data.edges.filter(d => !ids.includes(d.source.id) && !ids.includes(d.target.id));

	updateForces();
};

/**
 * Sets the root node by ID and animates the view to center on it.
 * @param {Object} param - Root node data.
 */
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

/**
 * Restarts the simulation with a new alpha target.
 * @param {number} alpha - The alpha target for the simulation.
 */
restart = (alpha) => {
	simulation.alphaTarget(alpha).restart();
};

/**
 * Resizes the canvas and redraws the graph.
 * @param {Object} data - Resize data.
 */
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

/**
 * Sends a message to the main thread.
 * @param {string} id - Message type.
 * @param {any} data - Message payload.
 */
const send = (id, data) => {
	this.postMessage({ id, data });
};

/**
 * Checks if a node is within the current viewport.
 * @param {Object} d - The node object.
 * @returns {boolean} True if the node is in the viewport.
 */
const checkNodeInViewport = (d) => {
	const dr = d.radius * transform.k;
	const distX = transform.x + d.x * transform.k - dr;
	const distY = transform.y + d.y * transform.k - dr;

	return (distX >= -dr * 2) && (distX <= width) && (distY >= -dr * 2) && (distY <= height);
};

/**
 * Checks if a node uses the Human layout.
 * @param {Object} d - The node object.
 * @returns {boolean}
 */
const isLayoutHuman = (d) => {
	return d.layout == Layout.Human;
};

/**
 * Checks if a node uses the Participant layout.
 * @param {Object} d - The node object.
 * @returns {boolean}
 */
const isLayoutParticipant = (d) => {
	return d.layout == Layout.Participant;
};

/**
 * Checks if a node uses the Bookmark layout.
 * @param {Object} d - The node object.
 * @returns {boolean}
 */
const isLayoutBookmark = (d) => {
	return d.layout == Layout.Bookmark;
};

/**
 * Gets a node by its ID.
 * @param {string|number} id - The node ID.
 * @returns {Object|undefined} The node object or undefined.
 */
const getNodeById = (id) => {
	return nodeMap.get(id) || nodes.find(d => d.id == id);
};

/**
 * Gets a node by canvas coordinates.
 * @param {number} x - The x coordinate.
 * @param {number} y - The y coordinate.
 * @returns {Object|undefined} The node object or undefined.
 */
const getNodeByCoords = (x, y) => {
	return simulation.find(transform.invertX(x), transform.invertY(y), 10 / transform.k);
};

/**
 * Gets all edges connected to a node by ID.
 * @param {string|number} id - The node ID.
 * @returns {Object[]} Array of edge objects.
 */
const getEdgesByNodeId = (id) => {
	return edges.filter(d => (d.source == id) || (d.target == id));
};

/**
 * Recursively filters edges by depth from a set of source node IDs.
 * @param {Array<string|number>} sourceIds - Source node IDs.
 * @param {number} depth - Depth to traverse.
 * @returns {Object[]} Array of edge objects within the given depth.
 */
const filterEdgesByDepth = (sourceIds, depth) => {
	if (!depth) {
		return [];
	};

	const sourceSet = new Set(sourceIds);
	const filtered = edges.filter(d => sourceSet.has(d.source) || sourceSet.has(d.target));
	const nextIds = [];

	for (let i = 0; i < filtered.length; i++) {
		nextIds.push(filtered[i].source, filtered[i].target);
	};

	let ret = filtered.slice();
	if (nextIds.length && (depth > 1)) {
		ret = ret.concat(filterEdgesByDepth(nextIds, depth - 1));
	};

	return ret;
};

/**
 * Gets a set of node IDs from a list of edges.
 * @param {Object[]} edges - Array of edge objects.
 * @returns {Set<string|number>} Set of node IDs.
 */
const nodeIdsFromEdges = (edges) => {
	return new Set([].concat(edges.map(d => d.source)).concat(edges.map(d => d.target)));
};

/**
 * Calculates the display radius for a node based on settings and degree.
 * @param {Object} d - The node object.
 * @returns {number} The calculated radius.
 */
const getRadius = (d) => {
	let k = 1;
	if (settings.icon && images[d.src] && (transform.k >= transformThresholdHalf)) {
		k = 2;
	};

	let degree = 0;
	if (settings.link) {
		degree += d.linkCnt;
	};
	if (settings.relation) {
		degree += d.relationCnt;
	};

	maxDegree = Math.max(maxDegree, degree);

	if (maxDegree > 0) {
		const logDegree = Math.log(degree + 1);
    	const logMaxDegree = Math.log(maxDegree + 1);

		k += (logDegree / logMaxDegree) * 0.9;
	};

	return d.radius / transform.k * k;
};

/**
 * Gets the current font string for canvas text rendering.
 * @returns {string} The font string.
 */
const getFont = () => {
	return `${12 / transform.k}px ${fontFamily}`;
};

/**
 * Builds a map of node IDs to node objects.
 * @returns {Map<string|number, Object>} Node map.
 */
const getNodeMap = () => {
	return new Map(nodes.map(d => [ d.id, d ]));
};

/**
 * Calculates the center transform for a given x, y position.
 * @param {number} x - The x coordinate.
 * @param {number} y - The y coordinate.
 * @returns {{x: number, y: number}} The center transform.
 */
const getCenter = (x, y) => {
	return { x: width / 2 - x * transform.k, y: height / 2 - y * transform.k };
};

/**
 * Gets the current line width for drawing edges.
 * @returns {number} The line width.
 */
const getLineWidth = () => {
	return 0.4 / transform.k;
};

/**
 * Gets the current border radius for drawing rounded rectangles.
 * @returns {number} The border radius.
 */
const getBorderRadius = () => {
	return 3.33 / transform.k;
};

/**
 * Checks if two arrays have any intersecting values.
 * @param {Array} arr1 - First array.
 * @param {Array} arr2 - Second array.
 * @returns {boolean} True if there is any intersection.
 */
const intersect = (arr1, arr2) => {
	const set2 = new Set(arr2);
	return arr1.filter(item => set2.has(item)).length > 0;
};