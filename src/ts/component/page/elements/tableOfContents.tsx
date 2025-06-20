import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { I, S, U, J } from 'Lib';

interface TableOfContentsRefProps {
	setBlock: (v: string) => void;
};

const TableOfContents = observer(forwardRef<TableOfContentsRefProps, I.BlockComponent>((props, ref) => {

	const { rootId, isPopup } = props;
	const nodeRef = useRef(null);
	const tree = S.Block.getTableOfContents(rootId);

	const rebind = () => {
		unbind();
		$(window).on('resize.tableOfContents', () => resize());
	};

	const unbind = () => {
		$(window).off('resize.tableOfContents');
	};

	const setBlock = (id: string) => {
		const node = $(nodeRef.current);

		node.find('.item.active').removeClass('active');
		if (id) {
			node.find(`#item-${id}`).addClass('active');
		};
	};

	const onClick = () => {
		const node = $(nodeRef.current);

		S.Menu.open('tableOfContents', {
			className: 'fixed',
			element: node,
			horizontal: I.MenuDirection.Right,
			vertical: I.MenuDirection.Center,
			offsetX: node.width() + 4,
			noFlipX: true,
			noFlipY: true,
			data: {
				rootId,
				isPopup,
			}
		});
	};

	const resize = () => {
		raf(() => {
			const node = $(nodeRef.current);
			if (!node.length) {
				return;
			};

			const container = U.Common.getScrollContainer(isPopup);
			const width = container.width();
			const o = isPopup && container.length ? container.offset().left : 0;

			node.css({ left: o + width - node.width() - 22 });
		});
	};

	useEffect(() => {
		rebind();
		resize();

		if (isPopup) {
			window.setTimeout(() => resize(), J.Constant.delay.popup);
		};

		return () => {
			unbind();
		};
	}, []);

	useEffect(() => resize());

	useImperativeHandle(ref, () => ({
		setBlock,
	}));

	if (!tree.length) {
		return null;
	};

	return (
		<div ref={nodeRef} className="tableOfContents" onClick={onClick}>
			{tree.map(item => (
				<div 
					id={`item-${item.id}`}
					className="item" 
					key={item.id} 
					style={{ width: `${100 / (item.depth + 1)}%` }}
				/>
			))}
		</div>
	);

}));

export default TableOfContents;