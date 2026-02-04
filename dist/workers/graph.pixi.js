/**
 * Graph rendering worker using PixiJS WebGL and D3 force simulation.
 * GPU-accelerated rendering for improved performance with large graphs.
 *
 * @file dist/workers/graph.pixi.js
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
	'./lib/pixi.min.js',
	'./lib/util.js'
);

const util = new Util();

// CONSTANTS

const transformThreshold = 1;
const transformThresholdHalf = transformThreshold / 2;
const delayFocus = 1000;
const maxClusterRadius = 500;

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
let fontFamily = 'Inter, Helvetica, sans-serif';
let timeoutHover = 0;
let rootId = '';
let root = null;
let paused = false;
let isOver = '';
let maxDegree = 0;
let selectBox = { x: 0, y: 0, width: 0, height: 0 };
let borderRadius = 0;
let lineWidth = 0;
let lineWidth3 = 0;

// PixiJS objects
let app = null;
let edgesGraphics = null;
let nodesContainer = null;
let labelsContainer = null;
let edgeLabelsContainer = null;
let selectBoxGraphics = null;
let nodeSprites = new Map();
let nodeLabels = new Map();
let edgeLabels = new Map();
let circleTexture = null;
let initialized = false;

addEventListener('message', ({ data }) => {
	if (this[data.id]) {
		this[data.id](data);
	};
});

/**
 * Initializes the graph worker with provided parameters and sets up the simulation.
 * @param {Object} param - Initialization parameters including canvas, nodes, edges, settings, etc.
 */
init = async (param) => {
	data = param;
	canvas = data.canvas;
	settings = data.settings;
	rootId = data.rootId;
	zoom = data.zoom;
	width = data.width;
	height = data.height;
	density = data.density;

	// Shallow copy with object spread - faster than deep copy for initial load
	edges = data.edges.map(d => ({ ...d }));
	nodes = data.nodes.map(d => ({ ...d }));

	initTheme(data.theme);
	recalcConstants();

	transform = d3.zoomIdentity.translate(zoom.x, zoom.y).scale(zoom.k);

	// Initialize simulation with fast convergence settings
	simulation = d3.forceSimulation(nodes);
	simulation.alpha(1);
	simulation.alphaDecay(0.05);
	simulation.alphaMin(0.01); // Stop earlier - good enough layout

	// Initialize forces
	initForcesOnly();

	// Run simulation to completion - no animation, show final state immediately
	const maxIterations = 300; // Safety limit
	let iterations = 0;
	while (simulation.alpha() > simulation.alphaMin() && iterations < maxIterations) {
		simulation.tick();
		iterations++;
	};
	simulation.stop();

	// Initialize PixiJS
	await initPixi();

	// Set up tick handler for future interactions (drag, settings changes)
	simulation.on('tick', () => redraw());

	root = getNodeById(rootId);

	const x = root ? root.x : width / 2;
	const y = root ? root.y : height / 2;

	transform = Object.assign(transform, getCenter(x, y));

	// Build node sprites after PixiJS is ready
	updateNodeSprites();

	// Draw the settled graph
	redraw();

	send('onTransform', { ...transform });
};

/**
 * Initialize PixiJS application and containers
 */
initPixi = async () => {
	if (initialized) {
		return;
	};

	app = new PIXI.Application();

	await app.init({
		canvas: canvas,
		width: width * density,
		height: height * density,
		antialias: true,
		backgroundAlpha: 0,
		resolution: 1,
		autoDensity: false,
		preference: 'webgl',
		powerPreference: 'high-performance',
		hello: false, // Disable console hello message
	});

	// Create render containers with optimized settings
	edgesGraphics = new PIXI.Graphics();
	edgeLabelsContainer = new PIXI.Container();
	nodesContainer = new PIXI.Container();
	labelsContainer = new PIXI.Container();
	selectBoxGraphics = new PIXI.Graphics();

	// Disable interactivity - we handle events manually via D3
	edgesGraphics.eventMode = 'none';
	edgeLabelsContainer.eventMode = 'none';
	nodesContainer.eventMode = 'none';
	labelsContainer.eventMode = 'none';
	selectBoxGraphics.eventMode = 'none';

	app.stage.addChild(edgesGraphics);
	app.stage.addChild(edgeLabelsContainer);
	app.stage.addChild(nodesContainer);
	app.stage.addChild(labelsContainer);
	app.stage.addChild(selectBoxGraphics);

	// Create base circle texture for nodes
	createCircleTexture();

	initialized = true;
};

