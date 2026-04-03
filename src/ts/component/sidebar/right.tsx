import React, { forwardRef, useRef, useLayoutEffect, useImperativeHandle, DragEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import raf from 'raf';

import PageType from './page/type';
import PageObjectRelation from './page/object/relation';
import PageObjectTableOfContents from './page/object/tableOfContents';
import PageWidget from './page/widget';
import * as I from 'Interface';

interface Props {
	isPopup?: boolean;
};

interface SidebarRightRefProps {
	getNode: () => HTMLElement | null;
};

const Components = {
	type:					 PageType,
	objectRelation:			 PageObjectRelation,
	objectTableOfContents:	 PageObjectTableOfContents,
	widget:					 PageWidget,
};

const SidebarRight = forwardRef<SidebarRightRefProps, Props>((props, ref) => {
	
	const { isPopup } = props;
	const nodeRef = useRef(null);
	const pageRef = useRef(null);
	const { space } = S.Common;
	const spaceview = U.Space.getSpaceview();
	const state = S.Common.getRightSidebarState(isPopup);
	const page = String(state.page || '');
	const id = U.String.toCamelCase(page.replace(/\//g, '-'));
	const Component = Components[id];
	const pageId = U.String.toCamelCase(`sidebarPage-${id}`);
	const cn = [ 'sidebar', 'right' ];
	const cnp = [ 'sidebarPage', U.String.toCamelCase(`page-${page.replace(/\//g, '-')}`) ];
	const withPreview = !state.noPreview && [ 'type' ].includes(page);
	const ox = useRef(0);
	const oy = useRef(0);
	const sx = useRef(0);
	const frame = useRef(0);
	const width = useRef(0);
	const data = sidebar.getData(I.SidebarPanel.Right, isPopup);

	if (withPreview) {
		cn.push('withPreview');
	};

	if (!U.Common.isPlatformMac()) {
		cn.push('customScrollbar');
	};

	const mouseMoveHandler = useRef<(e: any) => void>(null);
	const mouseUpHandler = useRef<(e: any) => void>(null);

	const onResizeStart = (e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();

		const node = nodeRef.current;
		if (!node) {
			return;
		};

		const rect = node.getBoundingClientRect();

		ox.current = rect.left + window.scrollX;
		oy.current = rect.top + window.scrollY;
		sx.current = e.pageX;
		width.current = node.offsetWidth;

		keyboard.disableSelection(true);
		keyboard.setResize(true);
		U.Dom.addClass(document.body, 'colResize');

		if (mouseMoveHandler.current) {
			U.Dom.removeEvent(window, 'mousemove', mouseMoveHandler.current);
		};
		if (mouseUpHandler.current) {
			U.Dom.removeEvent(window, 'mouseup', mouseUpHandler.current);
		};

		mouseMoveHandler.current = (e: any) => onResizeMove(e);
		mouseUpHandler.current = (e: any) => onResizeEnd(e);

		U.Dom.addEvents(window, [
			['mousemove', mouseMoveHandler.current],
			['mouseup', mouseUpHandler.current],
		]);
	};

	const onResizeMove = (e: any) => {
		if (frame.current) {
			raf.cancel(frame.current);
		};

		frame.current = raf(() => {
			if (sidebar.isAnimating) {
				return;
			};

			const w = width.current + ox.current - e.pageX;
			const d = w - width.current;

			if (d) {
				sidebar.setWidth(I.SidebarPanel.Right, isPopup, w, false);

				if (pageRef.current && pageRef.current.resize) {
					pageRef.current.resize();
				};
			};
		});
	};

	const onResizeEnd = (e: any) => {
		keyboard.disableSelection(false);
		keyboard.setResize(false);
		raf.cancel(frame.current);

		const w = width.current + ox.current - e.pageX;

		sidebar.setWidth(I.SidebarPanel.Right, isPopup, w, true);

		U.Dom.removeClass(document.body, 'colResize');

		if (mouseMoveHandler.current) {
			U.Dom.removeEvent(window, 'mousemove', mouseMoveHandler.current);
			mouseMoveHandler.current = null;
		};
		if (mouseUpHandler.current) {
			U.Dom.removeEvent(window, 'mouseup', mouseUpHandler.current);
			mouseUpHandler.current = null;
		};
	};

	useLayoutEffect(() => {
		if (state.page == 'object/relation') {
			const object = S.Detail.get(state.rootId, state.rootId);

			if (
				U.Object.isTypeOrRelationLayout(object.layout) ||
				(
					spaceview.isOneToOne &&
					(U.Object.isChatLayout(object.layout) || U.Object.isSpaceLayout(object.layout))
				)
			) {
				sidebar.rightPanelClose(isPopup, false);
				return;
			};
		};

		pageRef.current?.forceUpdate();
	}, [ state.rootId, state.page, state.noPreview, state.details, state.readonly, state.blockId, space ]);

	useImperativeHandle(ref, () => ({
		getNode: () => nodeRef.current,
	}));

	return (
		<div 
			id="sidebarRight"
			ref={nodeRef}
			className={cn.join(' ')}
			style={{ width: data.isClosed ? 0 : data.width }}
		>
			{Component ? (
				<AnimatePresence mode="popLayout">
					<motion.div
						id={pageId} 
						className={cnp.join(' ')}
					>
						<Component 
							ref={pageRef} 
							{...props} 
							{...state}
							sidebarDirection={I.SidebarDirection.Right}
							getId={() => pageId}
						/> 
					</motion.div>

					<div className="resize-h" draggable={true} onDragStart={onResizeStart}>
						<div className="resize-handle" />
					</div>
				</AnimatePresence>
			): ''}
		</div>
	);

});

export default SidebarRight;