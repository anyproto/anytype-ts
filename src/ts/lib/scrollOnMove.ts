const BORDER = 100;
const MAX_STEP = 10;
const SPEED_DIV = 30; // bigger → slower overall

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
	
	onMouseDown (param: { isWindow?: boolean; container?: JQuery, onMouseUp?: () => void }) {
		this.param = param || {};

		const { isWindow, container } = this.param;
		if (!isWindow) {
			const el = container.get(0);

			this.viewportWidth = container.width();
			this.viewportHeight = container.height();
			this.documentWidth = el.scrollWidth;
			this.documentHeight = el.scrollHeight;
		} else {
			const element = document.documentElement;
			const body = document.body;

			this.viewportWidth = element.clientWidth;
			this.viewportHeight = element.clientHeight;
			this.documentWidth = Math.max(body.scrollWidth, element.scrollWidth);
			this.documentHeight = Math.max(body.scrollHeight, element.scrollHeight);
		};

		this.isScrolling = true;
	};

	onMouseMove (x: number, y: number) {
		const { isWindow } = this.param;

		this.x = x;
		this.y = y;

		if (this.isScrolling) {
			this.timeoutScroll = window.setTimeout(this.loop, 50);
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

		// Current pointer
		const x = this.x;
		const y = this.y;

		// Edge thresholds inside the viewport
		const edgeTop = BORDER;
		const edgeLeft = BORDER;
		const edgeBottom = this.viewportHeight - BORDER;
		const edgeRight = this.viewportWidth - BORDER;

		// Is the pointer in one of the scroll zones?
		const inLeftEdge = x > 0 && x < edgeLeft;
		const inRightEdge = x > edgeRight && x < this.viewportWidth;
		const inTopEdge = y > 0 && y < edgeTop;
		const inBottomEdge = y > edgeBottom && y < this.viewportHeight;

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
		const dx = inLeftEdge ? -Math.min(MAX_STEP, Math.ceil((edgeLeft - x) / SPEED_DIV))
				: inRightEdge ? Math.min(MAX_STEP, Math.ceil((x - edgeRight) / SPEED_DIV))
				: 0;

		const dy = inTopEdge ? -Math.min(MAX_STEP, Math.ceil((edgeTop - y) / SPEED_DIV))
				: inBottomEdge? Math.min(MAX_STEP, Math.ceil((y - edgeBottom) / SPEED_DIV))
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