import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, C, S, U, J, keyboard, Preview, translate, analytics } from 'Lib';

const Navigation = observer(class Navigation extends React.Component {

	_isMounted = false;
	node: any = null;
	timeoutPlus = 0;

	constructor (props: object) {
		super(props);

		this.onBack = this.onBack.bind(this);
		this.onForward = this.onForward.bind(this);
		this.onAdd = this.onAdd.bind(this);
		this.onGraph = this.onGraph.bind(this);
		this.onSearch = this.onSearch.bind(this);
	};

	render () {
		const { navigationMenu } = S.Common;
		const cmd = keyboard.cmdSymbol();
		const alt = keyboard.altSymbol();
		const isWin = U.Common.isPlatformWindows();
		const isLinux = U.Common.isPlatformLinux();
		const cb = isWin || isLinux ? `${alt} + ←` : `${cmd} + [`;
		const cf = isWin || isLinux ? `${alt} + →` : `${cmd} + ]`;
		const canWrite = U.Space.canMyParticipantWrite();

		let buttonPlus: any = null;
		if (canWrite) {
			buttonPlus = { id: 'plus', tooltip: translate('commonCreateNewObject'), caption: `${cmd} + N / ${cmd} + ${alt} + N` };

			switch (navigationMenu) {
				case I.NavigationMenuMode.Context: {
					buttonPlus.onClick = this.onAdd;
					buttonPlus.onContextMenu = () => keyboard.onQuickCapture(false);
					break;
				};

				case I.NavigationMenuMode.Click: {
					buttonPlus.onClick = () => keyboard.onQuickCapture(false);
					break;
				};

				case I.NavigationMenuMode.Hover: {
					buttonPlus.onClick = this.onAdd;
					buttonPlus.onMouseEnter = e => {
						window.clearTimeout(this.timeoutPlus);
						this.timeoutPlus = window.setTimeout(() => {
							keyboard.onQuickCapture(false, { isSub: true, passThrough: false });
						}, 1000);
					};
					buttonPlus.onMouseLeave = () => {};
					break;
				};

			};

		};

		const buttons: any[] = [
			{ id: 'back', tooltip: translate('commonBack'), caption: cb, onClick: this.onBack, disabled: !keyboard.checkBack() },
			{ id: 'forward', tooltip: translate('commonForward'), caption: cf, onClick: this.onForward, disabled: !keyboard.checkForward() },
			buttonPlus,
			{ id: 'graph', tooltip: translate('commonGraph'), caption: `${cmd} + ${alt} + O`, onClick: this.onGraph },
			{ id: 'search', tooltip: translate('commonSearch'), caption: `${cmd} + S`, onClick: this.onSearch },
		].filter(it => it).map(it => {
			if (!it.onMouseEnter && !it.disabled) {
				it.onMouseEnter = e => this.onTooltipShow(e, it.tooltip, it.caption);
			};
			if (!it.onMouseLeave) {
				it.onMouseLeave = () => Preview.tooltipHide(false);
			};
			return it;
		});

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
								className={cn.join(' ')}
								onClick={e => {
									window.clearTimeout(this.timeoutPlus);
									item.onClick(e);
								}}
								onContextMenu={item.onContextMenu}
								onMouseEnter={item.onMouseEnter}
								onMouseLeave={item.onMouseLeave}
							>
								<Icon className={item.id} />
							</div>
						);
					})}
				</div>
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
	};

	componentDidUpdate () {
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	onBack () {
		keyboard.onBack();
	};

	onForward () {
		keyboard.onForward();
	};

	onAdd (e: any) {
		e.altKey ? keyboard.onQuickCapture(false) : keyboard.pageCreate({}, analytics.route.navigation);
	};

	onGraph () {
		U.Object.openAuto({ id: keyboard.getRootId(), layout: I.ObjectLayout.Graph });
	};

	onSearch () {
		keyboard.onSearchPopup(analytics.route.navigation);
	};

	position (sw: number, animate: boolean) {
		const node = $(this.node);
		const { ww } = U.Common.getWindowDimensions();
		const width = node.outerWidth();
		const x = (ww - sw) / 2 - width / 2 + sw;

		if (animate) {
			node.addClass('sidebarAnimation');
		};

		node.css({ left: `${x / ww * 100}%` });

		if (animate) {
			window.setTimeout(() => node.removeClass('sidebarAnimation'), J.Constant.delay.sidebar);
		};
	};

	onTooltipShow (e: any, text: string, caption?: string) {
		const t = Preview.tooltipCaption(text, caption);
		if (t) {
			Preview.tooltipShow({ text: t, element: $(e.currentTarget), typeY: I.MenuDirection.Top });
		};
	};
	
});

export default Navigation;
