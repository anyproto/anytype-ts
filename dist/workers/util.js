class Util {

	roundedRect (ctx, x, y, width, height, radius) {
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

	rect (ctx, x, y, width, height) {
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.lineTo(x + width, y);
		ctx.lineTo(x + width, y + height);
		ctx.lineTo(x, y + height);
		ctx.lineTo(x, y);
		ctx.closePath();
	};

	arrowHead (ctx, width, height) {
		ctx.beginPath();
		ctx.moveTo(0, 0);
		ctx.lineTo(height, -width / 2);
		ctx.lineTo(height, width / 2);
		ctx.lineTo(0, 0);
		ctx.fill();
		ctx.closePath();
	};

	line (x1, y1, x2, y2) {
		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.closePath();
	};

};