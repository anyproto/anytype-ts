importScripts('d3/d3-quadtree.min.js');
importScripts('d3/d3-zoom.min.js');
importScripts('d3/d3-drag.min.js');
importScripts('d3/d3-dispatch.min.js');
importScripts('d3/d3-timer.min.js');
importScripts('d3/d3-force.min.js');

let canvas = null;
let ctx = null;
let width = 0;
let height = 0;
let density = 0;
let transform = null;
let nodes = [];
let edges = [];
let forceProps = {};
let images = {};
let simulation = null;

addEventListener('message', ({ data }) => { 
	this[data.id](data); 
});

init = (data) => {
	canvas = data.canvas;
	ctx = canvas.getContext('2d');
	width = data.width;
	height = data.height;
	density = data.density;
	forceProps = data.forceProps;
	nodes = data.nodes;
	edges = data.edges;

	transform = d3.zoomIdentity.translate(-width, -height).scale(3);

	ctx.canvas.width = width * density;
	ctx.canvas.height = height * density;
	ctx.scale(density, density);

	simulation = d3.forceSimulation(nodes);

	initForces();
	simulation.on('tick', () => { draw(); });
	simulation.on('end', () => { simulation.alphaTarget(1); });
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
	.force('forceY', d3.forceY());

	updateForces();
};

updateForces = () => {
	simulation.force('center')
	.x(width * forceProps.center.x)
	.y(height * forceProps.center.y);

	simulation.force('charge')
	.strength(forceProps.charge.strength * forceProps.charge.enabled)
	.distanceMin(forceProps.charge.distanceMin)
	.distanceMax(forceProps.charge.distanceMax);

	simulation.force('collide')
	.strength(forceProps.collide.strength * forceProps.collide.enabled)
	.radius(10 * forceProps.collide.radius)
	.iterations(forceProps.collide.iterations);

	simulation.force('link')
	.id(d => d.id)
	.distance(forceProps.link.distance)
	.strength(forceProps.link.strength * forceProps.link.enabled)
	.iterations(forceProps.link.iterations)
	.links(forceProps.link.enabled ? edges : []);

	simulation.force('forceX')
	.strength(forceProps.forceX.strength * forceProps.forceX.enabled)
	.x(width * forceProps.forceX.x);

	simulation.force('forceY')
	.strength(forceProps.forceY.strength * forceProps.forceY.enabled)
	.y(height * forceProps.forceY.y);

	simulation.alpha(1).restart();
};

draw = () => {
	ctx.save();

	ctx.clearRect(0, 0, width, height);
	ctx.translate(transform.x, transform.y);
	ctx.scale(transform.k, transform.k);

	edges.forEach(d => drawLink(d));
	nodes.forEach(d => {
		if (!forceProps.orphans && d.isOrphan) {
			return;
		};

		drawNode(d);
	});
	ctx.restore();
};

drawLink = (d) => {
	ctx.beginPath();
	ctx.moveTo(d.source.x, d.source.y);
	ctx.lineTo(d.target.x, d.target.y);
	ctx.lineWidth = 0.5;
	ctx.strokeStyle = d.bg;
	ctx.stroke();
};

drawNode = (d) => {
	let bg = '#f3f2ec';
	let color = '#929082';

	if (forceProps.filter && d.name.match(forceProps.filter)) {
		bg = '#e3f7d0';
	};
	if (d.isRoot) {
		bg = '#fef3c5';
		color = '#000';
	};

	ctx.beginPath();
	ctx.arc(d.x, d.y, d.radius, 0, 2 * Math.PI, true);
	ctx.fillStyle = bg;
	ctx.fill();

	ctx.font = '3px Helvetica';
	ctx.fillStyle = color;
	ctx.textAlign = 'center';
	ctx.fillText(d.name, d.x, d.y + d.radius + 4);

	if (!images[d.src]) {
		return;
	};

	let x = d.x - d.radius / 2;
	let y = d.y - d.radius / 2;
	let w = d.radius;

	ctx.save();

	if (d.iconImage) {
		x = d.x - d.radius;
		y = d.y - d.radius;
		w = d.radius * 2;

		ctx.beginPath();
		ctx.arc(d.x, d.y, d.radius, 0, 2 * Math.PI, true);
		ctx.closePath();
		ctx.fill();

		ctx.clip();
	};

	ctx.drawImage(images[d.src], 0, 0, images[d.src].width, images[d.src].width, x, y, w, w);
	ctx.restore();
};

onZoom = (data) => {
	const { x, y, k } = data.transform;

	transform.x = x;
	transform.y = y;
	transform.k = k;

	draw();
};

onDragStart = ({ subject, active, x, y }) => {
	if (!active) {
		simulation.alphaTarget(0.3).restart();
	};

	onDragMove({ subject, active, x, y });
};

onDragMove = ({ subject, active, x, y }) => {
	if (!active) {
		simulation.alphaTarget(0.3).restart();
	};

	if (!subject) {
		return;
	};

	const d = nodes.find((it) => { return it.id == subject.id; });
	if (d) {
		d.fx = transform.invertX(x) - d.radius / 2;
		d.fy = transform.invertY(y) - d.radius / 2;

		draw();
	};
};

onDragEnd = ({ active }) => {
	if (!active) {
		simulation.alphaTarget(0);
	};
};

onClick = ({ x, y }) => {
  	const d = simulation.find(transform.invertX(x), transform.invertY(y), 10);
	if (d) {
		this.postMessage({ id: 'onClick', node: d });
	};
};

onMouseMove = ({ x, y }) => {
	const d = simulation.find(transform.invertX(x), transform.invertY(y), 10);
	this.postMessage({ id: 'onMouseMove', node: d, x: x, y: y });
};