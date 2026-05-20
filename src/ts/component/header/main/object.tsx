import React, { forwardRef, useState, useEffect, useImperativeHandle } from 'react';
import { Icon, IconObject, ObjectName, Label, HeaderBanner } from 'Component';
import * as I from 'Interface';

const HeaderMainObject = forwardRef<{}, I.HeaderComponent>((props, ref) => {

	const { rootId, isPopup, onSearch, onTooltipShow, onTooltipHide, renderLeftIcons, menuOpen } = props;
	const [ templatesCnt, setTemplateCnt ] = useState(0);
	const [ dummy, setDummy ] = useState(0);
	const rightSidebar = S.Common.getRightSidebarState(isPopup);
	const canWrite = U.Space.canMyParticipantWrite();
	const root = S.Block.getLeaf(rootId, rootId);
	const object = S.Detail.get(rootId, rootId, J.Relation.template);
	const isDeleted = object._empty_ || object.isDeleted;
	const isLocked = root ? root.isLocked() : false;
	const isTypeOrRelation = U.Object.isTypeOrRelationLayout(object.layout);
	const isRelation = U.Object.isRelationLayout(object.layout);
	const isDate = U.Object.isDateLayout(object.layout);
	const isTemplate = U.Object.isTemplateType(object.type);
	const showShare = S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Publish ], true) && !isDeleted && !object.isArchived;
	const showRelations = !isTypeOrRelation && !isDate && !isDeleted;
	const showMenu = !isDeleted;
	const showPin = false; //canWrite && !isRelation && !isTemplate && U.Space.isMyOwner();
	const showFavorite = canWrite && !isRelation && !isTemplate;
	const isFavorite = !!S.Block.getWidgetsForTargetIn(rootId, U.Object.getPersonalWidgetsId()).length;
	const allowedTemplateSelect = (object.internalFlags || []).includes(I.ObjectFlag.SelectTemplate);
	const bannerProps = { type: I.BannerType.None, isPopup, object, count: 0 };
	const readonly = object.isArchived || isLocked;
	const hasWidget = !!S.Block.getWidgetsForTarget(rootId).length;
	const isRelationOpen = (rightSidebar.page == 'object/relation');
	const isSearchMenuOpen = S.Menu.isOpenList([ 'searchText', 'searchChat' ]);
	const cnc = [ 'side', 'center' ];

	if (isSearchMenuOpen) {
		cnc.push('withSearch');
	};

	let center = null;
	let label = '';

	if (object.isArchived) {
		bannerProps.type = I.BannerType.IsArchived;
	} else
	if (U.Object.isTemplateType(object.type)) {
		bannerProps.type = I.BannerType.IsTemplate;
	} else
	if (allowedTemplateSelect && (templatesCnt > 1)) {
		bannerProps.type = I.BannerType.TemplateSelect;
		bannerProps.count = templatesCnt;
	};

	if (isLocked) {
		label = translate('headerObjectLocked');
	} else
	if (U.Object.isTypeOrRelationLayout(object.layout) && !S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Delete ], true)) {
		label = translate('commonSystem');
	};

	if (!isDeleted) {
		if (bannerProps.type == I.BannerType.None) {
			center = (
				<div
					className="path"
					onClick={onSearch}
					onMouseEnter={e => onTooltipShow(e, translate('headerTooltipPath'))}
					onMouseLeave={onTooltipHide}
				>
					<IconObject object={object} size={18} />
					<ObjectName object={object} withPlural={true} />
					{label ? <Label text={label} iconParam={isLocked ? { name: 'common/lock', width: 8, height: 12 } : undefined} /> : ''}
				</div>
			);
		} else {
			center = <HeaderBanner {...bannerProps} />;
		};
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

	const onShare = () => {
		menuOpen('publish', '#button-header-share', {
			horizontal: I.MenuDirection.Right,
			data: {
				rootId,
			}
		});

		analytics.event('ClickShareObject', { objectType: object.type });
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

	const updateTemplatesCnt = () => {
		if (!allowedTemplateSelect) {
			return;
		};

		U.Data.countTemplatesByTypeId(object.type, (message: any) => {
			if (message.error.code) {
				return;
			};

			if (message.records.length != templatesCnt) {
				setTemplateCnt(message.records.length);
			};
		});
	};

	useEffect(() => updateTemplatesCnt(), []);
	useEffect(() => updateTemplatesCnt(), [ object.type ]);

	useImperativeHandle(ref, () => ({
		forceUpdate: () => setDummy(dummy + 1),
	}));

	return (
		<>
			<div className="side left">
				{renderLeftIcons(true, true, onOpen)}
			</div>

			<div className={cnc.join(' ')}>
				{center}
			</div>

			<div className="side right">
				{showShare ? (
					<Label
						id="button-header-share"
						text={translate('commonShare')}
						className="btn"
						onClick={onShare}
						onDoubleClick={e => e.stopPropagation()}
					/>
				) : ''}

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
						name="header/relation" className={isRelationOpen ? 'active' : ''} withBackground={true}
						onClick={onRelation}
						onDoubleClick={e => e.stopPropagation()}
					/>
				) : ''}

				{showMenu ? (
					<Icon
						id="button-header-more"
						tooltipParam={{ text: translate('commonMenu'), typeY: I.MenuDirection.Bottom }}
						name="common/more" withBackground={true}
						onClick={onMore}
						onDoubleClick={e => e.stopPropagation()}
					/>
				) : ''}
			</div>
		</>
	);

});

export default HeaderMainObject;
