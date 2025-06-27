import React, { forwardRef, useState, useEffect, useImperativeHandle, useRef } from 'react';
import { observer } from 'mobx-react';
import { Button, Icon, IconObject, ObjectName, Label } from 'Component';
import { I, S, U, J, keyboard, translate, analytics, Action } from 'Lib';
import HeaderBanner from 'Component/page/elements/head/banner';

const HeaderMainObject = observer(forwardRef<{}, I.HeaderComponent>((props, ref) => {

	const { rootId, match, isPopup, onSearch, onTooltipShow, onTooltipHide, renderLeftIcons, onRelation, menuOpen } = props;
	const [ templatesCnt, setTemplateCnt ] = useState(0);
	const [ dummy, setDummy ] = useState(0);
	const rightSidebar = S.Common.getShowSidebarRight(isPopup);
	const canWrite = U.Space.canMyParticipantWrite();
	const root = S.Block.getLeaf(rootId, rootId);
	const object = S.Detail.get(rootId, rootId, J.Relation.template);
	const isDeleted = object._empty_ || object.isDeleted;
	const isLocked = root ? root.isLocked() : false;
	const isRelation = U.Object.isRelationLayout(object.layout);
	const isTypeOrRelation = U.Object.isTypeOrRelationLayout(object.layout);
	const isDate = U.Object.isDateLayout(object.layout);
	const showShare = S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Publish ], true) && !isDeleted;
	const showRelations = !isTypeOrRelation && !isDate && !isDeleted;
	const showMenu = !isRelation && !isDeleted;
	const showPin = canWrite && !isRelation;
	const allowedTemplateSelect = (object.internalFlags || []).includes(I.ObjectFlag.SelectTemplate);
	const bannerProps = { type: I.BannerType.None, isPopup, object, count: 0 };

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
				match,
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
		Action.setIsFavorite([ rootId ], !object.isFavorite, analytics.route.header);
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
				{renderLeftIcons(true, onOpen)}
			</div>

			<div className="side center">
				{center}
			</div>

			<div className="side right">
				{showShare ? (
					<Button 
						id="button-header-share" 
						text={translate('commonShare')} 
						color="blank" 
						className="c28" 
						onClick={onShare}
					/> 
				) : ''}

				{showRelations ? (
					<Icon 
						id="button-header-relation" 
						tooltipParam={{ text: translate('commonRelations'), caption: keyboard.getCaption('relation'), typeY: I.MenuDirection.Bottom }}
						className={[ 'relation', 'withBackground', (rightSidebar == 'object/relation' ? 'active' : '') ].join(' ')}
						onClick={() => onRelation({ readonly: object.isArchived || root.isLocked() })} 
						onDoubleClick={e => e.stopPropagation()}
					/> 
				) : ''}

				{showPin ? (
					<Icon 
						id="button-header-pin" 
						tooltipParam={{ 
							text: object.isFavorite ? translate('commonRemovePinned') : translate('commonAddPinned'), 
							caption: keyboard.getCaption('addFavorite'), 
							typeY: I.MenuDirection.Bottom,
						}}
						className={[ (object.isFavorite ? 'unpin' : 'pin'), 'withBackground' ].join(' ')}
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
