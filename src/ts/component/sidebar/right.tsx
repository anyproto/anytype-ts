import React, { forwardRef, useRef, useLayoutEffect, useImperativeHandle, DragEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { I, U, J, S, keyboard, sidebar } from 'Lib';

import PageType from './page/type';
import PageObjectRelation from './page/object/relation';
import PageObjectTableOfContents from './page/object/tableOfContents';
import PageWidget from './page/widget';

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

const SidebarRight = observer(forwardRef<SidebarRightRefProps, Props>((props, ref) => {
	
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

	const onResizeStart = (e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();

		const win = $(window);
		const body = $('body');
		const node = $(nodeRef.current);
		const o = node.offset();

		ox.current = o.left;
		oy.current = o.top;
		sx.current = e.pageX;
		width.current = node.outerWidth();

		keyboard.disableSelection(true);
		keyboard.setResize(true);
		body.addClass('colResize');

		win.off('mousemove.sidebar mouseup.sidebar');
		win.on('mousemove.sidebar', e => onResizeMove(e));
		win.on('mouseup.sidebar', e => onResizeEnd(e));
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

		$('body').removeClass('colResize');
		$(window).off('mousemove.sidebar mouseup.sidebar');
	};

	useLayoutEffect(() => {
		if (state.page == 'object/relation') {
			const object = S.Detail.get(state.rootId, state.rootId);

			if (
				U.Object.isTypeOrRelationLayout(object.layout) || 
				(
					(spaceview.isChat || spaceview.isOneToOne) && 
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

}));

export default SidebarRight;