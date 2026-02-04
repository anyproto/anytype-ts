import React, { forwardRef, useState, useImperativeHandle } from 'react';
import { observer } from 'mobx-react';
import { Icon, IconObject, ObjectName, HeaderBanner } from 'Component';
import { I, S, U, J, keyboard, sidebar, translate, analytics, Action } from 'Lib';

const HeaderMainChat = observer(forwardRef<{}, I.HeaderComponent>((props, ref) => {

	const { rootId, isPopup, onSearch, menuOpen, renderLeftIcons } = props;
	const [ dummy, setDummy ] = useState(0);
	const spaceview = U.Space.getSpaceview();
	const canWrite = U.Space.canMyParticipantWrite();
	const rightSidebar = S.Common.getRightSidebarState(isPopup);
	const hasWidget = !!S.Block.getWidgetsForTarget(rootId).length;
	const isSearchMenuOpen = S.Menu.isOpenList([ 'searchText', 'searchChat' ]);
	const cnc = [ 'side', 'center' ];
	
	if (isSearchMenuOpen) {
		cnc.push('withSearch');
	};

	let object = null;
	if (spaceview.isChat || spaceview.isOneToOne) {
		object = spaceview;
	} else {
		object = S.Detail.get(rootId, rootId, []);
	};

	const isDeleted = object._empty_ || object.isDeleted;
	const showPin = canWrite && !spaceview.isChat && !spaceview.isOneToOne;
	const bannerProps = { type: I.BannerType.None, isPopup, object };

	if (object.isArchived) {
		bannerProps.type = I.BannerType.IsArchived;
	};

	const onPin = () => {
		Action.toggleWidgetsForObject(rootId, analytics.route.header);
	};

	const onOpen = () => {
		const object = S.Detail.get(rootId, rootId, []);

		keyboard.disableClose(true);
		S.Popup.closeAll(null, () => {
			U.Object.openRoute(object);
			keyboard.disableClose(false);
		});
	};

	const onMore = () => {
		const element = '#button-header-more';

		if (spaceview.isChat || spaceview.isOneToOne) {
			U.Menu.spaceContext(spaceview, {
				element: U.Common.getScrollContainer(isPopup).find(`.header ${element}`),
				className: 'fixed',
				classNameWrap: 'fromHeader',
				horizontal: I.MenuDirection.Right,
				offsetY: 4,
			}, { 
				noManage: true,
				withSearch: true,
				route: analytics.route.header,
			});
		} else {
			menuOpen('object', element, {
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
	};

	let center = null;
	if (!isDeleted) {
		if (bannerProps.type == I.BannerType.None) {
			center = (
				<div className="path" onClick={onSearch}>
					<IconObject object={object} size={18} />
					<ObjectName object={object} withPlural={true} />
				</div>
			);
		} else {
			center = <HeaderBanner {...bannerProps} />;
		};
	};

	useImperativeHandle(ref, () => ({
		forceUpdate: () => setDummy(dummy + 1),
	}));

	return (
		<>
			<div className="side left">{renderLeftIcons(!spaceview.isChat, !spaceview.isChat && !spaceview.isOneToOne, onOpen)}</div>

			<div className={cnc.join(' ')}>
				{center}
			</div>

			<div className="side right">
				<Icon 
					id="button-header-search" 
					tooltipParam={{ text: translate('commonSearch'), caption: keyboard.getCaption('searchText'), typeY: I.MenuDirection.Bottom }}
					className="search withBackground"
					onClick={() => keyboard.onSearchText('',  analytics.route.header)} 
					onDoubleClick={e => e.stopPropagation()}
				/> 

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
			</div>
		</>
	);

}));

export default HeaderMainChat;