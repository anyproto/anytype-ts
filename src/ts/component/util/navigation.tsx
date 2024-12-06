import React, { forwardRef, useRef, useImperativeHandle } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, S, U, J, keyboard, Preview, translate, analytics } from 'Lib';

interface NavigationRefProps {
	position: (sw: number, animate: boolean) => void;
};

const Navigation = observer(forwardRef<NavigationRefProps>((_, ref) => {
	const nodeRef = useRef(null);
	const timeoutPlus = useRef(0);
	const { navigationMenu } = S.Common;
	const cmd = keyboard.cmdSymbol();
	const alt = keyboard.altSymbol();
	const isWin = U.Common.isPlatformWindows();
	const isLinux = U.Common.isPlatformLinux();
	const cb = isWin || isLinux ? `${alt} + ←` : `${cmd} + [`;
	const cf = isWin || isLinux ? `${alt} + →` : `${cmd} + ]`;
	const canWrite = U.Space.canMyParticipantWrite();

	const onBack = () => {
		keyboard.onBack();
	};

	const onForward = () => {
		keyboard.onForward();
	};

	const onAdd = (e: any) => {
		e.altKey ? keyboard.onQuickCapture(false) : keyboard.pageCreate({}, analytics.route.navigation);
	};

	const onGraph = () => {
		U.Object.openAuto({ id: keyboard.getRootId(), layout: I.ObjectLayout.Graph });
	};

	const onSearch = () => {
		keyboard.onSearchPopup(analytics.route.navigation);
	};

	const position = (sidebarWidth: number, animate: boolean) => {
		const node = $(nodeRef.current);
		const { ww } = U.Common.getWindowDimensions();
		const width = node.outerWidth();
		const x = (ww - sidebarWidth) / 2 - width / 2 + sidebarWidth;

		if (animate) {
			node.addClass('sidebarAnimation');
		};

		node.css({ left: `${x / ww * 100}%` });

		if (animate) {
			window.setTimeout(() => node.removeClass('sidebarAnimation'), J.Constant.delay.sidebar);
		};
	};

	const onTooltipShow = (e: any, text: string, caption?: string) => {
		const t = Preview.tooltipCaption(text, caption);
		if (t) {
			Preview.tooltipShow({ text: t, element: $(e.currentTarget), typeY: I.MenuDirection.Top });
		};
	};

	let buttonPlus: any = null;
	if (canWrite) {
		buttonPlus = { id: 'plus', tooltip: translate('commonCreateNewObject'), caption: `${cmd} + N / ${cmd} + ${alt} + N` };

		switch (navigationMenu) {
			case I.NavigationMenuMode.Context: {
				buttonPlus.onClick = onAdd;
				buttonPlus.onContextMenu = () => keyboard.onQuickCapture(false);
				break;
			};

			case I.NavigationMenuMode.Click: {
				buttonPlus.onClick = () => keyboard.onQuickCapture(false);
				break;
			};

			case I.NavigationMenuMode.Hover: {
				buttonPlus.onClick = onAdd;
				buttonPlus.onMouseEnter = e => {
					window.clearTimeout(timeoutPlus.current);
					timeoutPlus.current = window.setTimeout(() => {
						keyboard.onQuickCapture(false, { isSub: true, passThrough: false });
					}, 1000);
				};
				buttonPlus.onMouseLeave = () => window.clearTimeout(timeoutPlus.current);
				break;
			};

		};
	};

	const buttons: any[] = [
		{ id: 'back', tooltip: translate('commonBack'), caption: cb, onClick: onBack, disabled: !keyboard.checkBack() },
		{ id: 'forward', tooltip: translate('commonForward'), caption: cf, onClick: onForward, disabled: !keyboard.checkForward() },
		buttonPlus,
		{ id: 'graph', tooltip: translate('commonGraph'), caption: `${cmd} + ${alt} + O`, onClick: onGraph },
		{ id: 'search', tooltip: translate('commonSearch'), caption: `${cmd} + S`, onClick: onSearch },
	].filter(it => it).map(it => {
		if (!it.onMouseEnter && !it.disabled) {
			it.onMouseEnter = e => {
				window.clearTimeout(timeoutPlus.current);
				onTooltipShow(e, it.tooltip, it.caption);
			};
		};
		if (!it.onMouseLeave) {
			it.onMouseLeave = () => Preview.tooltipHide(false);
		};
		return it;
	});

	useImperativeHandle(ref, () => ({
		position,
	}));

	return (
		<div 
			ref={nodeRef}
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
								window.clearTimeout(timeoutPlus.current);
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

}));

export default Navigation;