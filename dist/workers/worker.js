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
let Color = {
	link: {
		0: '#f3f2ec',
		1: '#2aa7ee',
	},
	node: {
		common: '#f3f2ec',
		filter: '#e3f7d0',
		focused: '#fef3c5',
	},
};

addEventListener('message', ({ data }) => { 
	if (this[data.id]) {
		this[data.id](data); 
	};
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
	draw();
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

	edges.forEach(d => drawBend(d, 0.1, 3, 2, false, forceProps.markers));
	nodes.forEach(d => {
		if (!forceProps.orphans && d.isOrphan && !d.isRoot) {
			return;
		};

		drawNode(d);
	});
	ctx.restore();
};

drawBend = (d, bend, aLen, aWidth, sArrow, eArrow) => {
	let x1 = d.source.x;
	let y1 = d.source.y;
	let x2 = d.target.x;
	let y2 = d.target.y;
	let startRadius = d.source.radius;
	let endRadius = d.target.radius;
    let mx, my, dist, nx, ny, x3, y3, cx, cy, radius, a1, a2;
    let arrowAng, aa1, aa2, b1;
	let bg = Color.link[d.type] || Color.link[0];

    // find mid point
    mx = (x1 + x2) / 2;  
    my = (y1 + y2) / 2;

    // get vector from start to end
    nx = x2 - x1;
    ny = y2 - y1;
    
    // find dist
    dist = Math.sqrt(nx * nx + ny * ny);
    
    // normalise vector
    nx /= dist;
    ny /= dist;
    
    // The next section has some optional behaviours
    // that set the dist from the line mid point to the arc mid point
    // You should only use one of the following sets
    
    //-- Uncomment for behaviour of arcs
    // This make the lines flatten at distance
    //b1 =  (bend * 300) / Math.pow(dist,1/4);

    //-- Uncomment for behaviour of arcs
    // Arc bending amount close to constant
    // b1 =  bend * dist * 0.5

    b1 = bend * dist;

    // Arc amount bend more at dist
    x3 = mx + ny * b1;
    y3 = my - nx * b1;
   
    // get the radius
    radius = (0.5 * ((x1-x3) * (x1-x3) + (y1-y3) * (y1-y3)) / (b1));

    // use radius to get arc center
    cx = x3 - ny * radius;
    cy = y3 + nx * radius;

    // radius needs to be positive for the rest of the code
    radius = Math.abs(radius);

    // find angle from center to start and end
    a1 = Math.atan2(y1 - cy, x1 - cx);
    a2 = Math.atan2(y2 - cy, x2 - cx);
    
    // normalise angles
    a1 = (a1 + Math.PI * 2) % (Math.PI * 2);
    a2 = (a2 + Math.PI * 2) % (Math.PI * 2);

    // ensure angles are in correct directions
    if (bend < 0) {
        if (a1 < a2) { 
			a1 += Math.PI * 2;
		};
    } else {
        if (a2 < a1) { 
			a2 += Math.PI * 2;
		};
    };
    
    // convert arrow length to angular len
    arrowAng = aLen / radius  * Math.sign(bend);
    // get angular length of start and end circles and move arc start and ends
    
    a1 += startRadius / radius * Math.sign(bend);
    a2 -= endRadius / radius * Math.sign(bend);
    aa1 = a1;
    aa2 = a2;
   
    // check for too close and no room for arc
    if ((bend < 0 && a1 < a2) || (bend > 0 && a2 < a1)) {
        return;
    };

    // is there a start arrow
    if (sArrow) { aa1 += arrowAng } // move arc start to inside arrow
    // is there an end arrow
    if (eArrow) { aa2 -= arrowAng } // move arc end to inside arrow
    
    // check for too close and remove arrows if so
    if ((bend < 0 && aa1 < aa2) || (bend > 0 && aa2 < aa1)) {
        sArrow = false;
        eArrow = false;
        aa1 = a1;
        aa2 = a2;
    }

    // draw arc
    ctx.beginPath();
    ctx.arc(cx, cy, radius, aa1, aa2, bend < 0);
	ctx.lineWidth = 0.5;
	ctx.strokeStyle = bg;
    ctx.stroke();

    ctx.beginPath();

    // draw start arrow if needed
    if (sArrow){
        ctx.moveTo(
            Math.cos(a1) * radius + cx,
            Math.sin(a1) * radius + cy
        );
        ctx.lineTo(
            Math.cos(aa1) * (radius + aWidth / 2) + cx,
            Math.sin(aa1) * (radius + aWidth / 2) + cy
        );
        ctx.lineTo(
            Math.cos(aa1) * (radius - aWidth / 2) + cx,
            Math.sin(aa1) * (radius - aWidth / 2) + cy
        );
        ctx.closePath();
    };
    
    // draw end arrow if needed
    if (eArrow){
        ctx.moveTo(
            Math.cos(a2) * radius + cx,
            Math.sin(a2) * radius + cy
        );
        ctx.lineTo(
            Math.cos(aa2) * (radius - aWidth / 2) + cx,
            Math.sin(aa2) * (radius - aWidth / 2) + cy
        );
        ctx.lineTo(
            Math.cos(aa2) * (radius + aWidth / 2) + cx,
            Math.sin(aa2) * (radius + aWidth / 2) + cy
        );
        ctx.closePath();
    };

	ctx.lineWidth = 0.5;
	ctx.fillStyle = bg;
    ctx.fill();

	// draw name
	if (d.name && forceProps.labels) {
		let angle = 0;
		let dy = 0;

		if ((y1 > y2) && (x1 > x2)) {
			angle = Math.atan2(y1 - y2, x1 - x2);
			dy = b1;
		} else {
			angle = Math.atan2(y2 - y1, x2 - x1);
			dy = -b1;
		};

		ctx.save();
		ctx.translate(mx, my);
		ctx.rotate(angle);

		ctx.font = '3px Helvetica';
		ctx.fillStyle = bg;
		ctx.textAlign = 'center';
		ctx.fillText(d.name, 0, dy - 1.5);

		ctx.restore();
	};
};

drawNode = (d) => {
	let bg = Color.node.common;
	let color = '#929082';
	let stroke = '#fff';
	let width = 0;

	if (forceProps.filter && d.name.match(forceProps.filter)) {
		bg = Color.node.filter;
		color = '#000';
		stroke = '#000';
		width = 0.5;
	};

	if (d.isRoot) {
		bg = Color.node.focused;
		color = '#000';
		width = 0;
	};

	ctx.beginPath();
	ctx.arc(d.x, d.y, d.radius, 0, 2 * Math.PI, true);
	ctx.fillStyle = bg;
	ctx.strokeStyle = stroke;
	ctx.strokeWidth = width;
	ctx.stroke();
	ctx.fill();

	if (forceProps.labels) {
		ctx.font = '3px Helvetica';
		ctx.fillStyle = color;
		ctx.textAlign = 'center';
		ctx.fillText(d.shortName, d.x, d.y + d.radius + 4);
	};

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

resize = (data) => {
	width = data.width;
	height = data.height;
	canvas.width = width;
	canvas.height = height;

	draw();
};