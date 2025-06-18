/**
 * Utility class for common canvas and data operations used in graph rendering workers.
 */
class Util {

	ctx = null;
	cache = {
		text: {},
	};

	/**
	 * Deep copies an object using JSON serialization.
	 * @param {any} o - The object to copy.
	 * @returns {any} The deep-copied object.
	 */
	objectCopy (o) {
		return JSON.parse(JSON.stringify(o));
	};

	/**
	 * Draws a rounded rectangle on the canvas context.
	 * @param {number} x - The x coordinate of the rectangle.
	 * @param {number} y - The y coordinate of the rectangle.
	 * @param {number} width - The width of the rectangle.
	 * @param {number} height - The height of the rectangle.
	 * @param {number} radius - The border radius.
	 */
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

	/**
	 * Draws a rectangle on the canvas context.
	 * @param {number} x - The x coordinate of the rectangle.
	 * @param {number} y - The y coordinate of the rectangle.
	 * @param {number} width - The width of the rectangle.
	 * @param {number} height - The height of the rectangle.
	 */
	rect (x, y, width, height) {
		this.ctx.beginPath();
		this.ctx.moveTo(x, y);
		this.ctx.lineTo(x + width, y);
		this.ctx.lineTo(x + width, y + height);
		this.ctx.lineTo(x, y + height);
		this.ctx.lineTo(x, y);
		this.ctx.closePath();
	};

	/**
	 * Draws a circle on the canvas context.
	 * @param {number} x - The x coordinate of the circle center.
	 * @param {number} y - The y coordinate of the circle center.
	 * @param {number} radius - The radius of the circle.
	 */
	circle (x, y, radius) {
		this.ctx.beginPath();
		this.ctx.arc(x, y, radius, 0, 2 * Math.PI, true);
		this.ctx.closePath();
	};

	/**
	 * Draws a line on the canvas context.
	 * @param {number} x1 - The starting x coordinate.
	 * @param {number} y1 - The starting y coordinate.
	 * @param {number} x2 - The ending x coordinate.
	 * @param {number} y2 - The ending y coordinate.
	 * @param {number} width - The width of the line.
	 * @param {string} color - The color of the line.
	 */
	line (x1, y1, x2, y2, width, color) {
		if (!width) {
			return;
		};
		
		this.ctx.beginPath();
		this.ctx.moveTo(x1, y1);
		this.ctx.lineTo(x2, y2);
		this.ctx.closePath();
		this.ctx.lineWidth = width;
		this.ctx.strokeStyle = color;
		this.ctx.stroke();
	};

	/**
	 * Measures text metrics for a given string.
	 * @param {string} text - The text to measure.
	 * @returns {{top: number, bottom: number, left: number, right: number}} The bounding box metrics.
	 */
	textMetrics (text) {
		if (!text) {
			return { top: 0, bottom: 0, left: 0, right: 0 };
		};

		if (this.cache.text[text]) {
			return this.cache.text[text];
		};

		const metrics = this.ctx.measureText(text);
		const param = {
			top: -metrics.actualBoundingBoxAscent,
			bottom: metrics.actualBoundingBoxDescent,
			left: -metrics.actualBoundingBoxLeft,
			right: metrics.actualBoundingBoxRight,
		};

		this.cache.text[text] = param;

		return param;
	};

	/**
	 * Draws an arrow head at a given position and angle.
	 * @param {number} x - The x coordinate of the arrow tip.
	 * @param {number} y - The y coordinate of the arrow tip.
	 * @param {number} angle - The rotation angle in radians.
	 * @param {number} width - The width of the arrow head.
	 * @param {number} height - The height of the arrow head.
	 * @param {string} color - The fill color of the arrow head.
	 */
	arrowHead (x, y, angle, width, height, color) {
		if (!width || !height) {
			return;
		};

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

	/**
	 * Returns a new array with only unique values from the input array.
	 * @param {any[]} a - The array to deduplicate.
	 * @returns {any[]} The array with unique values.
	 */
	arrayUnique (a) {
		return a.length >= 2 ? [ ...new Set(a) ] : a;
	};

	/**
	 * Clears cache for given key
	 * @param {string} key - The key
	 */
	clearCache (key) {
		this.cache[key] = {};
	};

};