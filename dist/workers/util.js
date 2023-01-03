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

	circle (ctx, x, y, radius) {
		ctx.beginPath();
		ctx.arc(x, y, radius, 0, 2 * Math.PI, true);
		ctx.closePath();
	};

	line (ctx, x1, y1, x2, y2) {
		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.closePath();
	};

	textMetrics (ctx, text) {
		const metrics = ctx.measureText(text);

		return { 
			top: -metrics.actualBoundingBoxAscent, 
			bottom: metrics.actualBoundingBoxDescent, 
			left: -metrics.actualBoundingBoxLeft, 
			right: metrics.actualBoundingBoxRight,
		};
	};

	arrowHead (x, y, angle, width, height, color) {
		ctx.save();
		ctx.translate(x, y);
		ctx.rotate(angle);

		ctx.beginPath();
		ctx.moveTo(0, 0);
		ctx.lineTo(height, -width / 2);
		ctx.lineTo(height, width / 2);
		ctx.lineTo(0, 0);
		ctx.closePath();
		
		ctx.fillStyle = color;
		ctx.fill();
		ctx.restore();
	};

};