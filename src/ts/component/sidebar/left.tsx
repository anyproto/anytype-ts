import React, { forwardRef, useRef, useImperativeHandle, useEffect, DragEvent } from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, U, S, J, keyboard, Preview, sidebar, translate } from 'Lib';

import PageWidget from './page/widget';
import PageSettingsIndex from './page/settings/index';
import PageSettingsLibrary from './page/settings/library';
import PageVault from './page/vault';

const Components = {
	widget:				 PageWidget,
	vault:				 PageVault,
	settings:			 PageSettingsIndex,
	settingsSpace:		 PageSettingsIndex,
	settingsTypes:		 PageSettingsLibrary,
	settingsRelations:	 PageSettingsLibrary,
};

interface SidebarLeftRefProps {
	getComponentRef: () => any;
	getSubComponentRef: () => any;
	getNode: () => HTMLElement | null;
};

const SidebarLeft = observer(forwardRef<SidebarLeftRefProps, {}>((props, ref) => {

	const { vaultIsMinimal } = S.Common;
	const nodeRef = useRef(null);
	const pageRef = useRef(null);
	const subPageRef = useRef(null);
	const pageWrapperRef = useRef(null);
	const subPageWrapperRef = useRef(null);
	const ox = useRef(0);
	const oy = useRef(0);
	const sx = useRef(0);
	const frame = useRef(0);
	const width = useRef(0);
	const movedX = useRef(false);
	const { page, subPage } = S.Common.getLeftSidebarState();
	const cn = [ 'sidebar', 'left' ];

	if (vaultIsMinimal) {
		cn.push('isMinimal');
	};

	const getComponentId = (id: string) => {
		id = String(id || '');
		return U.String.toCamelCase(id.replace(/\//g, '-'));
	};

	const getPageId = (id: string) => {
		return U.String.toCamelCase(`sidebarPage-${getComponentId(id)}`);
	};

	const getClassName = (id: string): string => {
		const cn = [ 'sidebarPage', U.String.toCamelCase(`page-${id}`) ];

		if (!U.Common.isPlatformMac()) {
			cn.push('customScrollbar');
		};

		if (id.match(/settings/)) {
			cn.push('containerSettings');
		};

		if ([ 'settingsTypes', 'settingsRelations' ].includes(id)) {
			cn.push('spaceSettingsLibrary');
		};

		if ((id == 'vault') && vaultIsMinimal) {
			cn.push('isMinimal');
		};

		return cn.join(' ');
	};

	const componentId = getComponentId(page);
	const pageId = getPageId(page);
	const Component = Components[componentId];

	const subComponentId = getComponentId(subPage);
	const subPageId = getPageId(subPage);
	const SubComponent = Components[subComponentId];

	const onResizeStart = (e: DragEvent, panel: I.SidebarPanel) => {
		e.preventDefault();
		e.stopPropagation();

		const win = $(window);
		const body = $('body');

		switch (panel) {
			case I.SidebarPanel.Left: {
				const o = $(pageWrapperRef.current).offset();

				ox.current = o.left;
				oy.current = o.top;
				break;
			};

			case I.SidebarPanel.SubLeft: {
				const o = $(subPageWrapperRef.current).offset();

				ox.current = o.left;
				oy.current = o.top;
				break;
			};
		};

		sx.current = e.pageX;

		keyboard.disableSelection(true);
		keyboard.setResize(true);
		body.addClass('colResize');

		win.off('mousemove.sidebar mouseup.sidebar');
		win.on('mousemove.sidebar', e => onResizeMove(e, panel));
		win.on('mouseup.sidebar', e => onResizeEnd(e, panel));
	};

	const onResizeMove = (e: any, panel: I.SidebarPanel) => {
		if (frame.current) {
			raf.cancel(frame.current);
		};

		frame.current = raf(() => {
			if (sidebar.isAnimating) {
				return;
			};

			if (Math.abs(sx.current - e.pageX) >= 10) {
				movedX.current = true;
			};

			const w = Math.max(0, (e.pageX - ox.current));
			const d = w - width.current;
			const data = sidebar.getData(panel);
			const sizeParam = sidebar.getSizeParam(panel);
			const { min } = sizeParam;
			const closeWidth = min * 0.75;

			if (!d) {
				return;
			};

			if (d < 0) {
				if (w <= closeWidth) {
					sidebar.close(panel);
				} else {
					sidebar.setWidth(panel, false, w, false);
				};
			};

			if (d > 0) {
				if (data.isClosed || ((w >= 0) && (w <= closeWidth))) {
					sidebar.open(panel, '', min);
				} else 
				if (w > closeWidth) {
					sidebar.setWidth(panel, false, w, false);
				};
			};

			width.current = w;

			if (pageRef.current && pageRef.current.resize) {
				pageRef.current.resize();
			};
		});
	};

	const onResizeEnd = (e: any, panel: I.SidebarPanel) => {
		keyboard.disableSelection(false);
		keyboard.setResize(false);
		raf.cancel(frame.current);

		$('body').removeClass('colResize');
		$(window).off('mousemove.sidebar mouseup.sidebar');

		const w = Math.max(0, (e.pageX - ox.current));

		sidebar.setWidth(panel, false, w, true);
		window.setTimeout(() => movedX.current = false, 15);
	};

	const onHandleClick = (panel: I.SidebarPanel) => {
		if (!movedX.current) {
			if (panel == I.SidebarPanel.Left) {
				const w = vaultIsMinimal ? J.Size.sidebar.default.min : J.Size.sidebar.left.min;

				if (sidebar.getData(panel).isClosed) {
					sidebar.toggle(panel);
				} else {
					sidebar.setWidth(panel, false, w, true);
				};
			} else {
				sidebar.toggle(panel, subPage);
			};
		};
	};

	useEffect(() => {
		return () => {
			Preview.tooltipHide(true);
		};
	}, []);

	useEffect(() => {
		if (!sidebar.isAnimating) {
			sidebar.resizePage(false, null, null, false);
		};
	}, [ page, subPage ]);

	useImperativeHandle(ref, () => ({
		getNode: () => nodeRef.current,
		getComponentRef: () => pageRef.current,
		getSubComponentRef: () => subPageRef.current,
	}));

	return (
		<div 
			ref={nodeRef}
			id="sidebarLeft" 
			className={cn.join(' ')} 
		>
			<div id="pageWrapper" ref={pageWrapperRef} className="pageWrapper">
				{Component ? (
					<div id={pageId} className={getClassName(componentId)}>
						<Component 
							ref={pageRef} 
							page={componentId}
							{...props} 
							getId={() => pageId}
							sidebarDirection={I.SidebarDirection.Left}
						/> 
					</div>
				) : ''}
				<div 
					className="resize-h" 
					draggable={true} 
					onDragStart={e => onResizeStart(e, I.SidebarPanel.Left)}
					onClick={() => onHandleClick(I.SidebarPanel.Left)}
				>
					<div className="resize-handle" />
				</div>
			</div>
			
			<div id="subPageWrapper" ref={subPageWrapperRef} className="subPageWrapper">
				{SubComponent ? (
					<div id={subPageId} className={getClassName(subComponentId)}>
						<SubComponent 
							ref={subPageRef} 
							page={subComponentId}
							{...props} 
							getId={() => subPageId}
							sidebarDirection={I.SidebarDirection.Left}
						/> 
					</div>
				) : ''}
				<div 
					className="resize-h" 
					draggable={true} 
					onDragStart={e => onResizeStart(e, I.SidebarPanel.SubLeft)}
					onClick={() => onHandleClick(I.SidebarPanel.SubLeft)}
				>
					<div className="resize-handle" />
				</div>
			</div>
		</div>
	);

}));

export default SidebarLeft;
