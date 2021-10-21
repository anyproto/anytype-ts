importScripts('d3/d3-quadtree.min.js');
importScripts('d3/d3-zoom.min.js');
importScripts('d3/d3-drag.min.js');
importScripts('d3/d3-dispatch.min.js');
importScripts('d3/d3-timer.min.js');
importScripts('d3/d3-selection.min.js');
importScripts('d3/d3-force.min.js');

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
let Color = {
	bg: '#fff',
	text: '#2c2b27',
	link: {
		0: '#dfddd0',
		1: '#8c9ea5',
		over: '#ffd15b',
	},
	node: {
		common: '#f3f2ec',
		filter: '#e3f7d0',
		focused: '#fef3c5',
		over: '#d6f5f3',
	},
};
let LineWidth = 0.25;

addEventListener('message', ({ data }) => { 
	if (this[data.id]) {
		this[data.id](data); 
	};
});

init = (data) => {
	canvas = data.canvas;
	ctx = canvas.getContext('2d');
	forceProps = data.forceProps;
	nodes = data.nodes;
	edges = data.edges;

	offscreen = new OffscreenCanvas(250, 40);
	octx = offscreen.getContext('2d');

	resize(data);

	transform = d3.zoomIdentity.translate(-width, -height).scale(3);
	simulation = d3.forceSimulation(nodes);

	nodes = nodes.map((d) => {
		if (d.isRoot) {
			d.fx = width / 2;
			d.fy = height / 2;
			d.radius = 6;
		};

		octx.save();
		octx.clearRect(0, 0, 250, 40);
		octx.font = '20px Helvetica';
		octx.fillStyle = Color.text;
		octx.textAlign = 'center';
		octx.fillText(d.shortName, 125, 20);
		octx.restore();

		d.textBitmap = offscreen.transferToImageBitmap();
		return d;
	});

	initForces();
	simulation.on('tick', () => { redraw(); });
	simulation.on('end', () => { simulation.alphaTarget(1); });
	simulation.tick(300);
};

image = ({ src, bitmap }) => {
	if (!images[src]) {
		images[src] = bitmap;
	};
};

updateProps = (data) => {
	forceProps = data.forceProps;
	redraw();
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

	edges.forEach(d => {
		if (!forceProps.links && (d.type == 0)) {
			return;
		};
		if (!forceProps.relations && (d.type == 1)) {
			return;
		};

		drawLine(d, 1, 1, false, forceProps.markers);
	});

	nodes.forEach(d => {
		if (!forceProps.orphans && d.isOrphan && !d.isRoot) {
			return;
		};

		drawNode(d);
	});
	
	ctx.restore();
};

redraw = () => {
	requestAnimationFrame(draw);
};

drawLine = (d, aWidth, aLength, arrowStart, arrowEnd) => {
	let source = nodes.find(it => it.id == d.source.id);
	let x1 = d.source.x;
	let y1 = d.source.y;
	let r1 = d.source.radius + 3;
	let x2 = d.target.x;
	let y2 = d.target.y;
	let r2 = d.target.radius + 3;
	let bg = Color.link[d.type] || Color.link[0];

	ctx.globalAlpha = 1;
	if (forceProps.filter && !d.source.name.match(forceProps.filter) && !d.target.name.match(forceProps.filter)) {
		ctx.globalAlpha = 0.2;
	};

	if (source.isOver) {
		bg = Color.link.over;
	};

    let a1 = Math.atan2(y2 - y1, x2 - x1);
	let a2 = Math.atan2(y1 - y2, x1 - x2);

	let sx1 = x1 + r1 * Math.cos(a1);
	let sy1 = y1 + r1 * Math.sin(a1);
	let sx2 = x2 + r2 * Math.cos(a2);
	let sy2 = y2 + r2 * Math.sin(a2);
	let mx = (x1 + x2) / 2;  
    let my = (y1 + y2) / 2;

	ctx.lineCap = 'round';
	ctx.lineWidth = LineWidth;
	ctx.strokeStyle = bg;
	ctx.beginPath();
	ctx.moveTo(sx1, sy1);
	ctx.lineTo(sx2, sy2);
	ctx.stroke();

	if (arrowStart) {
		ctx.save();
		ctx.translate(sx1, sy1);
		ctx.rotate(a1);
		ctx.beginPath();
		ctx.moveTo(aLength, -aWidth);
        ctx.lineTo(0, 0);
        ctx.lineTo(aLength, aWidth);
		ctx.stroke();
		ctx.restore();
    };

    if (arrowEnd) {
		ctx.save();
		ctx.translate(sx2, sy2);
		ctx.rotate(a2);
		ctx.beginPath();
		ctx.moveTo(aLength, -aWidth);
        ctx.lineTo(0, 0);
        ctx.lineTo(aLength, aWidth);
		ctx.stroke();
		ctx.restore();
    };

	// draw name
	if (d.name && forceProps.labels && (transform.k > 1.5)) {
		ctx.save();
		ctx.translate(mx, my);
		ctx.font = 'italic 3px Helvetica';

		const metrics = ctx.measureText(d.name);
		const left = metrics.actualBoundingBoxLeft * -1;
		const top = metrics.actualBoundingBoxAscent * -1;
		const right = metrics.actualBoundingBoxRight;
		const bottom = metrics.actualBoundingBoxDescent;
		const width = right - left;
		const height = bottom - top;

		ctx.fillStyle = Color.bg;
		ctx.fillRect(left - width / 2 - 1, top + 0.5, width + 2, height + 1);

		ctx.fillStyle = bg;
		ctx.textAlign = 'center';
		ctx.fillText(d.name, 0, 1);

		ctx.restore();
	};
};

