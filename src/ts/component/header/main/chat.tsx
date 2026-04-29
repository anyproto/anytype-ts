import React, { forwardRef, useState, useImperativeHandle } from 'react';
import { Icon, IconObject, ObjectName, HeaderBanner } from 'Component';
import * as I from 'Interface';

const HeaderMainChat = forwardRef<{}, I.HeaderComponent>((props, ref) => {

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
	if (spaceview.isOneToOne) {
		object = spaceview;
	} else {
		object = S.Detail.get(rootId, rootId, []);
	};

	const isDeleted = object._empty_ || object.isDeleted;
	const readonly = object.isArchived;
	const showRelations = !isDeleted && !spaceview.isOneToOne;
	const showPin = false; //canWrite && !spaceview.isOneToOne && U.Space.isMyOwner();
	const showFavorite = canWrite && !spaceview.isOneToOne;
	const isFavorite = !!S.Block.getWidgetsForTargetIn(rootId, U.Object.getPersonalWidgetsId()).length;
	const bannerProps = { type: I.BannerType.None, isPopup, object };

	if (object.isArchived) {
		bannerProps.type = I.BannerType.IsArchived;
	};

	const onRelation = () => {
		sidebar.rightPanelToggle(isPopup, { page: 'object/relation', rootId, readonly });
	};

	const onPin = () => {
		Action.toggleWidgetsForObject(rootId, analytics.route.header);
	};

	const onFavorite = () => {
		Action.togglePersonalWidgetsForObject(rootId, analytics.route.header);
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

		if (spaceview.isOneToOne) {
			U.Menu.spaceContext(spaceview, {
				element: U.Dom.select(`.header ${element}`, U.Dom.getScrollContainer(isPopup)),
				className: 'fixed',
				classNameWrap: 'fromHeader',
				horizontal: I.MenuDirection.Right,
				offsetY: 4,
			}, { 
				noManage: true,
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
			<div className="side left">{renderLeftIcons(!spaceview.isOneToOne, !spaceview.isOneToOne, onOpen)}</div>

			<div className={cnc.join(' ')}>
				{center}
			</div>

			<div className="side right">
				<Icon
					id="button-header-search"
					tooltipParam={{ text: translate('commonSearch'), caption: keyboard.getCaption('searchText'), typeY: I.MenuDirection.Bottom }}
					name="header/search" withBackground={true}
					onClick={() => keyboard.onSearchText('', analytics.route.header)}
					onDoubleClick={e => e.stopPropagation()}
				/>

				{showFavorite ? (
					<Icon
						id="button-header-favorite"
						tooltipParam={{
							text: translate(isFavorite ? 'menuWidgetUnfavorite' : 'menuWidgetFavorite'),
							typeY: I.MenuDirection.Bottom,
						}}
						name={isFavorite ? 'menu/action/unfav' : 'menu/action/fav'} withBackground={true}
						onClick={onFavorite}
						onDoubleClick={e => e.stopPropagation()}
					/>
				) : ''}

				{showPin ? (
					<Icon
						id="button-header-pin"
						tooltipParam={{
							text: translate(hasWidget ? 'menuWidgetUnpinFromChannel' : 'menuWidgetPinToChannel'),
							caption: keyboard.getCaption('addFavorite'),
							typeY: I.MenuDirection.Bottom,
						}}
						name={hasWidget ? 'header/pin1' : 'header/pin0'} withBackground={true}
						onClick={onPin}
						onDoubleClick={e => e.stopPropagation()}
					/>
				) : ''}

				{showRelations ? (
					<Icon
						id="button-header-relation"
						tooltipParam={{ text: translate('commonRelations'), caption: keyboard.getCaption('relation'), typeY: I.MenuDirection.Bottom }}
						name="header/relation" className={rightSidebar.page == 'object/relation' ? 'active' : ''} withBackground={true}
						onClick={onRelation}
						onDoubleClick={e => e.stopPropagation()}
					/>
				) : ''}

				<Icon
					id="button-header-more"
					tooltipParam={{ text: translate('commonMenu'), typeY: I.MenuDirection.Bottom }}
					name="common/more" withBackground={true}
					onClick={onMore}
					onDoubleClick={e => e.stopPropagation()}
				/>
			</div>
		</>
	);

});

export default HeaderMainChat;