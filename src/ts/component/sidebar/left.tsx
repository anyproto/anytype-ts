import React, { forwardRef, useRef, useState, useImperativeHandle, useEffect, MouseEvent } from 'react';
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

	const spaceview = U.Space.getSpaceview();
	const nodeRef = useRef(null);
	const pageRef = useRef(null);
	const subPageRef = useRef(null);
	const ox = useRef(0);
	const oy = useRef(0);
	const sx = useRef(0);
	const frame = useRef(0);
	const width = useRef(0);
	const movedX = useRef(false);
	const { page, subPage } = S.Common.getLeftSidebarState();
	const cn = [ 'sidebar', 'left', `spaceUx${I.SpaceUxType[spaceview.uxType]}` ];

	const getComponentId = (id: string) => {
		id = String(id || '');
		return U.Common.toCamelCase(id.replace(/\//g, '-'));
	};

	const getPageId = (id: string) => {
		return U.Common.toCamelCase(`sidebarPage-${getComponentId(id)}`);
	};

	const getClassName = (id: string): string => {
		const cn = [ 'sidebarPage', U.Common.toCamelCase(`page-${id}`), 'customScrollbar' ];

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

	const canCreate = U.Space.canCreateSpace() && (componentId == 'vault');

	const onCreate = () => {
		Storage.setHighlight('createSpace', false);
		Highlight.hide('createSpace');

		U.Menu.spaceCreate({
			element: `#sidebarRightButton`,
			className: 'spaceCreate fixed',
			classNameWrap: 'fromSidebar',
		}, analytics.route.vault);
	};

	const onResizeStart = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		const node = $(nodeRef.current);
		const win = $(window);
		const body = $('body');
		const { left, top } = node.offset();

		ox.current = left;
		oy.current = top;
		sx.current = e.pageX;

		keyboard.disableSelection(true);
		keyboard.setResize(true);
		body.addClass('colResize');

		win.off('mousemove.sidebar mouseup.sidebar blur.sidebar');
		win.on('mousemove.sidebar', e => onResizeMove(e));
		win.on('mouseup.sidebar blur.sidebar', e => onResizeEnd());
	};

	const onResizeMove = (e: any) => {
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

			if (!d) {
				return;
			};

			if (d < 0) {
				if (w <= J.Size.sidebar.width.close) {
					sidebar.close();
				} else {
					sidebar.setWidth(w);
				};
			};

			if (d > 0) {
				if (sidebar.data.isClosed || ((w >= 0) && (w <= J.Size.sidebar.width.close))) {
					sidebar.open(J.Size.sidebar.width.min);
				} else 
				if (w > J.Size.sidebar.width.close) {
					sidebar.setWidth(w);
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
		sidebar.toggleOpenClose();
	};

	useEffect(() => {
		sidebar.init();

		return () => {
			Preview.tooltipHide(true);
		};
	}, []);

	useEffect(() => {
		sidebar.resizePage(null, null, false);
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
			/>

			{canCreate ? (
				<Icon 
					id="sidebarRightButton"
					className="plus sidebarHeadIcon withBackground"
					tooltipParam={{ caption: keyboard.getCaption('createSpace'), typeY: I.MenuDirection.Bottom }}
					onClick={onCreate}
				/>
			) : ''}

			<div 
				ref={nodeRef}
				id="sidebarLeft" 
				className={cn.join(' ')} 
			>
				{Component ? (
					<div id="pageWrapper" className="pageWrapper">
						<div id={pageId} className={getClassName(componentId)}>
							<Component 
								ref={pageRef} 
								page={componentId}
								{...props} 
								getId={() => pageId}
								sidebarDirection={I.SidebarDirection.Left}
							/> 
						</div>
						<div className="resize-h" draggable={true} onDragStart={onResizeStart}>
							<div className="resize-handle" onClick={onHandleClick} />
						</div>
					</div>
				) : ''}

				{SubComponent ? (
					<div id="subPageWrapper" className="subPageWrapper">
						<div id={subPageId} className={getClassName(subComponentId)}>
							<SubComponent 
								ref={subPageRef} 
								page={subComponentId}
								{...props} 
								getId={() => subPageId}
								sidebarDirection={I.SidebarDirection.Left}
							/> 
						</div>
					</div>
				) : ''}
			</div>
		</>
	);

}));

export default SidebarLeft;