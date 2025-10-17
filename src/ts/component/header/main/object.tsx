import React, { forwardRef, useState, useEffect, useImperativeHandle } from 'react';
import { observer } from 'mobx-react';
import { Icon, IconObject, ObjectName, Label, HeaderBanner } from 'Component';
import { I, S, U, J, keyboard, translate, analytics, Action, sidebar } from 'Lib';

const HeaderMainObject = observer(forwardRef<{}, I.HeaderComponent>((props, ref) => {

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
	const showPin = canWrite && !isRelation && !isTemplate;
	const allowedTemplateSelect = (object.internalFlags || []).includes(I.ObjectFlag.SelectTemplate);
	const bannerProps = { type: I.BannerType.None, isPopup, object, count: 0 };
	const readonly = object.isArchived || isLocked;
	const hasWidget = !!S.Block.getWidgetsForTarget(rootId, I.WidgetSection.Pin).length;

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
					onMouseOver={e => onTooltipShow(e, translate('headerTooltipPath'))}
					onMouseOut={onTooltipHide}
				>
					<IconObject object={object} size={18} />
					<ObjectName object={object} withPlural={true} />
					{label ? <Label text={label} /> : ''}
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

	const onPin = () => {
		Action.toggleWidgetsForObject(rootId, analytics.route.header);
	};

	const onRelation = () => {
		sidebar.rightPanelToggle(true, isPopup, 'object/relation', { rootId, readonly });
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

			<div className="side center">
				{center}
			</div>

			<div className="side right">
				{showShare ? (
					<Icon 
						id="button-header-share" 
						tooltipParam={{ text: translate('commonShare'), typeY: I.MenuDirection.Bottom }}
						className={[ 'share', 'withBackground' ].join(' ')}
						onClick={onShare} 
						onDoubleClick={e => e.stopPropagation()}
					/> 
				) : ''}

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

				{showMenu ? (
					<Icon 
						id="button-header-more"
						tooltipParam={{ text: translate('commonMenu'), typeY: I.MenuDirection.Bottom }}
						className="more withBackground"
						onClick={onMore} 
						onDoubleClick={e => e.stopPropagation()}
					/> 
				) : ''}
			</div>
		</>
	);

}));

export default HeaderMainObject;
