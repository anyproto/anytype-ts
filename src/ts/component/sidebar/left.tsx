import React, { forwardRef, useRef, useState, useImperativeHandle, useEffect, MouseEvent } from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Icon, Banner } from 'Component';
import { I, U, J, S, keyboard, Preview, sidebar, Renderer, translate, Action, analytics } from 'Lib';

import PageWidget from './page/widget';
import PageAllObject from './page/allObject';
import PageSettingsIndex from './page/settings/index';
import PageSettingsLibrary from './page/settings/library';
import PageVault from './page/vault';

const Components = {
	allObject:			 PageAllObject,
	widget:				 PageWidget,
	vault:				 PageVault,
	settings:			 PageSettingsIndex,
	settingsSpace:		 PageSettingsIndex,
	settingsTypes:		 PageSettingsLibrary,
	settingsRelations:	 PageSettingsLibrary,
};

interface SidebarLeftRefProps {
	setPage: (page: string) => void;
	getPage: () => string;
	getChild: () => any;
	getNode: () => HTMLElement | null;
};

const SidebarLeft = observer(forwardRef<SidebarLeftRefProps, {}>((props, ref) => {

	const { space } = S.Common;
	const spaceview = U.Space.getSpaceview();
	const nodeRef = useRef(null);
	const childRef = useRef(null);
	const ox = useRef(0);
	const oy = useRef(0);
	const sx = useRef(0);
	const frame = useRef(0);
	const width = useRef(0);
	const movedX = useRef(false);
	const [ page, setPage ] = useState('');
	const id = U.Common.toCamelCase(page.replace(/\//g, '-'));
	const pageId = U.Common.toCamelCase(`sidebarPage-${id}`);
	const cn = [ 'sidebar', 'left', 'customScrollbar', `spaceUx${I.SpaceUxType[spaceview.uxType]}` ];
	const cnp = [ 'sidebarPage', U.Common.toCamelCase(`page-${id}`), 'customScrollbar' ];
	const Component = Components[id];
	const canCreate = U.Space.canCreateSpace() && (id == 'vault');

	if (id.match(/settings/)) {
		cnp.push('containerSettings');
	};

	if ([ 'settingsTypes', 'settingsRelations' ].includes(id)) {
		cnp.push('spaceSettingsLibrary');
	};

	const onCreate = () => {
		Action.spaceCreateMenu({
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

			if (childRef.current && childRef.current.resize) {
				childRef.current.resize();
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
	}, [ page ]);

	useImperativeHandle(ref, () => ({
		getNode: () => nodeRef.current,
		setPage,
		getPage: () => page,
		getChild: () => childRef.current
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
					<div id={pageId} className={cnp.join(' ')}>
						<Component 
							ref={childRef} 
							page={id}
							{...props} 
							getId={() => pageId}
							sidebarDirection={I.SidebarDirection.Left}
						/> 
					</div>
				) : ''}

				<div className="resize-h" draggable={true} onDragStart={onResizeStart}>
					<div className="resize-handle" onClick={onHandleClick} />
				</div>
			</div>
		</>
	);

}));

export default SidebarLeft;
