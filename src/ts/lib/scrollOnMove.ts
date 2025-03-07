import $ from 'jquery';
import raf from 'raf';

const BORDER = 100;

class ScrollOnMove {
	
	timeout = 0;
	viewportWidth = 0;
	viewportHeight = 0;
	documentWidth = 0;
	documentHeight = 0;
	isPopup = false;
	frame = 0;

	onMouseDown (e: any, isPopup: boolean) {
		this.isPopup = isPopup;

		if (isPopup) {
			const container = $('#popupPage-innerWrap');
			const content = container.find('.content');

			this.viewportWidth = container.width();
			this.viewportHeight = container.height();
			this.documentWidth = content.width();
			this.documentHeight = content.height();
		} else {
			this.viewportWidth = document.documentElement.clientWidth;
			this.viewportHeight = document.documentElement.clientHeight;

			this.documentWidth = Math.max(
				document.body.scrollWidth,
				document.body.offsetWidth,
				document.body.clientWidth,
				document.documentElement.scrollWidth,
				document.documentElement.offsetWidth,
				document.documentElement.clientWidth
			);
			
			this.documentHeight = Math.max(
				document.body.scrollHeight,
				document.body.offsetHeight,
				document.body.clientHeight,
				document.documentElement.scrollHeight,
				document.documentElement.offsetHeight,
				document.documentElement.clientHeight
			);
		};
	};

	checkForWindowScroll (param: any) {
		this.clear();
		this.frame = raf(() => {
			if (this.adjustWindowScroll(param)) {
				this.checkForWindowScroll(param);
			};
		});
	};

	adjustWindowScroll (param: any) {
		const { 
			viewportX, viewportY,
			isInLeftEdge, isInRightEdge, isInTopEdge, isInBottomEdge, 
			edgeLeft, edgeRight, edgeTop, edgeBottom, 
		} = param;

		const maxScrollX = this.documentWidth - this.viewportWidth; 
		const maxScrollY = this.documentHeight - this.viewportHeight;

		let currentScrollX = 0;
		let currentScrollY = 0;
		let container;

		if (this.isPopup) {
			container = $('#popupPage-innerWrap');
			currentScrollX = container.scrollLeft();
			currentScrollY = container.scrollTop();
			container = container.get(0);
		} else {
			container = window;
			currentScrollX = window.pageXOffset;
			currentScrollY = window.pageYOffset;
		};

		const canScrollUp = (currentScrollY > 0);
		const canScrollDown = (currentScrollY < maxScrollY);
		const canScrollLeft = (currentScrollX > 0);
		const canScrollRight = (currentScrollX < maxScrollX);
		const maxStep = 10;

		let nextScrollX = currentScrollX;
		let nextScrollY = currentScrollY;
		let intensity = 0;

		if (isInLeftEdge && canScrollLeft) {
			intensity = (edgeLeft - viewportX) / BORDER;
			nextScrollX = nextScrollX - maxStep * intensity;
		} else 
		if (isInRightEdge && canScrollRight) {
			intensity = (viewportX - edgeRight) / BORDER;
			nextScrollX = nextScrollX + maxStep * intensity;
		};

		if (isInTopEdge && canScrollUp) {
			intensity = (edgeTop - viewportY) / BORDER;
			nextScrollY = nextScrollY - maxStep * intensity;
		} else 
		if (isInBottomEdge && canScrollDown) {
			intensity = (viewportY - edgeBottom) / BORDER;
			nextScrollY = nextScrollY + maxStep * intensity;
		};

		nextScrollX = Math.max(0, Math.min(maxScrollX, nextScrollX));
		nextScrollY = Math.max(0, Math.min(maxScrollY, nextScrollY));

		// Disable move on X
		nextScrollX = currentScrollX;

		if (
			(nextScrollX !== currentScrollX) ||
			(nextScrollY !== currentScrollY)
		) {
			if (container) {
				container.scrollTo(nextScrollX, nextScrollY);
			};
			return true;
		} else {
			return false;
		};
	};
	
	onMouseMove (x: number, y: number) {
		const edgeTop = BORDER;
		const edgeLeft = BORDER;
		const edgeBottom = this.viewportHeight - BORDER;
		const edgeRight = this.viewportWidth - BORDER;

		const isInLeftEdge = (x > 0) && (x < edgeLeft);
		const isInRightEdge = x > edgeRight;
		const isInTopEdge = (y > 0) && (y < edgeTop);
		const isInBottomEdge = y > edgeBottom;

		if (!(isInLeftEdge || isInRightEdge || isInTopEdge || isInBottomEdge)) {
			this.clear();
			return;
		};
	
		this.checkForWindowScroll({
			viewportX:		 x, 
			viewportY:		 y,
			isInLeftEdge:	 isInLeftEdge, 
			isInRightEdge:	 isInRightEdge, 
			isInTopEdge:	 isInTopEdge, 
			isInBottomEdge:	 isInBottomEdge, 
			edgeLeft:		 edgeLeft, 
			edgeRight:		 edgeRight, 
			edgeTop:		 edgeTop, 
			edgeBottom:		 edgeBottom, 
		});
	};
	
	onMouseUp (e: any) {
		this.clear();
	};

	clear () {
		if (this.frame) {
			raf.cancel(this.frame);
		};
	};
	
};

 export const scrollOnMove: ScrollOnMove = new ScrollOnMove();