drawNode = (d) => {
	let bg = Color.node.common;
	let stroke = '';
	let img = images[d.src];
	let isMatched = forceProps.filter && d.name.match(forceProps.filter);

	ctx.save();
	ctx.lineWidth = 0;
	ctx.globalAlpha = 1;

	if (d.isRoot) {
		bg = Color.node.focused;
	};

	if (d.isOver) {
		stroke = Color.link.over;
		ctx.lineWidth = 1;
	};

	if (isMatched) {
		stroke = Color.link.over;
		ctx.lineWidth = 2;
	};

	if (forceProps.filter && !isMatched) {
		ctx.globalAlpha = 0.4;
	};

	if ([ 1, 2 ].indexOf(d.layout) >= 0) {
		ctx.beginPath();
		ctx.arc(d.x, d.y, d.radius, 0, 2 * Math.PI, true);
		ctx.closePath();
	} else {
		const r = d.iconImage ? d.radius / 8 : d.radius / 4;
		roundedRect(d.x - d.radius, d.y - d.radius, d.radius * 2, d.radius * 2, r);
	};

	if (stroke) {
		ctx.strokeStyle = stroke;
		ctx.stroke();
	};
	
	ctx.fillStyle = bg;
	ctx.fill();

	if (forceProps.labels && d.textBitmap && (transform.k > 1.5)) {
		const h = 5;
		const div = 6.25;
		ctx.drawImage(d.textBitmap, 0, 0, 250, 40, d.x - h * div / 2, d.y + d.radius + 1, h * div, h);
	};

	if (img) {
		let x = d.x - d.radius / 2;
		let y = d.y - d.radius / 2;
		let w = d.radius;
		let h = d.radius;
	
		if (d.iconImage) {
			x = d.x - d.radius;
			y = d.y - d.radius;
	
			if ([ 1, 2 ].indexOf(d.layout) >= 0) {
				ctx.beginPath();
				ctx.arc(d.x, d.y, d.radius, 0, 2 * Math.PI, true);
				ctx.closePath();
			} else {
				const r = d.iconImage ? d.radius / 8 : d.radius / 4;
				roundedRect(d.x - d.radius, d.y - d.radius, d.radius * 2, d.radius * 2, r);
			};
	
			ctx.fill();
			ctx.clip();
	
			if (img.width > img.height) {
				h = d.radius * 2;
				w = h * (img.width / img.height)
				x -= (w - d.radius * 2) / 2;
			} else {
				w = d.radius * 2;
				h = w * (img.height / img.width);
				y -= (h - d.radius * 2) / 2;
			};
		};
	
		ctx.drawImage(img, 0, 0, img.width, img.height, x, y, w, h);
	};

	ctx.restore();
};

roundedRect = (x, y, width, height, radius) => {
	ctx.beginPath();
	ctx.moveTo(x + radius, y);
	ctx.lineTo(x + width - radius, y);
	ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
	ctx.lineTo(x + width, y + height - radius);
	ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
	ctx.lineTo(x + radius, y + height);
	ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
	ctx.lineTo(x, y + radius);
	ctx.quadraticCurveTo(x, y, x + radius, y);
	ctx.closePath();
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
		simulation.alphaTarget(0.3).restart();
	};
};

onDragMove = ({ subjectId, active, x, y }) => {
	if (!active) {
		simulation.alphaTarget(0.3).restart();
	};

	if (!subjectId) {
		return;
	};

	const d = nodes.find((it) => { return it.id == subjectId; });
	if (d) {
		d.fx = transform.invertX(x) - d.radius / 2;
		d.fy = transform.invertY(y) - d.radius / 2;
		redraw();
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
	const active = nodes.find(d => d.isOver);
	if (active) {
		active.isOver = false;
	};

	const d = simulation.find(transform.invertX(x), transform.invertY(y), 10);
	if (d) {
		d.isOver = true;
	};

	redraw();
	this.postMessage({ id: 'onMouseMove', node: d, x: x, y: y });
};

resize = (data) => {
	width = data.width;
	height = data.height;
	density = data.density;

	ctx.canvas.width = width * density;
	ctx.canvas.height = height * density;
	ctx.scale(density, density);
	ctx.font = '3px Helvetica';
};

onResize = (data) => {
	resize(data);
	redraw();
};