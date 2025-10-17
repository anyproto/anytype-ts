import React, { forwardRef, useRef, useLayoutEffect, useImperativeHandle, useEffect, MouseEvent } from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, U, J, S, keyboard, Preview, sidebar, analytics, Storage, Highlight } from 'Lib';

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

	const getComponentId = (id: string) => {
		id = String(id || '');
		return U.Common.toCamelCase(id.replace(/\//g, '-'));
	};

	const getPageId = (id: string) => {
		return U.Common.toCamelCase(`sidebarPage-${getComponentId(id)}`);
	};

	const getClassName = (id: string): string => {
		const cn = [ 'sidebarPage', U.Common.toCamelCase(`page-${id}`) ];

		if (!U.Common.isPlatformMac()) {
			cn.push('customScrollbar');
		};

		if (id.match(/settings/)) {
			cn.push('containerSettings');
		};

		if ([ 'settingsTypes', 'settingsRelations' ].includes(id)) {
			cn.push('spaceSettingsLibrary');
		};

		return cn.join(' ');
	};

	const componentId = getComponentId(page);
	const pageId = getPageId(page);
	const Component = Components[componentId];

	const subComponentId = getComponentId(subPage);
	const subPageId = getPageId(subPage);
	const SubComponent = Components[subComponentId];

	const onResizeStart = (e: MouseEvent, panel: I.SidebarPanel) => {
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

		win.off('mousemove.sidebar mouseup.sidebar blur.sidebar');
		win.on('mousemove.sidebar', e => onResizeMove(e, panel));
		win.on('mouseup.sidebar blur.sidebar', e => onResizeEnd());
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

			if (!d) {
				return;
			};

			if (d < 0) {
				if (w <= J.Size.sidebar.width.close) {
					sidebar.close(panel);
				} else {
					sidebar.setWidth(panel, w);
				};
			};

			if (d > 0) {
				if (data.isClosed || ((w >= 0) && (w <= J.Size.sidebar.width.close))) {
					sidebar.open(panel, '', J.Size.sidebar.width.min);
				} else 
				if (w > J.Size.sidebar.width.close) {
					sidebar.setWidth(panel, w);
				};
			};

			width.current = w;

			if (pageRef.current && pageRef.current.resize) {
				pageRef.current.resize();
			};
		});
	};

	const onResizeEnd = () => {
		keyboard.disableSelection(false);
		keyboard.setResize(false);
		raf.cancel(frame.current);

		$('body').removeClass('colResize');
		$(window).off('mousemove.sidebar mouseup.sidebar');

		window.setTimeout(() => movedX.current = false, 15);
	};

	const onHandleClick = () => {
		if (!movedX.current) {
			onToggleClick();
		};
	};

	const onToggleClick = () => {
		sidebar.leftPanelToggle();
	};

	useEffect(() => {
		sidebar.init();

		return () => {
			Preview.tooltipHide(true);
		};
	}, []);

	useEffect(() => {
		if (!sidebar.isAnimating) {
			sidebar.resizePage(null, null, false);
		};
	}, [ page, subPage ]);

	useImperativeHandle(ref, () => ({
		getNode: () => nodeRef.current,
		getComponentRef: () => pageRef.current,
		getSubComponentRef: () => subPageRef.current,
	}));

	return (
		<>
			<Icon 
				id="sidebarLeftButton"
				className="toggle sidebarHeadIcon withBackground"
				tooltipParam={{ caption: keyboard.getCaption('toggleSidebar'), typeY: I.MenuDirection.Bottom }}
				onClick={onToggleClick}
				onMouseDown={e => e.stopPropagation()}
			/>

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
					<div className="resize-h" draggable={true} onDragStart={e => onResizeStart(e, I.SidebarPanel.Left)}>
						<div className="resize-handle" onClick={onHandleClick} />
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
					<div className="resize-h" draggable={true} onDragStart={e => onResizeStart(e, I.SidebarPanel.SubLeft)}>
						<div className="resize-handle" />
					</div>
				</div>
			</div>
		</>
	);

}));

export default SidebarLeft;