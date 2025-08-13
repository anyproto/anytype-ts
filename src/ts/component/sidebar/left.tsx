import React, { forwardRef, useRef, useState, useImperativeHandle, useEffect, MouseEvent } from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Icon, Sync, Banner } from 'Component';
import { I, U, J, S, keyboard, Preview, sidebar, Renderer, translate } from 'Lib';

import SidebarWidget from './page/widget';
import SidebarObject from './page/allObject';
import SidebarSettingsIndex from './page/settings/index';
import SidebarSettingsLibrary from './page/settings/library'

const Components = {
	object: SidebarObject,
	widget: SidebarWidget,
	settings: SidebarSettingsIndex,
	settingsSpace: SidebarSettingsIndex,
	types: SidebarSettingsLibrary,
	relations: SidebarSettingsLibrary,
};

interface SidebarLeftRefProps {
	setPage: (page: string) => void;
	getPage: () => string;
	getChild: () => any;
	getNode: () => HTMLElement | null;
};

const SidebarLeft = observer(forwardRef<SidebarLeftRefProps, {}>((props, ref) => {

	const nodeRef = useRef(null);
	const childRef = useRef(null);
	const ox = useRef(0);
	const oy = useRef(0);
	const sx = useRef(0);
	const frame = useRef(0);
	const width = useRef(0);
	const movedX = useRef(false);
	const [ page, setPage ] = useState('widget');
	const { showVault, updateVersion } = S.Common;
	const Component = Components[page];

	const init = () => {
		const node = $(nodeRef.current);
		const vault = $(S.Common.getRef('vault').node);

		node.toggleClass('withVault', showVault);
		vault.toggleClass('isHidden', !showVault);
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

			if (childRef.current.resize) {
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

	const onToggleContext = () => {
		U.Menu.sidebarContext('#sidebarToggle');
	};

	const onSync = () => {
		S.Menu.closeAllForced(null, () => S.Menu.open('syncStatus', {
			element: '#sidebarSync',
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			subIds: J.Menu.syncStatus,
			data: {
				rootId: keyboard.getRootId(),
			},
		}));
	};

	useEffect(() => {
		init();
		sidebar.init();

		return () => {
			Preview.tooltipHide(true);
		};
	}, []);

	useEffect(() => {
		init();
	});

	useImperativeHandle(ref, () => ({
		getNode: () => {
			return nodeRef.current;
		},

		setPage: (page: string) => {
			if (Components[page]) {
				setPage(page);
			};
		},

		getPage: () => {
			return page;
		},

		getChild: () => {
			return childRef.current;
		},
	}));

	return (
		<>
			<Icon 
				id="sidebarToggle"
				className="withBackground"
				tooltipParam={{ caption: keyboard.getCaption('toggleSidebar'), typeY: I.MenuDirection.Bottom }}
				onClick={onToggleClick}
				onContextMenu={onToggleContext}
			/>

			<Sync id="sidebarSync" onClick={onSync} />

			<div 
				ref={nodeRef}
				id="sidebarLeft" 
				className="sidebar left customScrollbar" 
			>
				<Component ref={childRef} {...props} page={page} />

				<div className="resize-h" draggable={true} onDragStart={onResizeStart}>
					<div className="resize-handle" onClick={onHandleClick} />
				</div>

				{updateVersion ? (
					<Banner 
						id="update" 
						text={U.Common.sprintf(translate('commonNewVersion'), updateVersion)} 
						button={translate('commonUpdateNow')} 
						onClick={() => {
							Renderer.send('updateConfirm');
							S.Common.updateVersionSet('');
							U.Common.checkUpdateVersion(updateVersion);
						}}
						onClose={() => {
							S.Common.updateVersionSet('');
							Renderer.send('updateCancel');
						}}
					/>
				) : ''}
			</div>
		</>
	);

}));

export default SidebarLeft;