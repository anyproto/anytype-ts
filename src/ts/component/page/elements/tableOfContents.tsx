import React, { forwardRef, useImperativeHandle, useRef, useEffect, useMemo } from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { I, S, U, J, sidebar } from 'Lib';

interface TableOfContentsRefProps {
	setBlock: (v: string) => void;
	onScroll?: () => void;
};

const TableOfContents = observer(forwardRef<TableOfContentsRefProps, I.BlockComponent>((props, ref) => {

	const { rootId, isPopup } = props;
	const nodeRef = useRef(null);
	const tree = S.Block.getTableOfContents(rootId, true).slice(0, J.Constant.limit.tableOfContents);
	const blockRef = useRef('');
	const containerOffset = useRef({ top: 0, left: 0 });
	const containerWidth = useRef(0);
	const containerHeight = useRef(0);
	const ns = U.Common.getEventNamespace(isPopup);

	const rebind = () => {
		unbind();
		$(window).on(`resize.tableOfContents${ns}`, () => resize());
	};

	const unbind = () => {
		$(window).off(`resize.tableOfContents${ns}`);
	};

	const setBlock = (id: string) => {
		const node = $(nodeRef.current);

		node.find('.item.active').removeClass('active');

		if (!id) {
			return;
		};

		node.find(`#item-${id}`).addClass('active');
		blockRef.current = id;
		S.Menu.updateData('tableOfContents', { blockId: id });

		const rightSidebar = S.Common.getRightSidebarState(isPopup);
		if (rightSidebar.page == 'object/tableOfContents') {
			sidebar.rightPanelSetState(isPopup, { page: 'object/tableOfContents', rootId, blockId: id });
		};
	};

	const getList = () => {
		const headers = S.Block.getBlocks(rootId, it => it.isTextTitle() || it.isTextHeader());

		if (!headers.length) {
			return [];
		};

		const ids = headers.map(it => it.id);
		const root = S.Block.wrapTree(rootId, rootId);
		const list = S.Block.unwrapTree([ root ]).filter(it => ids.includes(it.id));

		return list;
	};

	const list = useMemo(() => getList(), [ tree ]);

	const onScroll = () => {
		const container = U.Common.getScrollContainer(isPopup);
		const top = container.scrollTop();
		const co = containerOffset.current.top;
		const ch = containerHeight.current - J.Size.header;

		let blockId = '';

		for (let i = 0; i < list.length; ++i) {
			const block = list[i];
			const el = $(`#block-${block.id}`);

			if (!el.length) {
				continue;
			};

			if (el.offset().top - co >= 0) {
				blockId = block.id;
				break;
			};
		};

		if ((top == U.Common.getMaxScrollHeight(isPopup)) && list.length) {
			blockId = list[list.length - 1].id;
		};

		setBlock(blockId);
	};

	const onMouseEnter = () => {
		if (S.Menu.isAnimating('tableOfContents')) {
			return;
		};

		S.Menu.open('tableOfContents', {
			className: 'fixed',
			element: $(nodeRef.current),
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

			containerWidth.current = container.width();
			containerHeight.current = container.height();
			containerOffset.current = container.offset();

			node.css({ left: containerOffset.current.left + containerWidth.current - node.outerWidth() - 6 });

			onScroll();
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

	useEffect(() => {
		resize();
	}, [ tree ]);

	useImperativeHandle(ref, () => ({
		setBlock,
		onScroll,
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