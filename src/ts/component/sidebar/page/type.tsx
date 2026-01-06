import React, { forwardRef, useEffect, useRef } from 'react';
import { observer } from 'mobx-react';
import { Label, Button } from 'Component';
import { I, S, C, U, J, Relation, translate, sidebar, keyboard, analytics } from 'Lib';

import Section from 'Component/sidebar/section';
import SidebarLayoutPreview from 'Component/sidebar/preview';

const SidebarPageType = observer(forwardRef<{}, I.SidebarPageComponent>((props, ref) => {
	
	const { rootId, isPopup, page, previous, noPreview } = props;
	const { space } = S.Common;
	const buttonSaveRef = useRef(null);
	const previewRef = useRef(null);
	const sectionRefs = useRef(new Map());
	const objectRef = useRef<any>({});
	const updateRef = useRef<any>({});
	const backupRef = useRef<any>({});

	const getObject = () => {
		const type = getType();
		const details: any = props.details || {};
		const newType = Object.assign({
			recommendedLayout: I.ObjectLayout.Page,
			layoutAlign: I.BlockHAlign.Left,
			layoutWidth: 0,
			layoutFormat: I.LayoutFormat.Page,
			recommendedFeaturedRelations: [],
			defaultViewType: I.ViewType.Grid,
		}, details);

		return U.Common.objectCopy(details.isNew ? newType : type || newType);
	};

	const init = () => {
		objectRef.current = getObject();
		backupRef.current = U.Common.objectCopy(objectRef.current);

		updateSections();
		disableButton(true);
	};

	const disableButton = (v: boolean) => {
		$(buttonSaveRef.current?.getNode()).toggleClass('disabled', v);
	};

	const getType = () => {
		const type = S.Record.getTypeById(rootId);
		if (!type) {
			return null;
		};

		const isList = U.Object.isInSetLayouts(type.recommendedLayout);

		return Object.assign(type, { layoutFormat: isList ? I.LayoutFormat.List : I.LayoutFormat.Page });
	};

	const getSections = () => {
		const type = S.Record.getTypeById(rootId);
		
		let isFile = false;
		let isTemplate = false;
		let canShowTemplates = false;

		if (type) {
			isFile = U.Object.isInFileLayouts(type.recommendedLayout);
			isTemplate = U.Object.isTemplateType(rootId);
			canShowTemplates = !U.Object.getLayoutsWithoutTemplates().includes(type.recommendedLayout) && !isTemplate;
		};

		return [
			{ id: 'title', component: 'type/title' },
			{ id: 'plural', component: 'type/title' },
			!isFile ? { id: 'layout', component: 'type/layout' } : null,
			canShowTemplates ? { id: 'template', component: 'type/template' } : null,
			{ id: 'relation', component: 'type/relation' },
		].filter(it => it);
	};

	const onChange = (update: any) => {
		const skipFormat = [ 'defaultTypeId', 'iconImage' ];

		for (const relationKey in update) {
			if (skipFormat.includes(relationKey)) {
				continue;
			};

			switch (relationKey) {
				case 'headerRelationsLayout': {
					update[relationKey] = Number(update[relationKey]);
					break;
				};

				default: {
					const relation = S.Record.getRelationByKey(relationKey);
					update[relationKey] = Relation.formatValue(relation, update[relationKey], true);
					break;
				};
			};
		};

		objectRef.current = Object.assign(objectRef.current, update);
		updateRef.current = Object.assign(updateRef.current, update);

		const { recommendedLayout, layoutAlign } = updateRef.current;

		S.Detail.update(J.Constant.subId.type, { id: objectRef.current.id, details: updateRef.current }, false);

		if ((undefined !== recommendedLayout) && !U.Object.isTypeLayout(objectRef.current.layout)) {
			updateLayout(recommendedLayout);
		};

		updateSections();
		disableButton(!U.Common.objectLength(updateRef.current) || (!objectRef.current.name && !objectRef.current.pluralName));

		if (objectRef.current.id) {
			C.BlockDataviewRelationSet(objectRef.current.id, J.Constant.blockId.dataview, [ 'name', 'description' ].concat(U.Object.getTypeRelationKeys(objectRef.current.id)));
		};

		let eventId = '';
		if (undefined !== recommendedLayout) {
			eventId = 'ChangeRecommendedLayout';
		} else
		if (undefined !== layoutAlign) {
			eventId = 'SetLayoutAlign';
		};
		if (eventId) {
			analytics.stackAdd(eventId, { route: analytics.route.type });
		};
	};

	const updateLayout = (layout: I.ObjectLayout) => {
		const details = props.details || {};

		if (details.isNew) {
			return;
		};

		const rootId = keyboard.getRootId();
		const current = S.Detail.get(rootId, rootId);

		S.Block.update(rootId, rootId, { layout });

		if (!current._empty_) {
			S.Detail.update(rootId, { id: rootId, details: { resolvedLayout: layout } }, false);
		};
	};

	const onSave = () => {
		const details: any = props.details || {};
		const type = S.Record.getTypeType();

		if (!type || !U.Common.objectLength(updateRef.current) || (!objectRef.current.name && !objectRef.current.pluralName)) {
			return;
		};

		if (rootId) {
			const update = [];

			for (const key in updateRef.current) {
				if ([ 'layoutFormat', 'isNew', 'data' ].includes(key)) {
					continue;
				};

				const value = Relation.formatValue(S.Record.getRelationByKey(key), updateRef.current[key], true);
				update.push({ key, value });
			};

			if (update.length) {
				C.ObjectListSetDetails([ rootId ], update, () => {
					C.BlockDataviewRelationSet(rootId, J.Constant.blockId.dataview, [ 'name', 'description' ].concat(U.Object.getTypeRelationKeys(rootId)));
				});

				if (previous && previous.page) {
					S.Common.setRightSidebarState(isPopup, previous);
				} else {
					close();
				};
			};
		} else {
			C.ObjectCreate(objectRef.current, [], '', type.uniqueKey, space, (message) => {
				if (!message.error.code) {
					const route = details.data && details.data.route ? details.data.route : '';
					const format = I.LayoutFormat[objectRef.current.layoutFormat];

					U.Object.openRoute(message.details);
					S.Common.getRef('sidebarLeft')?.getComponentRef()?.refFilter?.setValue('');

					analytics.event('CreateObject', { objectType: J.Constant.typeKey.type, route, format });
				};
			});

			close();
		};

		updateRef.current = {};

		analytics.event('ClickSaveEditType', { objectType: rootId });
		analytics.stackSend();
	};

	const onCancel = () => {
		restore();

		if (previous && previous.page) {
			S.Common.setRightSidebarState(isPopup, previous);
		} else {
			close();
		};
	};

	const restore = () => {
		if (!U.Common.objectLength(updateRef.current)) {
			return;
		};

		const rootId = keyboard.getRootId();

		S.Detail.update(J.Constant.subId.type, { id: backupRef.current.id, details: backupRef.current }, false);

		if ((rootId != backupRef.current.id) && !U.Object.isTypeLayout(backupRef.current.layout)) {
			updateLayout(backupRef.current.recommendedLayout);
		};
	};

	const close = () => {
		if (!noPreview) {
			previewRef.current?.show(false);
		};

		sidebar.rightPanelToggle(isPopup, { page });
	};

	const updateSections = () => {
		const sections = getSections();

		sections.forEach(it => {
			sectionRefs.current.get(it.id)?.setObject(objectRef.current);
		});

		previewRef.current?.update(objectRef.current);
	};

	const type = getType();
	const sections = getSections();
	const readonly = props.readonly || !S.Block.isAllowed(type?.restrictions, [ I.RestrictionObject.Details ]);

	useEffect(() => {
		init();

		window.setTimeout(() => previewRef.current?.show(true), J.Constant.delay.sidebar);
		analytics.event('ScreenEditType', { route: noPreview ? analytics.route.object : analytics.route.type });

		return () => {
			restore();
			analytics.stackClear();
		};

	}, []);

	useEffect(() => {
		init();
	}, [ rootId ]);

	return (
		<>
			<div id="head" className="head">
				<div className="side left" />
				<div className="side center">
					<Label text={translate('sidebarTypeTitle')} />
				</div>

				<div className="side right">
					<Button 
						color="blank" 
						text={translate('commonCancel')}
						className="c28"
						onClick={onCancel}
					/>

					<Button 
						ref={buttonSaveRef} 
						text={type ? translate('commonSave') : translate('commonCreate')}
						className="c28 disabled"
						onClick={onSave}
					/>
				</div>
			</div>

			<div id="body" className="body">
				{sections.map((item, i) => (
					<Section 
						{...props} 
						ref={ref => sectionRefs.current.set(item.id, ref)}
						key={item.id} 
						id={item.id}
						component={item.component}
						object={getObject()} 
						withState={true}
						onChange={onChange}
						disableButton={disableButton}
						readonly={readonly}
					/>
				))}
			</div>

			{!noPreview ? <SidebarLayoutPreview {...props} ref={previewRef} /> : ''}
		</>
	);

}));

export default SidebarPageType;