const BORDER = 20;
const MAX_STEP = 10;
const SPEED_DIV = 100; // bigger → slower overall

interface Param {
	speed?: number;
	step?: number;
	isWindow?: boolean; 
	container?: JQuery;
	onMouseUp?: () => void;
};

class ScrollOnMove {
	viewportWidth = 0;
	viewportHeight = 0;
	documentWidth = 0;
	documentHeight = 0;
	param: any = {};

	x = 0;
	y = 0;
	timeoutScroll = 0;
	timeoutUp = 0;
	isScrolling = false;
	ox = 0;
	oy = 0;
	
	onMouseDown (param: Param) {
		this.param = param || {};

		const { isWindow, container } = this.param;
		if (!isWindow) {
			if (!container || !container.length) {
				return;
			};

			const el = container.get(0);
			const rect = el.getBoundingClientRect();

			this.viewportWidth = rect.width;
			this.viewportHeight = rect.height;
			this.documentWidth = el.scrollWidth;
			this.documentHeight = el.scrollHeight;
			this.ox = rect.left;
			this.oy = rect.top;
		} else {
			const element = document.documentElement;
			const body = document.body;

			this.viewportWidth = element.clientWidth;
			this.viewportHeight = element.clientHeight;
			this.documentWidth = Math.max(body.scrollWidth, element.scrollWidth);
			this.documentHeight = Math.max(body.scrollHeight, element.scrollHeight);
			this.ox = 0;
			this.oy = 0;
		};

		this.isScrolling = true;
	};

	onMouseMove (x: number, y: number) {
		const { isWindow } = this.param;

		this.x = x;
		this.y = y;

		if (this.isScrolling) {
			this.loop();
		};

		// Hack to fix events not being triggered on mouseup
		if (isWindow) {
			window.clearTimeout(this.timeoutUp);
			this.timeoutUp = window.setTimeout(() => this.onMouseUp(), 300);
		};
	};

	private loop = () => {
		// If scrolling was cancelled externally — stop immediately
		if (!this.isScrolling) {
			this.clear();
			return;
		};

		const didScroll = this.adjustWindowScroll();

		if (didScroll) {
			this.timeoutScroll = window.setTimeout(this.loop, 50);
		} else {
			// Nothing to scroll (cursor left edges or we hit a limit) — stop the loop
			this.clear();
		};
	};

	private adjustWindowScroll(): boolean {
		const { isWindow, container } = this.param;
		const step = Number(this.param.step) || MAX_STEP;
		const speed = Number(this.param.speed) || SPEED_DIV;

		// Current pointer (client coordinates)
		const x = this.x;
		const y = this.y;

		// Edge thresholds in client coordinates
		const edgeTop = this.oy + BORDER;
		const edgeLeft = this.ox + BORDER;
		const edgeBottom = this.oy + this.viewportHeight - BORDER;
		const edgeRight = this.ox + this.viewportWidth - BORDER;

		// Is the pointer in one of the scroll zones?
		const inLeftEdge = (x >= this.ox) && x < edgeLeft;
		const inRightEdge = (x > edgeRight) && (x <= this.ox + this.viewportWidth);
		const inTopEdge = (y >= this.oy) && (y < edgeTop);
		const inBottomEdge = (y > edgeBottom) && (y <= this.oy + this.viewportHeight);

		// If we’re not in any edge, there’s nothing to do
		if (!(inLeftEdge || inRightEdge || inTopEdge || inBottomEdge)) {
			return false;
		};

		// Current scroll positions
		const curX = isWindow ? window.pageXOffset : container.scrollLeft();
		const curY = isWindow ? window.pageYOffset : container.scrollTop();

		// Max scroll offsets
		const maxX = Math.max(0, this.documentWidth - this.viewportWidth);
		const maxY = Math.max(0, this.documentHeight - this.viewportHeight);

		// Compute intended step based on proximity to the edge (closer → faster)
		const dx = inLeftEdge ? -Math.min(step, Math.ceil((edgeLeft - x) / speed))
				: inRightEdge ? Math.min(step, Math.ceil((x - edgeRight) / speed))
				: 0;

		const dy = inTopEdge ? -Math.min(step, Math.ceil((edgeTop - y) / speed))
				: inBottomEdge? Math.min(step, Math.ceil((y - edgeBottom) / speed))
				: 0;

		// Clamp to available range so we never “try” to scroll past the limits
		const nextX = Math.max(0, Math.min(maxX, curX + dx));
		const nextY = Math.max(0, Math.min(maxY, curY + dy));

		// If clamped values don’t change anything, abort (prevents infinite loop)
		if (nextX === curX && nextY === curY) {
			return false;
		};

		// Do the scroll
		if (isWindow) {
			window.scrollTo(nextX, nextY);
		} else {
			container.scrollLeft(nextX);
			container.scrollTop(nextY);
		};

		return true;
	};

	onMouseUp (noCallback?: boolean) {
		this.x = 0;
		this.y = 0;
		this.isScrolling = false;
		this.clear();

		if (this.param.onMouseUp && !noCallback) {
			this.param.onMouseUp();
		};
	};

	clear() {
		window.clearTimeout(this.timeoutScroll);
	};

};

export const scrollOnMove: ScrollOnMove = new ScrollOnMove();