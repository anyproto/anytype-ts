import React, { forwardRef, useState, useEffect, useImperativeHandle } from 'react';
import { observer } from 'mobx-react';
import { Icon, IconObject, ObjectName, Label } from 'Component';
import { I, S, U, J, keyboard, translate } from 'Lib';
import HeaderBanner from 'Component/page/elements/head/banner';

const HeaderMainObject = observer(forwardRef<{}, I.HeaderComponent>((props, ref) => {

	const { rootId, match, isPopup, onSearch, onTooltipShow, onTooltipHide, renderLeftIcons, onRelation, menuOpen } = props;
	const [ templatesCnt, setTemplateCnt ] = useState(0);
	const [ dummy, setDummy ] = useState(0);
	const root = S.Block.getLeaf(rootId, rootId);
	const object = S.Detail.get(rootId, rootId, J.Relation.template);
	const isLocked = root ? root.isLocked() : false;
	const isTypeOrRelation = U.Object.isTypeOrRelationLayout(object.layout);
	const isDate = U.Object.isDateLayout(object.layout);
	const showRelations = !isTypeOrRelation && !isDate;
	const showMenu = !isTypeOrRelation;
	const cmd = keyboard.cmdSymbol();
	const allowedTemplateSelect = (object.internalFlags || []).includes(I.ObjectFlag.SelectTemplate);
	const bannerProps = { type: I.BannerType.None, isPopup, object, count: 0 };

	let center = null;
	let locked = '';

	if (object.isArchived) {
		bannerProps.type = I.BannerType.IsArchived;
	} else
	if (U.Object.isTemplate(object.type)) {
		bannerProps.type = I.BannerType.IsTemplate;
	} else
	if (allowedTemplateSelect && templatesCnt) {
		bannerProps.type = I.BannerType.TemplateSelect;
		bannerProps.count = templatesCnt + 1;
	};

	if (isLocked) {
		locked = translate('headerObjectLocked');
	} else
	if (U.Object.isTypeOrRelationLayout(object.layout) && !S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Delete ])) {
		locked = translate('commonSystem');
	};

	if (bannerProps.type == I.BannerType.None) {
		center = (
			<div
				id="path"
				className="path"
				onClick={onSearch}
				onMouseOver={e => onTooltipShow(e, translate('headerTooltipPath'))}
				onMouseOut={onTooltipHide}
			>
				<div className="inner">
					<IconObject object={object} size={18} />
					<ObjectName object={object} />
					{locked ? <Label text={locked} className="lock" /> : ''}
				</div>
			</div>
		);
	} else {
		center = <HeaderBanner {...bannerProps} />;
	};

	const onOpen = () => {
		const object = S.Detail.get(rootId, rootId, []);

		keyboard.disableClose(true);
		S.Popup.closeAll(null, () => U.Object.openRoute(object));
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

	const onRelationHandler = () => {
		const object = S.Detail.get(rootId, rootId, [ 'isArchived' ]);

		onRelation({}, { readonly: object.isArchived });
	};

	const updateTemplatesCnt = () => {
		const object = S.Detail.get(rootId, rootId, [ 'internalFlags' ]);
		const allowedTemplateSelect = (object.internalFlags || []).includes(I.ObjectFlag.SelectTemplate);

		if (!allowedTemplateSelect || !object.type) {
			return;
		};

		U.Data.getTemplatesByTypeId(object.type, (message: any) => {
			if (message.error.code) {
				return;
			};

			if (message.records.length != templatesCnt) {
				setTemplateCnt(message.records.length);
			};
		});
	};

	useEffect(() => {
		updateTemplatesCnt();
	});

	useImperativeHandle(ref, () => ({
		forceUpdate: () => setDummy(dummy + 1),
	}));

	return (
		<>
			<div className="side left">
				{renderLeftIcons(onOpen)}
			</div>

			<div className="side center">
				{center}
			</div>

			<div className="side right">
				{showRelations ? (
					<Icon 
						id="button-header-relation" 
						tooltip={translate('commonRelations')}
						tooltipCaption={`${cmd} + Shift + R`}
						className="relation withBackground"
						onClick={onRelationHandler} 
					/> 
				) : ''}

				{showMenu ? (
					<Icon 
						id="button-header-more"
						tooltip={translate('commonMenu')}
						className="more withBackground"
						onClick={onMore} 
					/> 
				) : ''}
			</div>
		</>
	);

}));

export default HeaderMainObject;