/**
 * Creates a reusable circle texture for node sprites
 */
createCircleTexture = () => {
	const size = 64;
	const graphics = new PIXI.Graphics();

	graphics.circle(size / 2, size / 2, size / 2);
	graphics.fill({ color: 0xffffff });

	circleTexture = app.renderer.generateTexture(graphics);
	graphics.destroy();
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
 * Registers an image bitmap for a given source.
 * @param {{src: string, bitmap: ImageBitmap}} param - Image source and bitmap.
 */
image = ({ src, bitmap }) => {
	if (!images[src]) {
		images[src] = bitmap;

		// Create texture from bitmap for PixiJS
		if (app && app.renderer) {
			const texture = PIXI.Texture.from(bitmap);
			images[src + '_texture'] = texture;
		};
	};
};

/**
 * Initializes D3 forces for the simulation (without triggering updateForces/redraw).
 * Used during initial setup to avoid redundant work.
 */
initForcesOnly = () => {
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
	.distance(link.distance)
	.strength(d => d.source.type == d.target.type ? 1 : 0.5);

	simulation.force('forceX')
	.strength(d => !d.isOrphan ? forceX.strength : 0)
	.x(width * forceX.x);

	simulation.force('forceY')
	.strength(d => !d.isOrphan ? forceY.strength : 0)
	.y(height * forceY.y);

	// Build edgeMap and nodeMap
	const tmpEdgeMap = getEdgeMap();
	edgeMap.clear();
	nodes.forEach(d => {
		edgeMap.set(d.id, tmpEdgeMap.get(d.id) || []);
	});
	nodeMap = getNodeMap();

	// Set up clusters if enabled
	updateClusters();
};

/**
 * Initializes D3 forces for the simulation.
 */
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
	if (settings.link) {
		types.push(EdgeType.Link);
	};
	if (settings.relation) {
		types.push(EdgeType.Relation);
	};

	// Use shallow copy instead of deep copy - sufficient for filtering
	edges = data.edges.map(d => ({ ...d }));
	nodes = data.nodes.map(d => ({ ...d }));

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

	updateClusters();
	updateNodeSprites();
	redraw();
};

/**
 * Updates cluster by types force
 */
