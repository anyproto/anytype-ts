const raf = require('raf');

const BORDER = 100;
const THROTTLE = 30;

class ScrollOnMove {
	
	timeout: number = 0;
	viewportWidth: number = 0;
	viewportHeight: number = 0;
	documentWidth: number = 0;
	documentHeight: number = 0;
	
	onMouseDown (e: any) {
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

	checkForWindowScroll (param: any) {
		window.clearTimeout(this.timeout);

		if (this.adjustWindowScroll(param)) {
			this.timeout = window.setTimeout(() => { 
				this.checkForWindowScroll(param); 
			}, THROTTLE);
		};
	};

	adjustWindowScroll (param: any) {
		let { 
			viewportX, viewportY,
			isInLeftEdge, isInRightEdge, isInTopEdge, isInBottomEdge, 
			edgeLeft, edgeRight, edgeTop, edgeBottom, 
		} = param;

		let maxScrollX = this.documentWidth - this.viewportWidth; 
		let maxScrollY = this.documentHeight - this.viewportHeight;
		let currentScrollX = window.pageXOffset;
		let currentScrollY = window.pageYOffset;
		let canScrollUp = (currentScrollY > 0);
		let canScrollDown = (currentScrollY < maxScrollY);
		let canScrollLeft = (currentScrollX > 0 );
		let canScrollRight = (currentScrollX < maxScrollX);
		let nextScrollX = currentScrollX;
		let nextScrollY = currentScrollY;
		let maxStep = 10;
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
			raf(() => {
				window.scrollTo(nextScrollX, nextScrollY);
			});
			return true;
		} else {
			return false;
		};
	};
	
	onMouseMove (e: any) {
		let viewportX = e.clientX;
		let viewportY = e.clientY;
	
		let edgeTop = BORDER;
		let edgeLeft = BORDER;
		let edgeBottom = this.viewportHeight - BORDER;
		let edgeRight = this.viewportWidth - BORDER;
	
		let isInLeftEdge = (viewportX < edgeLeft);
		let isInRightEdge = (viewportX > edgeRight);
		let isInTopEdge = (viewportY < edgeTop );
		let isInBottomEdge = (viewportY > edgeBottom);
	
		if (!(isInLeftEdge || isInRightEdge || isInTopEdge || isInBottomEdge)) {
			window.clearTimeout(this.timeout);
			return;
		};
	
		this.checkForWindowScroll({
			viewportX:		 viewportX, 
			viewportY:		 viewportY,
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
		window.clearTimeout(this.timeout);
	};
	
};

export let scrollOnMove: ScrollOnMove = new ScrollOnMove();