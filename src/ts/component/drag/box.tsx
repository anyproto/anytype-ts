import React, { FC, useRef } from 'react';
import { U } from 'Lib';

interface Props {
	children?: React.ReactNode;
	onDragEnd(oldIndex: number, newIndex: number): void;
};

const DragBox: FC<Props> = ({ children: initialChildren, onDragEnd }) => {

	const nodeRef = useRef(null);
	const cache = useRef({});
	const ox = useRef(0);
	const oy = useRef(0);
	const oldIndex = useRef(-1);
	const newIndex = useRef(-1);

	const onDragStart = (e: any) => {
		e.preventDefault();
		e.stopPropagation();

		if (!nodeRef.current) {
			return;
		};

		const win = $(window);
		const node = $(nodeRef.current);
		const items = node.find('.isDraggable');
		const element = $(e.currentTarget);
		const clone = element.clone();
		const { left, top } = node.offset();

		items.each((i: number, item: any) => {
			item = $(item);

			const id = item.data('id');
			if (!id || item.hasClass('isClone')) {
				return;
			};

			const p = item.position();
			cache.current[id] = {
				x: p.left,
				y: p.top,
				width: item.outerWidth(),
				height: item.outerHeight(),
			};
		});

		ox.current = left;
		oy.current = top;
		oldIndex.current = element.data('index');

		node.append(clone);
		clone.addClass('isClone');
		element.addClass('isDragging');

		win.off('mousemove.dragbox mouseup.dragbox');
		win.on('mousemove.dragbox', e => onDragMove(e));
		win.on('mouseup.dragbox', e => onDragEndHandler(e));
	};

	const onDragMove = (e: any) => {
		if (!nodeRef.current) {
			return;
		};

		const node = $(nodeRef.current);
		const items = node.find('.isDraggable');
		const clone = node.find('.isDraggable.isClone');
		const width = clone.outerWidth();
		const height = clone.outerHeight();
		const x = e.pageX - ox.current - width / 2;
		const y = e.pageY - oy.current - height / 2;
		const center = x + width / 2;

		newIndex.current = -1;

		node.find('.isDraggable.isOver').removeClass('isOver left right');
		clone.css({ transform: `translate3d(${x}px,${y}px,0px)` });

		for (let i = 0; i < items.length; ++i) {
			const el = $(items.get(i));
			const rect = cache.current[el.data('id')];

			if (rect && U.Common.rectsCollide({ x: center, y, width: 2, height }, rect)) {
				const isLeft = center <= rect.x + rect.width / 2;
				newIndex.current = i;
				el.addClass('isOver ' + (isLeft ? 'left' : 'right'));
				break;
			};
		};
	};

	const onDragEndHandler = (e: any) => {
		if (!nodeRef.current) {
			return;
		};

		const node = $(nodeRef.current);

		node.find('.isDraggable.isClone').remove();
		node.find('.isDraggable.isDragging').removeClass('isDragging');
		node.find('.isDraggable.isOver').removeClass('isOver left right');

		$(window).off('mousemove.dragbox mouseup.dragbox');

		if (newIndex.current >= 0) {
			onDragEnd(oldIndex.current, newIndex.current);
		};

		cache.current = {};
		oldIndex.current = -1;
		newIndex.current = -1;
	};

	const children = React.Children.map(initialChildren, (child: any) => React.cloneElement(child, { onDragStart }));

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