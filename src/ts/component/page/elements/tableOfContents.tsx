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
	const blocks = S.Block.getBlocks(rootId, it => it.isTextHeader());
	const max = blocks.reduce((res, current) => Math.max(res, current.getLength()), 0);
	
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
			const height = container.height();
			const o = isPopup && container.length ? container.offset().left : 0;

			node.css({ left: o + width - node.width() - 22 });
			console.log('resize', width, height);
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

	if (!blocks.length || !max) {
		return null;
	};

	return (
		<div ref={nodeRef} className="tableOfContents" onClick={onClick}>
			{blocks.map(block => (
				<div 
					id={`item-${block.id}`}
					className="item" 
					key={block.id} 
					style={{ width: `${block.getLength() / max * 100}%` }}
				/>
			))}
		</div>
	);

}));

export default TableOfContents;