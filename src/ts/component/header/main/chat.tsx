import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { Icon, IconObject, ObjectName } from 'Component';
import { I, S, U, keyboard, sidebar, translate, analytics } from 'Lib';

const HeaderMainChat = observer(forwardRef<{}, I.HeaderComponent>((props, ref) => {

	const { rootId, renderLeftIcons, isPopup } = props;
	const spaceview = U.Space.getSpaceview();
	const rightSidebar = S.Common.getRightSidebarState(isPopup);
	const showWidget = !isPopup && spaceview.isChat && !rightSidebar.isOpen;
	
	const onOpen = () => {
		const object = S.Detail.get(rootId, rootId, []);

		keyboard.disableClose(true);
		S.Popup.closeAll(null, () => {
			U.Object.openRoute(object);
			keyboard.disableClose(false);
		});
	};

	const onClick = () => {
		U.Object.openAuto({ id: 'spaceIndex', layout: I.ObjectLayout.Settings });
	};

	const onMore = () => {
		const element = $('#button-header-more');
		const st = $(window).scrollTop();

		const menuParam: I.MenuParam = {
			element: '#button-header-more',
			horizontal: I.MenuDirection.Right,
			offsetY: 4,
		};

		if (!isPopup) {
			menuParam.fixedY = element.offset().top + element.height() - st + 4;
			menuParam.classNameWrap = 'fixed fromHeader';
		};

		U.Menu.spaceContext(spaceview, menuParam, { 
			noPin: true, 
			noDivider: true,
			route: analytics.route.chat
		});
	};

	let object = null;
	if (rootId == S.Block.workspace) {
		object = spaceview;
	} else {
		object = S.Detail.get(rootId, rootId, []);
	};

	return (
		<>
			<div className="side left">{renderLeftIcons(false, false, onOpen)}</div>
			<div className="side center">
				<div className="path" onClick={onClick}>
					<IconObject object={object} size={18} />
					<ObjectName object={object} withPlural={true} />
				</div>
			</div>
			<div className="side right">
				<Icon 
					id="button-header-invite"
					tooltipParam={{ text: translate('pageSettingsSpaceIndexAddMembers'), typeY: I.MenuDirection.Bottom }}
					className="invite withBackground"
					onClick={() => U.Object.openRoute({ id: 'spaceShare', layout: I.ObjectLayout.Settings })}
					onDoubleClick={e => e.stopPropagation()}
				/>

				<Icon 
					id="button-header-more"
					tooltipParam={{ text: translate('commonMenu'), typeY: I.MenuDirection.Bottom }}
					className="more withBackground"
					onClick={onMore} 
					onDoubleClick={e => e.stopPropagation()}
				/>
				{showWidget ? (
					<Icon 
						id="button-header-widget" 
						tooltipParam={{ text: translate('commonWidgets'), caption: keyboard.getCaption('widget'), typeY: I.MenuDirection.Bottom }}
						className="widgetPanel withBackground"
						onClick={() => {
							sidebar.rightPanelToggle(true, isPopup, 'widget', { rootId });
							analytics.event('ScreenChatSidebar');
						}} 
						onDoubleClick={e => e.stopPropagation()}
					/> 
				) : ''}
			</div>
		</>
	);

}));

export default HeaderMainChat;