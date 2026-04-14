import React, { forwardRef, useImperativeHandle, useRef, useEffect, useMemo, useState } from 'react';
import raf from 'raf';
import * as I from 'Interface';

interface TableOfContentsRefProps {
	setBlock: (v: string) => void;
	onScroll?: () => void;
	forceUpdate?: () => void;
};

const TableOfContents = forwardRef<TableOfContentsRefProps, I.BlockComponent>((props, ref) => {

	const { rootId, isPopup } = props;
	const [ dummy, setDummy] = useState(0);
	const nodeRef = useRef(null);
	const tree = S.Block.getTableOfContents(rootId, true).slice(0, J.Constant.limit.tableOfContents);
	const blockRef = useRef('');
	const containerOffset = useRef({ top: 0, left: 0 });
	const frameResize = useRef(0);
	const frameScroll = useRef(0);
	const listRef = useRef([]);
	const rightSidebar = S.Common.getRightSidebarState(isPopup);
	const isOpen = rightSidebar.page == 'object/tableOfContents';

	const setBlock = (id: string) => {
		U.Dom.selectAll('.item.active', nodeRef.current).forEach(el => U.Dom.removeClass(el, 'active'));

		if (!id) {
			return;
		};

		U.Dom.addClass(U.Dom.select(`#item-${U.Common.esc(id)}`, nodeRef.current), 'active');
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

		const treeIds = new Set(tree.map(it => it.id));
		const ids = headers.map(it => it.id);
		const root = S.Block.wrapTree(rootId, rootId);
		const list = S.Block.unwrapTree([ root ]).filter(it => ids.includes(it.id) && treeIds.has(it.id));

		return list;
	};

	const list = useMemo(() => getList(), [ tree ]);
	listRef.current = list;

	const onScroll = () => {
		raf.cancel(frameScroll.current);
		frameScroll.current = raf(() => {
			const container = U.Dom.getScrollContainer(isPopup);
			if (!container) {
				return;
			};

			const top = container.scrollTop;
			const co = container.getBoundingClientRect().top;
			const currentList = listRef.current;

			let blockId = '';

			for (let i = 0; i < currentList.length; ++i) {
				const block = currentList[i];
				const el = U.Dom.get(`block-${block.id}`);

				if (!el) {
					continue;
				};

				const elTop = el.getBoundingClientRect().top - co;

				if (elTop <= 0) {
					blockId = block.id;
				} else {
					if (!blockId) {
						blockId = block.id;
					};
					break;
				};
			};

			if ((top >= U.Dom.getMaxScrollHeight(isPopup)) && currentList.length) {
				blockId = currentList[currentList.length - 1].id;
			};

			setBlock(blockId);
		});
	};

	const onMouseEnter = () => {
		if (S.Menu.isAnimating('tableOfContents') || keyboard.isResizing) {
			return;
		};

		S.Menu.open('tableOfContents', {
			className: 'fixed',
			element: nodeRef.current,
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
		raf.cancel(frameResize.current);
		frameResize.current = raf(() => {
			const node = nodeRef.current;
			if (!node) {
				return;
			};

			const containerEl = U.Dom.getScrollContainer(isPopup);
			if (!containerEl) {
				return;
			};

			const width = containerEl.clientWidth;
			const containerRect = containerEl.getBoundingClientRect();

			containerOffset.current = { top: containerRect.top, left: containerRect.left };

			U.Dom.css(node, { left: `${containerOffset.current.left + width - node.offsetWidth - 6}px` });
			onScroll();
		});
	};

	useEffect(() => {
		resize();

		return () => {
			raf.cancel(frameResize.current);
			raf.cancel(frameScroll.current);
		};
	}, []);

	useEffect(() => {
		resize();
	}, [ tree ]);

	useImperativeHandle(ref, () => ({
		resize,
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

});

export default TableOfContents;