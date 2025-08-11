import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { I, S, U, J, sidebar } from 'Lib';

interface TableOfContentsRefProps {
	setBlock: (v: string) => void;
};

const TableOfContents = observer(forwardRef<TableOfContentsRefProps, I.BlockComponent>((props, ref) => {

	const { rootId, isPopup } = props;
	const nodeRef = useRef(null);
	const tree = S.Block.getTableOfContents(rootId, true).slice(0, J.Constant.limit.tableOfContents);
	const blockRef = useRef('');

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
			blockRef.current = id;
			S.Menu.updateData('tableOfContents', { blockId: id });

			const state = sidebar.rightPanelGetState(isPopup);
			if (state.page == 'object/tableOfContents') {
				sidebar.rightPanelSetState(isPopup, { page: 'object/tableOfContents', rootId, blockId: id });
			};
		};
	};

	const onMouseEnter = () => {
		if (S.Menu.isAnimating('tableOfContents')) {
			return;
		};

		const node = $(nodeRef.current);

		S.Menu.open('tableOfContents', {
			className: 'fixed',
			element: node,
			horizontal: I.MenuDirection.Right,
			vertical: I.MenuDirection.Center,
			noFlipX: true,
			noFlipY: true,
			isSub: true,
			noAnimation: false,
			offsetX: 16,
			data: {
				rootId,
				isPopup,
				blockId: blockRef.current,
			}
		});

		S.Common.clearTimeout('tableOfContents');
	};

	const onMouseLeave = () => {
		S.Common.setTimeout('tableOfContents', 100, () => S.Menu.close('tableOfContents'));
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

			node.css({ left: o + width - node.outerWidth() - 6 });
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

	if (tree.length < 2) {
		return null;
	};

	return (
		<div 
			ref={nodeRef} 
			className="tableOfContents"
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
		>
			<div className="inner">
				{tree.map(item => (
					<div 
						id={`item-${item.id}`}
						className="item" 
						key={item.id} 
						style={{ width: `${100 / (item.depth + 1)}%` }}
					/>
				))}
			</div>
		</div>
	);

}));

export default TableOfContents;