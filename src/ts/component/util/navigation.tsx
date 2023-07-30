import * as React from 'react';
import raf from 'raf';
import { Icon, IconObject } from 'Component';
import { commonStore, detailStore, blockStore, popupStore } from 'Store';
import { I, UtilObject, keyboard, Storage, UtilCommon, Preview, translate } from 'Lib';
import Constant from 'json/constant.json';

class Navigation extends React.Component {

	_isMounted = false;
	node: any = null;
	obj: any = null;
	dx = 0;
	dy = 0;
	width = 0;
	height = 0;
	frame = 0;

	constructor (props: object) {
		super(props);

		this.onBack = this.onBack.bind(this);
		this.onForward = this.onForward.bind(this);
		this.onAdd = this.onAdd.bind(this);
		this.onGraph = this.onGraph.bind(this);
		this.onSearch = this.onSearch.bind(this);
		this.onProfile = this.onProfile.bind(this);
		this.onDragStart = this.onDragStart.bind(this);
	};

	render () {
		const cmd = keyboard.cmdSymbol();
		const alt = keyboard.altSymbol();
		const profile = detailStore.get(Constant.subId.profile, blockStore.profile);
		const isWin = UtilCommon.isPlatformWindows();
		const cb = isWin ? `${alt} + ←` : `${cmd} + ←`;
		const cf = isWin ? `${alt} + →` : `${cmd} + →`;

		const buttons: any[] = [
			{ id: 'back', tooltip: translate('commonBack'), caption: cb, onClick: this.onBack, disabled: !keyboard.checkBack() },
			{ id: 'forward', tooltip: translate('commonForward'), caption: cf, onClick: this.onForward, disabled: !keyboard.checkForward() },
			{ id: 'plus', tooltip: translate('navigationCreateNew'), caption: `${cmd} + N`, onClick: this.onAdd },
			{ id: 'graph', tooltip: translate('commonGraph'), caption: `${cmd} + ${alt} + O`, onClick: this.onGraph },
			{ id: 'search', tooltip: translate('commonSearch'), caption: `${cmd} + S`, onClick: this.onSearch },
		];

		return (
			<div 
				ref={node => this.node = node}
				id="navigationPanel"
				className="navigationPanel"
			>
				<div className="inner">
					{buttons.map(item => {
						const cn = [ 'iconWrap' ];

						if (item.disabled) {
							cn.push('disabled');
						};

						return (
							<div 
								key={item.id} 
								id={`button-navigation-${item.id}`}
								onClick={item.onClick} 
								className={cn.join(' ')}
								onMouseEnter={e => item.disabled ? null : this.onTooltipShow(e, item.tooltip, item.caption)}
								onMouseLeave={e => Preview.tooltipHide(false)}
							>
								<Icon className={item.id} />
							</div>
						);
					})}

					<div className="line" />

					<div 
						className="iconWrap"
						onClick={this.onProfile}
						onMouseEnter={e => this.onTooltipShow(e, translate('commonSettings'))}
						onMouseLeave={e => Preview.tooltipHide(false)}
					>
						<IconObject object={profile} />
					</div>
				</div>
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
		this.resize();
		this.rebind();
	};

	componentDidUpdate () {
		this.resize();
	};

	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};

	unbind () {
		$(window).off('resize.navigation sidebarResize.navigation');
	};

	rebind () {
		this.unbind();

		const win = $(window);
		win.on('resize.navigation', () => this.resize());
		win.on('sidebarResize.navigation', () => this.forceUpdate());
	};

	onBack () {
		keyboard.onBack();
	};

	onForward () {
		keyboard.onForward();
	};

	onAdd () {
		keyboard.pageCreate();
	};

	onGraph () {
		UtilObject.openAuto({ id: keyboard.getRootId(), layout: I.ObjectLayout.Graph });
	};

	onSearch () {
		keyboard.onSearchPopup();
	};

	onProfile () {
		popupStore.open('settings', {});
	};

	resize () {
		if (!this._isMounted) {
			return;
		};

		const node = $(this.node);
		const coords = Storage.get('navigation') || {};
		const { ww, wh } = UtilCommon.getWindowDimensions();
		
		this.height = node.outerHeight();
		this.width = node.outerWidth();

		coords.x = Number(coords.x) || 0;
		coords.y = Number(coords.y) || 0;

		if (!coords.x) {
			const sidebar = $('#sidebar');
			const isRight = sidebar.hasClass('right');

			let sw = 0;
			if (commonStore.isSidebarFixed && sidebar.hasClass('active')) {
				sw = sidebar.outerWidth();
			};

			coords.x = (ww - sw) / 2 - this.width / 2;

			if (!isRight) {
				coords.x += sw;
			};
		};

		if (!coords.y) {
			coords.y = wh - 72;
		};
	
		this.setStyle(coords.x, coords.y);
	};

	onDragStart (e: any) {
		e.preventDefault();
		e.stopPropagation();

		const win = $(window);
		const node = $(this.node);
		const offset = node.offset();

		this.dx = e.pageX - offset.left;
		this.dy = e.pageY - offset.top;

		keyboard.disableSelection(true);
		keyboard.setDragging(true);

		win.off('mousemove.navigation mouseup.navigation');
		win.on('mousemove.navigation', e => this.onDragMove(e));
		win.on('mouseup.navigation', e => this.onDragEnd());
	};

	onDragMove (e: any) {
		const win = $(window);
		const x = e.pageX - this.dx - win.scrollLeft();
		const y = e.pageY - this.dy - win.scrollTop();
		const coords = this.checkCoords(x, y);

		this.setStyle(coords.x, coords.y);
		//Storage.set('navigation', coords);
	};

	onDragEnd () {
		keyboard.setDragging(false);
		keyboard.disableSelection(false);

		$(window).off('mousemove.navigation mouseup.navigation');
	};

	checkCoords (x: number, y: number): { x: number, y: number } {
		const { ww, wh } = UtilCommon.getWindowDimensions();

		x = Number(x) || 0;
		x = Math.floor(x);
		x = Math.max(0, x);
		x = Math.min(ww - this.width, x);

		y = Number(y) || 0;
		y = Math.floor(y);
		y = Math.max(UtilCommon.sizeHeader(), y);
		y = Math.min(wh - this.height, y);

		return { x, y };
	};

	setStyle (x: number, y: number) {
		if (this.frame) {
			raf.cancel(this.frame);
		};

		this.frame = raf(() => {
			const node = $(this.node);
			const coords = this.checkCoords(x, y);
		
			node.css({ left: coords.x, top: coords.y });
		});
	};

	onTooltipShow (e: any, text: string, caption?: string) {
		const t = Preview.tooltipCaption(text, caption);
		if (t) {
			Preview.tooltipShow({ text: t, element: $(e.currentTarget), typeY: I.MenuDirection.Top });
		};
	};
	
};

export default Navigation;
