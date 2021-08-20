let ctx = null;
let width = 0;
let height = 0;
let density = 0;
let transform = null;
let nodes = [];
let edges = [];
let forceProps = {};
let images = {};

addEventListener('message', ({ data }) => {
	switch (data.id) {
		case 'init':
			ctx = data.canvas.getContext('2d');
			width = data.width;
			height = data.height;
			density = data.density;
			transform = data.transform;

			ctx.canvas.width = width * density;
			ctx.canvas.height = height * density;
			ctx.scale(density, density);

			draw();
			break;

		case 'draw':
			nodes = data.nodes || [];
			edges = data.edges || [];
			transform = data.transform;
			break;

		case 'image':
			if (!images[data.src]) {
				images[data.src] = data.bitmap;
			};
			break;

		case 'forceProps':
			forceProps = data.forceProps;
			break;
	};
});

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

	requestAnimationFrame(() => { draw(); });
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
	ctx.beginPath();
	ctx.arc(d.x, d.y, d.radius, 0, 2 * Math.PI, true);
	ctx.fillStyle = d.bg;
	ctx.fill();

	ctx.font = '3px Helvetica';
	ctx.fillStyle = '#929082';
	ctx.textAlign = 'center';
	ctx.fillText(shorten(d.name, 10), d.x, d.y + d.radius + 4);

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

shorten = (s, l) => {
	s = String(s || '');
	l = Number(l) || 16;
	if (s.length > l) {
		s = s.substr(0, l) + '...';
	};
	return s;
};