updateClusters = () => {
	if (settings.cluster) {
		const clusters = getClusters();

		simulation.force('cluster', d3.forceCluster()
			.centers(d => clusters.find(c => c.id == d.typeKey))
			.strength(1)
			.centerInertia(0.1));

		simulation.force('collide', d3.forceCollide(d => getRadius(d) * 1.2));
	} else {
		simulation.force('cluster', null);
		simulation.force('collide', null);
	};
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

	if (needUpdate) {
		updateForces();
	} else {
		redraw();
	};

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
 * @returns {Map<*, Object[]>} A map where each key is a vertex ID and each value is an array of edge objects.
 */
getEdgeMap = () => {
	const map = new Map();

	for (let i = 0; i < edges.length; i++) {
		const e = edges[i];
		const sid = typeof(e.source) == 'object' ? e.source.id : e.source;
		const tid = typeof(e.target) == 'object' ? e.target.id : e.target;

		if (!map.has(sid)) {
			map.set(sid, []);
		};
		if (!map.has(tid)) {
			map.set(tid, []);
		};

		map.get(sid).push(e);
		map.get(tid).push(e);
	};

	return map;
};

getClusters = () => {
	const map = new Map();

	nodes.forEach(d => {
		if (d.typeKey && !map.has(d.typeKey)) {
			map.set(d.typeKey, { id: d.typeKey, radius: 0, x: 0, y: 0 });
		};
	});

	let clusters = Array.from(map.values());

	const l = clusters.length;

	clusters = clusters.map((c, i) => {
		c.radius = Math.sqrt((i + 1) / l * -Math.log(Math.random())) * maxClusterRadius;
		c.x = Math.cos(i / l * 2 * Math.PI) * 150 + width / 2 + Math.random();
		c.y = Math.sin(i / l * 2 * Math.PI) * 150 + height / 2 + Math.random();
		return c;
	});

	return clusters;
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
 * Update or create sprites for nodes
 */
updateNodeSprites = () => {
	if (!app || !nodesContainer) {
		return;
	};

	// Track existing node IDs
	const currentNodeIds = new Set(nodes.map(d => d.id));

	// Remove sprites for nodes that no longer exist
	for (const [id, sprite] of nodeSprites) {
		if (!currentNodeIds.has(id)) {
			nodesContainer.removeChild(sprite);
			sprite.destroy();
			nodeSprites.delete(id);
		};
	};

	// Remove labels for nodes that no longer exist
	for (const [id, label] of nodeLabels) {
		if (!currentNodeIds.has(id)) {
			labelsContainer.removeChild(label);
			label.destroy();
			nodeLabels.delete(id);
		};
	};

	// Pre-create sprites and labels for new nodes
	// This avoids expensive object creation during the render loop
	for (const d of nodes) {
		// Pre-create sprite if needed
		if (!nodeSprites.has(d.id)) {
			const sprite = new PIXI.Sprite(circleTexture);
			sprite.anchor.set(0.5);
			sprite.visible = false;
			nodesContainer.addChild(sprite);
			nodeSprites.set(d.id, sprite);
		};

		// Pre-create label if needed (labels are expensive to create)
		if (!nodeLabels.has(d.id)) {
			const label = new PIXI.Text({
				text: d.shortName || '',
				style: new PIXI.TextStyle({
					fontFamily: fontFamily,
					fontSize: 12,
					fill: parseColor(data.colors?.text || '#000000'),
					align: 'center',
				}),
			});
			label.anchor.set(0.5, 0);
			label.visible = false;
			labelsContainer.addChild(label);
			nodeLabels.set(d.id, label);
		};
	};
};

/**
 * Draws the entire graph (edges, nodes, selection box) for the current frame.
 * @param {number} t - The current animation time.
 */
draw = (t) => {
	if (!app || !initialized) {
		return;
	};

	recalcConstants();

	time = t;
	TWEEN.update();

	// Update stage transform
	app.stage.scale.set(transform.k * density);
	app.stage.position.set(transform.x * density, transform.y * density);

	// Clear and redraw edges
	edgesGraphics.clear();

	// Clear any edge labels
	if (edgeLabelsContainer) {
		edgeLabelsContainer.removeChildren();
		edgeLabels.clear();
	};

	const radius = 5.7 / transform.k;

	edges.forEach(d => {
		if (checkNodeInViewport(d.target) || checkNodeInViewport(d.source)) {
			drawEdge(d, radius, radius * 1.3, settings.marker && d.isDouble, settings.marker);
		};
	});

	// Update nodes
	nodes.forEach(d => {
		if (checkNodeInViewport(d)) {
			drawNode(d);
		} else {
			hideNode(d);
		};
	});

	// Draw selection box
	selectBoxGraphics.clear();
	if (selectBox.x && selectBox.y && selectBox.width && selectBox.height) {
		drawSelectBox();
	};

	// Render
	app.render();
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
 * Draws a single edge using PixiJS Graphics.
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

	let colorLink = parseColor(data.colors.link);
	let colorArrow = parseColor(data.colors.arrow);
	let colorText = parseColor(data.colors.text);
	let alpha = 1;

	if (isHovering) {
		alpha = hoverAlpha;
	};

	if (io) {
		colorLink = colorArrow = colorText = parseColor(data.colors.highlight);
		alpha = 1;
	};

	// Draw the edge line
	edgesGraphics.moveTo(sx1, sy1);
	edgesGraphics.lineTo(sx2, sy2);
	edgesGraphics.stroke({ width: lineWidth, color: colorLink, alpha: alpha });

	let tw = 0;
	let th = 0;
	let offset = arrowStart && arrowEnd ? -k : 0;

	// Relation name label
	if (showName && transform.k >= transformThreshold) {
		// Use fixed font size for crisp rendering, scale container instead
		const baseFontSize = 12;
		const labelScale = 1 / transform.k;
		const scaledPadding = k * transform.k;
		const scaledBorderRadius = borderRadius * transform.k;
		const scaledLineWidth = lineWidth3 * transform.k;

		// Get or create label for this edge
		const edgeKey = d.source.id + '-' + d.target.id;
		let labelContainer = edgeLabels.get(edgeKey);

		if (!labelContainer) {
			labelContainer = new PIXI.Container();
			edgeLabelsContainer.addChild(labelContainer);
			edgeLabels.set(edgeKey, labelContainer);
		};

		// Clear previous content
		labelContainer.removeChildren();

		// Create text at base resolution for crisp rendering
		const label = new PIXI.Text({
			text: d.name,
			style: new PIXI.TextStyle({
				fontFamily: fontFamily,
				fontSize: baseFontSize,
				fill: colorText,
				align: 'center',
			}),
		});
		label.anchor.set(0.5);

		// Get text dimensions at base size
		const textWidth = label.width;
		const textHeight = label.height;

		// Calculate world-space dimensions for arrow offset
		tw = textWidth * labelScale;
		th = textHeight * labelScale;
		offset = arrowHeight / 2;

		// Create background rectangle in label space
		const bgGraphics = new PIXI.Graphics();
		bgGraphics.roundRect(
			-textWidth / 2 - scaledPadding,
			-textHeight / 2 - scaledPadding,
			textWidth + scaledPadding * 2,
			textHeight + scaledPadding * 2,
			scaledBorderRadius
		);
		bgGraphics.fill({ color: parseColor(data.colors.bg) });
		bgGraphics.stroke({ width: scaledLineWidth, color: colorLink });

		labelContainer.addChild(bgGraphics);
		labelContainer.addChild(label);

		// Position, rotate, and scale the container
		labelContainer.position.set(mx, my);
		labelContainer.scale.set(labelScale);
		// Rotate to align with edge, but keep text readable (flip if pointing left)
		labelContainer.rotation = Math.abs(a1) <= 1.5 ? a1 : a2;
		labelContainer.visible = true;
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
			drawArrowHead(sax1, say1, a1, arrowWidth, arrowHeight, colorArrow, alpha);
		};

		if (arrowEnd) {
			const sax2 = mx - move * cos2;
			const say2 = my - move * sin2;
			drawArrowHead(sax2, say2, a2, arrowWidth, arrowHeight, colorArrow, alpha);
		};
	};
};

/**
 * Draws an arrowhead at the specified position
 */
drawArrowHead = (x, y, angle, width, height, color, alpha) => {
	if (!width || !height) {
		return;
	};

	const halfWidth = width / 2;
	const cos = Math.cos(angle);
	const sin = Math.sin(angle);

	// Calculate arrow points
	const tipX = x;
	const tipY = y;
	const baseX1 = x + height * cos - halfWidth * (-sin);
	const baseY1 = y + height * sin - halfWidth * cos;
	const baseX2 = x + height * cos + halfWidth * (-sin);
	const baseY2 = y + height * sin + halfWidth * cos;

	edgesGraphics.moveTo(tipX, tipY);
	edgesGraphics.lineTo(baseX1, baseY1);
	edgesGraphics.lineTo(baseX2, baseY2);
	edgesGraphics.lineTo(tipX, tipY);
	edgesGraphics.fill({ color: color, alpha: alpha });
};

/**
 * Draws a single node using PixiJS sprites.
 * @param {Object} d - The node object.
 */
drawNode = (d) => {
	const radius = getRadius(d);
	const img = images[d.src];
	const texture = images[d.src + '_texture'];
	const diameter = radius * 2;
	const isSelected = selected.includes(d.id);
	const io = isOver == d.id;
	const iconColors = data.colors?.icon || {};
	const opt = (iconColors.list || [])[d.iconOption - 1];

	let colorNode = parseColor(iconColors.bg?.[opt] || data.colors.node);
	let colorLine = null;
	let lw = 0;
	let alpha = 1;

	if (isHovering) {
		alpha = hoverAlpha;

		const connections = edgeMap.get(d.id);
		if (connections && connections.length) {
			for (let i = 0; i < connections.length; i++) {
				if ((isOver == connections[i].source.id) || (isOver == connections[i].target.id)) {
					alpha = 1;
					break;
				};
			};
		};
	};

	if (io || (root && (d.id == root.id))) {
		colorNode = colorLine = parseColor(data.colors.highlight);
		lw = lineWidth3;
		alpha = 1;
	};

	if (isSelected) {
		colorNode = colorLine = parseColor(data.colors.selected);
	};

	if (io || isSelected) {
		lw = lineWidth3;
	};

	// Get or create sprite for this node
	let sprite = nodeSprites.get(d.id);
	const showIcon = settings.icon && texture && (transform.k >= transformThresholdHalf);

	if (!sprite) {
		if (showIcon) {
			sprite = new PIXI.Sprite(texture);
		} else {
			sprite = new PIXI.Sprite(circleTexture);
		};
		nodesContainer.addChild(sprite);
		nodeSprites.set(d.id, sprite);
	};

	// Update sprite texture if needed
	if (showIcon && sprite.texture !== texture) {
		sprite.texture = texture;
	} else
	if (!showIcon && sprite.texture !== circleTexture) {
		sprite.texture = circleTexture;
	};

	// Update sprite properties
	sprite.visible = true;
	sprite.alpha = alpha;
	sprite.anchor.set(0.5);
	sprite.position.set(d.x, d.y);

	if (showIcon) {
		// For image icons, preserve aspect ratio
		const maxSize = diameter;
		const scale = maxSize / Math.max(img.width, img.height);
		sprite.scale.set(scale);

		// Apply mask for human/participant layouts (circular)
		if (isLayoutHuman(d) || isLayoutParticipant(d)) {
			sprite.tint = 0xffffff;
		} else {
			sprite.tint = 0xffffff;
		};
	} else {
		// For circle nodes, scale based on radius
		const baseRadius = 32; // circleTexture is 64x64
		sprite.scale.set(radius / baseRadius);
		sprite.tint = colorNode;
	};

	// Draw outline if needed
	if (lw > 0) {
		if (showIcon) {
			// Rounded rectangle outline for all icons (matching canvas behavior)
			const size = diameter + lw * 4;
			edgesGraphics.roundRect(d.x - size / 2, d.y - size / 2, size, size, borderRadius);
			edgesGraphics.stroke({ width: lw, color: colorLine });
		} else {
			// Circle outline for non-icon nodes
			edgesGraphics.circle(d.x, d.y, radius + lw);
			edgesGraphics.stroke({ width: lw, color: colorLine });
		};
	};

	// Node label
	if (settings.label && (transform.k >= transformThreshold)) {
		let label = nodeLabels.get(d.id);

		if (!label) {
			label = new PIXI.Text({
				text: d.shortName || '',
				style: {
					fontFamily: fontFamily,
					fontSize: 12,
					fill: parseColor(data.colors.text),
					align: 'center',
				},
			});
			label.anchor.set(0.5, 0);
			labelsContainer.addChild(label);
			nodeLabels.set(d.id, label);
		};

		const labelScale = 1 / transform.k;
		label.scale.set(labelScale);
		label.position.set(d.x, d.y + radius + 4 / transform.k);
		label.style.fill = io || isSelected ? (isSelected ? parseColor(data.colors.selected) : parseColor(data.colors.highlight)) : parseColor(data.colors.text);
		label.text = d.shortName || '';
		label.visible = true;
		label.alpha = alpha;
	} else {
		const label = nodeLabels.get(d.id);
		if (label) {
			label.visible = false;
		};
	};
};

/**
 * Hides a node sprite when it's outside viewport
 */
hideNode = (d) => {
	const sprite = nodeSprites.get(d.id);
	if (sprite) {
		sprite.visible = false;
	};

	const label = nodeLabels.get(d.id);
	if (label) {
		label.visible = false;
	};
};

/**
 * Draws the selection box for drag-to-select.
 */
drawSelectBox = () => {
	const { x, y, width, height } = selectBox;

	selectBoxGraphics.roundRect(x, y, width, height, 1);
	selectBoxGraphics.stroke({ width: lineWidth3, color: parseColor(data.colors.selected) });
};

/**
 * Handles zoom events and updates the transform.
 * @param {Object} data - Zoom event data.
 */
onZoom = (data) => {
	transform = Object.assign(transform, data.transform);

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

	// Remove sprites for deleted nodes
	ids.forEach(id => {
		const sprite = nodeSprites.get(id);
		if (sprite) {
			nodesContainer.removeChild(sprite);
			sprite.destroy();
			nodeSprites.delete(id);
		};

		const label = nodeLabels.get(id);
		if (label) {
			labelsContainer.removeChild(label);
			label.destroy();
			nodeLabels.delete(id);
		};
	});

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

	if (app && app.renderer) {
		app.renderer.resize(width * density, height * density);
	};

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
 * Parses a CSS color string to a numeric value for PixiJS
 * @param {string} color - CSS color string (hex or rgba)
 * @returns {number} Numeric color value
 */
const parseColor = (color) => {
	if (!color) {
		return 0x000000;
	};

	if (typeof color === 'number') {
		return color;
	};

	// Handle hex colors
	if (color.startsWith('#')) {
		return parseInt(color.slice(1), 16);
	};

	// Handle rgba colors
	if (color.startsWith('rgba') || color.startsWith('rgb')) {
		const match = color.match(/[\d.]+/g);
		if (match && match.length >= 3) {
			const r = parseInt(match[0]);
			const g = parseInt(match[1]);
			const b = parseInt(match[2]);
			return (r << 16) | (g << 8) | b;
		};
	};

	return 0x000000;
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
