import React, { FC, useRef, ReactNode, Children, cloneElement } from 'react';

interface Props {
	children?: ReactNode;
	onDragEnd(oldIndex: number, newIndex: number): void;
};

const DragBox: FC<Props> = ({ children: initialChildren, onDragEnd }) => {

	const nodeRef = useRef(null);
	const cache = useRef({});
	const ox = useRef(0);
	const oy = useRef(0);
	const oldIndex = useRef(-1);
	const newIndex = useRef(-1);

	const mouseMoveHandler = useRef<((e: any) => void) | null>(null);
	const mouseUpHandler = useRef<((e: any) => void) | null>(null);

	const onDragStart = (e: any) => {
		e.preventDefault();
		e.stopPropagation();

		const node = nodeRef.current;
		if (!node) {
			return;
		};

		const items = U.Dom.selectAll('.isDraggable', node) as HTMLElement[];
		const element = e.currentTarget as HTMLElement;
		const clone = element.cloneNode(true) as HTMLElement;
		const rect = node.getBoundingClientRect();

		items.forEach((item) => {
			const id = item.dataset.id;
			if (!id || U.Dom.hasClass(item, 'isClone')) {
				return;
			};

			cache.current[id] = {
				x: item.offsetLeft,
				y: item.offsetTop,
				width: item.offsetWidth,
				height: item.offsetHeight,
			};
		});

		ox.current = rect.left + window.scrollX;
		oy.current = rect.top + window.scrollY;
		oldIndex.current = Number(element.dataset.index);

		node.appendChild(clone);
		U.Dom.addClass(clone, 'isClone');
		U.Dom.addClass(element, 'isDragging');

		if (mouseMoveHandler.current) {
			U.Dom.removeEvent(window, 'mousemove', mouseMoveHandler.current);
		};
		if (mouseUpHandler.current) {
			U.Dom.removeEvent(window, 'mouseup', mouseUpHandler.current);
		};

		mouseMoveHandler.current = e => onDragMove(e);
		mouseUpHandler.current = e => onDragEndHandler(e);
		U.Dom.addEvents(window, [
			['mousemove', mouseMoveHandler.current],
			['mouseup', mouseUpHandler.current],
		]);
	};

	const onDragMove = (e: any) => {
		const node = nodeRef.current;
		if (!node) {
			return;
		};

		const items = U.Dom.selectAll('.isDraggable', node) as HTMLElement[];
		const clone = U.Dom.select('.isDraggable.isClone', node) as HTMLElement;
		if (!clone) {
			return;
		};

		const width = clone.offsetWidth;
		const height = clone.offsetHeight;
		const x = e.pageX - ox.current - width / 2;
		const y = e.pageY - oy.current - height / 2;
		const center = x + width / 2;

		newIndex.current = -1;

		U.Dom.selectAll('.isDraggable.isOver', node).forEach(el => {
			U.Dom.removeClass(el, 'isOver');
			U.Dom.removeClass(el, 'left');
			U.Dom.removeClass(el, 'right');
		});
		U.Dom.css(clone, { transform: `translate3d(${x}px,${y}px,0px)` });

		for (let i = 0; i < items.length; ++i) {
			const el = items[i];
			const rect = cache.current[el.dataset.id];

			if (rect && U.Common.rectsCollide({ x: center, y, width: 2, height }, rect)) {
				const isLeft = center <= rect.x + rect.width / 2;
				newIndex.current = i;
				U.Dom.addClass(el, 'isOver');
				U.Dom.addClass(el, isLeft ? 'left' : 'right');
				break;
			};
		};
	};

	const onDragEndHandler = (e: any) => {
		const node = nodeRef.current;
		if (!node) {
			return;
		};

		U.Dom.select('.isDraggable.isClone', node)?.remove();
		U.Dom.selectAll('.isDraggable.isDragging', node).forEach(el => U.Dom.removeClass(el, 'isDragging'));
		U.Dom.selectAll('.isDraggable.isOver', node).forEach(el => {
			U.Dom.removeClass(el, 'isOver');
			U.Dom.removeClass(el, 'left');
			U.Dom.removeClass(el, 'right');
		});

		if (mouseMoveHandler.current) {
			U.Dom.removeEvent(window, 'mousemove', mouseMoveHandler.current);
			mouseMoveHandler.current = null;
		};
		if (mouseUpHandler.current) {
			U.Dom.removeEvent(window, 'mouseup', mouseUpHandler.current);
			mouseUpHandler.current = null;
		};

		if (newIndex.current >= 0) {
			onDragEnd(oldIndex.current, newIndex.current);
		};

		cache.current = {};
		oldIndex.current = -1;
		newIndex.current = -1;
	};

	const children = Children.map(initialChildren, (child: any) => cloneElement(child, { onDragStart }));

	return (
		<span 
			ref={nodeRef}
			className="dragbox"
		>
			{children}
		</span>
	);
};

export default DragBox;