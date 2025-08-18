import raf from 'raf';

const BORDER = 100;
const MAX_STEP = 10;

class ScrollOnMove {
	viewportWidth = 0;
	viewportHeight = 0;
	documentWidth = 0;
	documentHeight = 0;
	param: any = {};

	x = 0;
	y = 0;
	frame = 0;
	isScrolling = false;
	
	onMouseDown(e: any, param: { isWindow?: boolean; container?: JQuery }) {
		this.param = param || {};
		const { isWindow, container } = this.param;

		if (!isWindow) {
			const content = container.find('> .content');
			this.viewportWidth = container.width();
			this.viewportHeight = container.height();
			this.documentWidth = content.width();
			this.documentHeight = content.height();
		} else {
			this.viewportWidth = document.documentElement.clientWidth;
			this.viewportHeight = document.documentElement.clientHeight;
			this.documentWidth = Math.max(
				document.body.scrollWidth,
				document.documentElement.scrollWidth
			);
			this.documentHeight = Math.max(
				document.body.scrollHeight,
				document.documentElement.scrollHeight
			);
		};

		this.isScrolling = true;
	};

	onMouseMove(x: number, y: number) {
		this.x = x;
		this.y = y;

		// only start loop if not already running
		if (!this.frame) {
			this.frame = raf(this.loop);
		};
	};

	private loop = () => {
		if (this.adjustWindowScroll()) {
			this.frame = raf(this.loop);
		} else {
			this.clear();
		};
	};

	private adjustWindowScroll(): boolean {
		if (!this.isScrolling) {
			return false;
		};

		const { isWindow, container } = this.param;
		const x = this.x;
		const y = this.y;

		const edgeTop = BORDER;
		const edgeLeft = BORDER;
		const edgeBottom = this.viewportHeight - BORDER;
		const edgeRight = this.viewportWidth - BORDER;

		const isInLeftEdge = x > 0 && x < edgeLeft;
		const isInRightEdge = x > edgeRight;
		const isInTopEdge = y > 0 && y < edgeTop;
		const isInBottomEdge = y > edgeBottom;

		const maxScrollX = this.documentWidth - this.viewportWidth;
		const maxScrollY = this.documentHeight - this.viewportHeight;

		const currentScrollX = isWindow ? window.pageXOffset : container.scrollLeft();
		const currentScrollY = isWindow ? window.pageYOffset : container.scrollTop();

		let nextScrollX = currentScrollX;
		let nextScrollY = currentScrollY;

		if (isInLeftEdge && currentScrollX > 0) {
			const intensity = (edgeLeft - x) / BORDER;
			nextScrollX -= MAX_STEP * intensity;
		} else if (isInRightEdge && currentScrollX < maxScrollX) {
			const intensity = (x - edgeRight) / BORDER;
			nextScrollX += MAX_STEP * intensity;
		};

		if (isInTopEdge && currentScrollY > 0) {
			const intensity = (edgeTop - y) / BORDER;
			nextScrollY -= MAX_STEP * intensity;
		} else if (isInBottomEdge && currentScrollY < maxScrollY) {
			const intensity = (y - edgeBottom) / BORDER;
			nextScrollY += MAX_STEP * intensity;
		};

		nextScrollX = Math.max(0, Math.min(maxScrollX, nextScrollX));
		nextScrollY = Math.max(0, Math.min(maxScrollY, nextScrollY));

		// disable X scrolling if you want vertical only:
		nextScrollX = currentScrollX;

		if (nextScrollX !== currentScrollX || nextScrollY !== currentScrollY) {
			if (isWindow) {
				window.scrollTo(nextScrollX, nextScrollY);
			} else {
				container.scrollLeft(nextScrollX);
				container.scrollTop(nextScrollY);
			};
			return true;
		};

		return false;
	};

	onMouseUp(e: any) {
		this.clear();
		this.isScrolling = false;
	};

	clear() {
		if (this.frame) {
			raf.cancel(this.frame);
			this.frame = 0;
		};
	};
}

export const scrollOnMove: ScrollOnMove = new ScrollOnMove();