import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Icon, Sync } from 'Component';
import { I, U, J, S, keyboard, Preview, sidebar } from 'Lib';

import SidebarWidget from './page/widget';
import SidebarObject from './page/allObject';
import SidebarSettingsIndex from './page/settings/index';
import SidebarSettingsLibrary from './page/settings/library'

interface State {
	page: string;
};

const Components = {
	object: SidebarObject,
	widget: SidebarWidget,
	settings: SidebarSettingsIndex,
	settingsSpace: SidebarSettingsIndex,
	types: SidebarSettingsLibrary,
	relations: SidebarSettingsLibrary,
};

const SidebarLeft = observer(class SidebarLeft extends React.Component<{}, State> {
	
	private _isMounted = false;
	node = null;
	ox = 0;
	oy = 0;
	sx = 0;
	frame = 0;
	width = 0;
	movedX = false;
	refChild = null;

	state = {
		page: 'widget',
	};

	constructor (props) {
		super(props);

		this.onResizeStart = this.onResizeStart.bind(this);
		this.onResizeMove = this.onResizeMove.bind(this);
		this.onResizeEnd = this.onResizeEnd.bind(this);
		this.onHandleClick = this.onHandleClick.bind(this);
		this.onToggleClick = this.onToggleClick.bind(this);
		this.onToggleContext = this.onToggleContext.bind(this);
	};

	render() {
		const { showVault } = S.Common;
		const page = this.state.page || 'widget';
		const Component = Components[page];

		return (
			<>
				<Icon 
					id="sidebarToggle"
					className="withBackground"
					tooltipParam={{ caption: keyboard.getCaption('toggleSidebar'), typeY: I.MenuDirection.Bottom }}
					onClick={this.onToggleClick}
					onContextMenu={this.onToggleContext}
				/>

				<Sync id="sidebarSync" onClick={this.onSync} />

				<div 
					ref={node => this.node = node}
					id="sidebarLeft" 
					className="sidebar left" 
				>
					<Component ref={ref => this.refChild = ref} {...this.props} page={page} />

					<div className="resize-h" draggable={true} onDragStart={this.onResizeStart}>
						<div className="resize-handle" onClick={this.onHandleClick} />
					</div>
				</div>
			</>
		);
	};

	componentDidMount (): void {
		this._isMounted = true;
		this.init();

		sidebar.init();
	};

	componentDidUpdate (): void {
		this.init();
	};

	componentWillUnmount (): void {
		this._isMounted = false;

		Preview.tooltipHide(true);
	};

	init () {
		const { showVault } = S.Common;
		const node = $(this.node);
		const vault = $(S.Common.getRef('vault').node);

		node.toggleClass('withVault', showVault);
		vault.toggleClass('isHidden', !showVault);
	};

	setActive (id: string): void {
		if (!this._isMounted) {
			return;
		};

		const node = $(this.node);

		node.find('.item.hover').removeClass('hover');

		if (id) {
			node.find(`.item.c${id}`).addClass('hover');
		};
	};

	onResizeStart (e: React.MouseEvent) {
		e.preventDefault();
		e.stopPropagation();

		if (!this._isMounted) {
			return;
		};

		const node = $(this.node);
		const win = $(window);
		const body = $('body');
		const { left, top } = node.offset();

		this.ox = left;
		this.oy = top;
		this.sx = e.pageX;

		keyboard.disableSelection(true);
		keyboard.setResize(true);
		body.addClass('colResize');

		win.off('mousemove.sidebar mouseup.sidebar blur.sidebar');
		win.on('mousemove.sidebar', e => this.onResizeMove(e));
		win.on('mouseup.sidebar blur.sidebar', e => this.onResizeEnd());
	};

	onResizeMove (e: any) {
		if (this.frame) {
			raf.cancel(this.frame);
		};

		this.frame = raf(() => {
			if (sidebar.isAnimating) {
				return;
			};

			if (Math.abs(this.sx - e.pageX) >= 10) {
				this.movedX = true;
			};

			const w = Math.max(0, (e.pageX - this.ox));
			const d = w - this.width;

			if (d === 0) {
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
				if ((w >= 0) && (w <= J.Size.sidebar.width.close)) {
					sidebar.open(J.Size.sidebar.width.min);
				} else 
				if (w > J.Size.sidebar.width.close) {
					sidebar.setWidth(w);
				};
			};

			this.width = w;
			if (this.refChild.resize) {
				this.refChild.resize();
			};
		});
	};

	onResizeEnd () {
		keyboard.disableSelection(false);
		keyboard.setResize(false);
		raf.cancel(this.frame);

		$('body').removeClass('colResize');
		$(window).off('mousemove.sidebar mouseup.sidebar');

		window.setTimeout(() => this.movedX = false, 15);
	};

	onHandleClick () {
		if (!this.movedX) {
			this.onToggleClick();
		};
	};

	onToggleClick () {
		sidebar.toggleOpenClose();
	};

	onToggleContext () {
		U.Menu.sidebarContext('#sidebarToggle');
	};

	onSync = () => {
		S.Menu.closeAllForced(null, () => S.Menu.open('syncStatus', {
			element: '#sidebarSync',
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			data: {
				rootId: keyboard.getRootId(),
			},
		}));
	};

});

export default SidebarLeft;
