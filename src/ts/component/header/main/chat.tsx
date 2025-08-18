import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, S, U, keyboard, sidebar, translate } from 'Lib';

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

	return (
		<>
			<div className="side left">{renderLeftIcons(!spaceview.isChat, onOpen)}</div>
			<div className="side center" />
			<div className="side right">
				{spaceview.isChat && !isPopup ? (
					<Icon 
						id="button-header-widget" 
						tooltipParam={{ text: translate('commonWidgets'), caption: keyboard.getCaption('widget'), typeY: I.MenuDirection.Bottom }}
						className={[ 'widgetPanel', 'withBackground', (rightSidebar.page == 'widget' ? 'active' : '') ].join(' ')}
						onClick={() => sidebar.rightPanelToggle(true, isPopup, 'widget', { rootId })} 
						onDoubleClick={e => e.stopPropagation()}
					/> 
				) : ''}
			</div>
		</>
	);

}));

export default HeaderMainChat;
