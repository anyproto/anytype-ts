class Util {

	ctx = null;

	objectCopy (o) {
		return JSON.parse(JSON.stringify(o));
	};

	roundedRect (x, y, width, height, radius) {
		this.ctx.beginPath();
		this.ctx.moveTo(x + radius, y);
		this.ctx.lineTo(x + width - radius, y);
		this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
		this.ctx.lineTo(x + width, y + height - radius);
		this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
		this.ctx.lineTo(x + radius, y + height);
		this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
		this.ctx.lineTo(x, y + radius);
		this.ctx.quadraticCurveTo(x, y, x + radius, y);
		this.ctx.closePath();
	};

	rect (x, y, width, height) {
		this.ctx.beginPath();
		this.ctx.moveTo(x, y);
		this.ctx.lineTo(x + width, y);
		this.ctx.lineTo(x + width, y + height);
		this.ctx.lineTo(x, y + height);
		this.ctx.lineTo(x, y);
		this.ctx.closePath();
	};

	circle (x, y, radius) {
		this.ctx.beginPath();
		this.ctx.arc(x, y, radius, 0, 2 * Math.PI, true);
		this.ctx.closePath();
	};

	line (x1, y1, x2, y2, width, color) {
		this.ctx.save();

		this.ctx.beginPath();
		this.ctx.moveTo(x1, y1);
		this.ctx.lineTo(x2, y2);
		this.ctx.closePath();

		this.ctx.lineWidth = width;
		this.ctx.strokeStyle = color;
		this.ctx.stroke();
		this.ctx.restore();
	};

	textMetrics (text) {
		const metrics = this.ctx.measureText(text);

		return { 
			top: -metrics.actualBoundingBoxAscent, 
			bottom: metrics.actualBoundingBoxDescent, 
			left: -metrics.actualBoundingBoxLeft, 
			right: metrics.actualBoundingBoxRight,
		};
	};

	arrowHead (x, y, angle, width, height, color) {
		const halfWidth = width / 2;

		this.ctx.save();
		this.ctx.translate(x, y);
		this.ctx.rotate(angle);

		this.ctx.beginPath();
		this.ctx.moveTo(0, 0);
		this.ctx.lineTo(height, -halfWidth);
		this.ctx.lineTo(height, halfWidth);
		this.ctx.lineTo(0, 0);
		this.ctx.closePath();
		
		this.ctx.fillStyle = color;
		this.ctx.fill();
		this.ctx.restore();
	};

	arrayUnique (a) {
		return [ ...new Set(a) ];
	};

};