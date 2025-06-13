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
		const ctx = this.ctx;
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

	/**
	 * Draws a rectangle on the canvas context.
	 * @param {number} x - The x coordinate of the rectangle.
	 * @param {number} y - The y coordinate of the rectangle.
	 * @param {number} width - The width of the rectangle.
	 * @param {number} height - The height of the rectangle.
	 */
	rect (x, y, width, height) {
		const ctx = this.ctx;
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.lineTo(x + width, y);
		ctx.lineTo(x + width, y + height);
		ctx.lineTo(x, y + height);
		ctx.lineTo(x, y);
		ctx.closePath();
	};

	/**
	 * Draws a circle on the canvas context.
	 * @param {number} x - The x coordinate of the circle center.
	 * @param {number} y - The y coordinate of the circle center.
	 * @param {number} radius - The radius of the circle.
	 */
	circle (x, y, radius) {
		const ctx = this.ctx;
		ctx.beginPath();
		ctx.arc(x, y, radius, 0, 2 * Math.PI, true);
		ctx.closePath();
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

		const ctx = this.ctx;
		
		//ctx.save();
		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.closePath();
		ctx.lineWidth = width;
		ctx.strokeStyle = color;
		ctx.stroke();
		//ctx.restore();
	};

	/**
	 * Measures text metrics for a given string.
	 * @param {string} text - The text to measure.
	 * @returns {{top: number, bottom: number, left: number, right: number}} The bounding box metrics.
	 */
	textMetrics (text) {
		if (!text) {
			return;
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

		const ctx = this.ctx;
		const halfWidth = width / 2;

		ctx.save();
		ctx.translate(x, y);
		ctx.rotate(angle);
		ctx.beginPath();
		ctx.moveTo(0, 0);
		ctx.lineTo(height, -halfWidth);
		ctx.lineTo(height, halfWidth);
		ctx.lineTo(0, 0);
		ctx.closePath();
		ctx.fillStyle = color;
		ctx.fill();
		ctx.restore();
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