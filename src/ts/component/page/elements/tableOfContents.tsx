import React, { forwardRef, useImperativeHandle, useRef, useEffect, useMemo, useState } from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { I, S, U, J, keyboard } from 'Lib';

interface TableOfContentsRefProps {
	setBlock: (v: string) => void;
	onScroll?: () => void;
	forceUpdate?: () => void;
};

const TableOfContents = observer(forwardRef<TableOfContentsRefProps, I.BlockComponent>((props, ref) => {

	const { rootId, isPopup } = props;
	const [ dummy, setDummy] = useState(0);
	const nodeRef = useRef(null);
	const tree = S.Block.getTableOfContents(rootId, true).slice(0, J.Constant.limit.tableOfContents);
	const blockRef = useRef('');
	const containerOffset = useRef({ top: 0, left: 0 });
	const frame = useRef(0);
	const listRef = useRef([]);
	const ns = `tableOfContents${U.Common.getEventNamespace(isPopup)}`;
	const rightSidebar = S.Common.getRightSidebarState(isPopup);
	const isOpen = rightSidebar.page == 'object/tableOfContents';

	const rebind = () => {
		unbind();
		$(window).on(`resize.${ns} sidebarResize.${ns}`, () => resize());
	};

	const unbind = () => {
		$(window).off(`resize.${ns} sidebarResize.${ns}`);
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

		if (isOpen) {
			S.Common.setRightSidebarState(isPopup, { page: 'object/tableOfContents', rootId, blockId: id });
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
	listRef.current = list;

	const onScroll = () => {
		const container = U.Common.getScrollContainer(isPopup);
		const top = container.scrollTop();
		const co = containerOffset.current.top;
		const currentList = listRef.current;

		let blockId = '';

		for (let i = 0; i < currentList.length; ++i) {
			const block = currentList[i];
			const el = $(`#block-${block.id}`);

			if (!el.length) {
				continue;
			};

			if (el.offset().top - co >= 0) {
				blockId = block.id;
				break;
			};
		};

		if ((top == U.Common.getMaxScrollHeight(isPopup)) && currentList.length) {
			blockId = currentList[currentList.length - 1].id;
		};

		setBlock(blockId);
	};

	const onMouseEnter = () => {
		if (S.Menu.isAnimating('tableOfContents') || keyboard.isResizing) {
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
		raf.cancel(frame.current);
		frame.current = raf(() => {
			const node = $(nodeRef.current);
			if (!node.length) {
				return;
			};

			const container = U.Common.getScrollContainer(isPopup);
			const width = container.width();

			containerOffset.current = container.offset();

			node.css({ left: containerOffset.current.left + width - node.outerWidth() - 6 });
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
			raf.cancel(frame.current);
		};
	}, []);

	useEffect(() => {
		resize();
	}, [ tree ]);

	useImperativeHandle(ref, () => ({
		setBlock,
		onScroll,
		forceUpdate: () => setDummy(dummy + 1),
	}));

	if ((tree.length < 2) || isOpen) {
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