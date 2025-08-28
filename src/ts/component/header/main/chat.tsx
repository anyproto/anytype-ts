import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { Icon, IconObject, ObjectName } from 'Component';
import { I, S, U, keyboard, sidebar, translate, analytics } from 'Lib';

const HeaderMainChat = observer(forwardRef<{}, I.HeaderComponent>((props, ref) => {
	const { rootId, renderLeftIcons, isPopup } = props;
	const spaceview = U.Space.getSpaceview();
	const rightSidebar = S.Common.getRightSidebarState(isPopup);
	
	const onOpen = () => {
		const object = S.Detail.get(rootId, rootId, []);

		keyboard.disableClose(true);
		S.Popup.closeAll(null, () => {
			U.Object.openRoute(object);
			keyboard.disableClose(false);
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
				<div className="path">
					<IconObject object={object} size={18} />
					<ObjectName object={object} withPlural={true} />
				</div>
			</div>
			<div className="side right">
				{spaceview.isChat ? (
					<Icon 
						id="button-header-widget" 
						tooltipParam={{ text: translate('commonWidgets'), caption: keyboard.getCaption('widget'), typeY: I.MenuDirection.Bottom }}
						className={[ 'widgetPanel', 'withBackground', (rightSidebar.page == 'widget' ? 'active' : '') ].join(' ')}
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
