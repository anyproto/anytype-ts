import { useEffect } from 'react';
import $ from 'jquery';

interface Position {
	x: number;
	y: number;
	width: number;
	height: number;
}

class ElementMovementObserver {

	private movementObserver: MutationObserver;
	private resizeObserver: ResizeObserver;
	private element: HTMLElement;
	private onMove: (position: Position) => void;

	constructor (element: HTMLElement, callback: (position: Position) => void) {
		this.element = element;
		this.onMove = callback;

		this.movementObserver = new MutationObserver(() => this.checkForMovement());
		this.resizeObserver = new ResizeObserver(() => this.checkForMovement());
		this.startObserving();
	};

	private checkForMovement = () => {

		this.onMove(this.getPosition());
	};

	private getPosition (): Position {
		const rect = this.element.getBoundingClientRect();
	
		return {
			x: rect.left + window.scrollX,
			y: rect.top + window.scrollY,
			width: rect.width,
			height: rect.height
		};
	};

	private startObserving (): void {
		const config: MutationObserverInit = {
			attributes: true,
			childList: true,
			subtree: true,
			characterData: true
		};

		// Observe the element and its descendants for movement
		this.movementObserver.observe(this.element, config);

		// Observe the document body for layout changes
		this.movementObserver.observe(document.body, config);

		// Observe the element for size changes
		this.resizeObserver.observe(this.element);

		// And handle scroll
		$(window).off('scroll.elementMovement').on('scroll.elementMovement', this.checkForMovement);
	};

	public disconnect (): void {
		this.movementObserver.disconnect();
		this.resizeObserver.disconnect();

		$(window).off('scroll.elementMovement')
	};
};

export default function useElementMovement (element: HTMLElement | null, callBack: (position: Position) => void ) {
	useEffect(() => {
		if (!element) {
			return;
		};

		const movementObserver = new ElementMovementObserver(element, callBack);

		return () => movementObserver.disconnect();
	}, [ element, callBack ]);
};