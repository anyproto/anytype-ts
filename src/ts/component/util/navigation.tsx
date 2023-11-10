import * as React from 'react';
import raf from 'raf';
import { Icon, IconObject } from 'Component';
import { commonStore, menuStore } from 'Store';
import { I, UtilObject, keyboard, Storage, UtilCommon, Preview, translate } from 'Lib';

class Navigation extends React.Component {

	_isMounted = false;
	node: any = null;

	constructor (props: object) {
		super(props);

		this.onBack = this.onBack.bind(this);
		this.onForward = this.onForward.bind(this);
		this.onAdd = this.onAdd.bind(this);
		this.onGraph = this.onGraph.bind(this);
		this.onSearch = this.onSearch.bind(this);
		this.onProfile = this.onProfile.bind(this);
	};

	render () {
		const cmd = keyboard.cmdSymbol();
		const alt = keyboard.altSymbol();
		const profile = UtilObject.getProfile();
		const isWin = UtilCommon.isPlatformWindows();
		const isLinux = UtilCommon.isPlatformLinux();
		const cb = isWin || isLinux ? `${alt} + ←` : `${cmd} + [`;
		const cf = isWin || isLinux ? `${alt} + →` : `${cmd} + ]`;

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
						id="button-navigation-profile"
						className="iconWrap"
						onClick={this.onProfile}
						onMouseEnter={e => this.onTooltipShow(e, translate('navigationAccount'), 'Ctrl + Tab')}
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
		keyboard.pageCreate('Navigation');
	};

	onGraph () {
		UtilObject.openAuto({ id: keyboard.getRootId(), layout: I.ObjectLayout.Graph });
	};

	onSearch () {
		keyboard.onSearchPopup();
	};

	onProfile () {
		if (menuStore.isOpen('space')) {
			menuStore.close('space');
		} else {
			keyboard.onSpaceMenu(false);
		};
	};

	resize () {
		if (!this._isMounted) {
			return;
		};

		const win = $(window);
		const node = $(this.node);
		const { ww } = UtilCommon.getWindowDimensions();
		const width = node.outerWidth();
		const sidebar = $('#sidebar');
		const isRight = sidebar.hasClass('right');

		let sw = 0;
		if (commonStore.isSidebarFixed && sidebar.hasClass('active')) {
			sw = sidebar.outerWidth();
		};

		let x = (ww - sw) / 2 - width / 2;
		if (!isRight) {
			x += sw;
		};
		node.css({ left: x });
		win.trigger('resize.menuSpace');
	};

	onTooltipShow (e: any, text: string, caption?: string) {
		const t = Preview.tooltipCaption(text, caption);
		if (t) {
			Preview.tooltipShow({ text: t, element: $(e.currentTarget), typeY: I.MenuDirection.Top });
		};
	};
	
};

export default Navigation;
