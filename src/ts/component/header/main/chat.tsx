import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, S, U, keyboard, sidebar, translate } from 'Lib';

const HeaderMainChat = observer(forwardRef<{}, I.HeaderComponent>((props, ref) => {
	const { rootId, renderLeftIcons, isPopup } = props;
	const spaceview = U.Space.getSpaceview();
	const showWidget = spaceview.isChat;
	
	const onOpen = () => {
		const object = S.Detail.get(rootId, rootId, []);

		keyboard.disableClose(true);
		S.Popup.closeAll(null, () => {
			U.Object.openRoute(object);
			keyboard.disableClose(false);
		});
	};

	const onWidget = () => {
		sidebar.rightPanelToggle(true, isPopup, 'widget', { rootId });
	};

	return (
		<>
			<div className="side left">{renderLeftIcons(true, onOpen)}</div>
			<div className="side center" />
			<div className="side right">
				{showWidget ? (
					<Icon 
						id="button-header-widget" 
						tooltipParam={{ text: translate('commonWidgets'), caption: keyboard.getCaption('widget'), typeY: I.MenuDirection.Bottom }}
						className={[ 'widgetPanel', 'withBackground' ].join(' ')}
						onClick={() => sidebar.rightPanelToggle(true, isPopup, 'widget', { rootId })} 
						onDoubleClick={e => e.stopPropagation()}
					/> 
				) : ''}
			</div>
		</>
	);

}));

export default HeaderMainChat;
