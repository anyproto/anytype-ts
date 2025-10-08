import React, { forwardRef, useState, useImperativeHandle } from 'react';
import { observer } from 'mobx-react';
import { Icon, IconObject, ObjectName } from 'Component';
import { I, S, U, J, keyboard, sidebar, translate, analytics, Action } from 'Lib';

const HeaderMainChat = observer(forwardRef<{}, I.HeaderComponent>((props, ref) => {

	const { rootId, isPopup, menuOpen, renderLeftIcons } = props;
	const [ dummy, setDummy ] = useState(0);
	const spaceview = U.Space.getSpaceview();
	const canWrite = U.Space.canMyParticipantWrite();
	const rightSidebar = S.Common.getRightSidebarState(isPopup);
	const hasWidget = !!S.Block.getWidgetsForTarget(rootId, I.WidgetSection.Pin).length;

	let object = null;
	if (rootId == S.Block.workspace) {
		object = spaceview;
	} else {
		object = S.Detail.get(rootId, rootId, []);
	};

	const isDeleted = object._empty_ || object.isDeleted;
	const readonly = object.isArchived;
	const showRelations = !isDeleted;
	const showPin = canWrite;
	const showWidget = !isPopup && spaceview.isChat && !rightSidebar.isOpen;

	const onPin = () => {
		Action.toggleWidgetsForObject(rootId, analytics.route.header);
	};

	const onRelation = () => {
		sidebar.rightPanelToggle(true, isPopup, 'object/relation', { rootId, readonly });
	};
	
	const onOpen = () => {
		const object = S.Detail.get(rootId, rootId, []);

		keyboard.disableClose(true);
		S.Popup.closeAll(null, () => {
			U.Object.openRoute(object);
			keyboard.disableClose(false);
		});
	};

	const onClick = () => {
		if (spaceview.isChat) {
			sidebar.rightPanelToggle(true, isPopup, 'widget', { rootId });
		} else {
			U.Object.openAuto({ id: 'spaceIndex', layout: I.ObjectLayout.Settings });
		};
	};

	const onMore = () => {
		menuOpen('object', '#button-header-more', {
			horizontal: I.MenuDirection.Right,
			subIds: J.Menu.object,
			data: {
				rootId,
				blockId: rootId,
				blockIds: [ rootId ],
				isPopup,
			}
		});
	};

	useImperativeHandle(ref, () => ({
		forceUpdate: () => setDummy(dummy + 1),
	}));

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

				{showRelations ? (
					<Icon 
						id="button-header-relation" 
						tooltipParam={{ text: translate('commonRelations'), caption: keyboard.getCaption('relation'), typeY: I.MenuDirection.Bottom }}
						className={[ 'relation', 'withBackground', (rightSidebar.page == 'object/relation' ? 'active' : '') ].join(' ')}
						onClick={onRelation} 
						onDoubleClick={e => e.stopPropagation()}
					/> 
				) : ''}

				{showPin ? (
					<Icon 
						id="button-header-pin" 
						tooltipParam={{ 
							text: hasWidget ? translate('commonRemovePinned') : translate('commonAddPinned'), 
							caption: keyboard.getCaption('addFavorite'), 
							typeY: I.MenuDirection.Bottom,
						}}
						className={[ (hasWidget ? 'unpin' : 'pin'), 'withBackground' ].join(' ')}
						onClick={onPin}
						onDoubleClick={e => e.stopPropagation()}
					/> 
				) : ''}

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
						tooltipParam={{ text: translate('commonWidgets'), caption: keyboard.getCaption('chatPanel'), typeY: I.MenuDirection.Bottom }}
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