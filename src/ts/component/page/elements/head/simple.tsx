import React, { forwardRef, useEffect, useRef, useImperativeHandle, useState } from 'react';
import { observer } from 'mobx-react';
import { IconObject, Block, Button, Editable, Icon } from 'Component';
import { I, M, S, U, J, C, focus, keyboard, Relation, translate, analytics, Dataview, sidebar } from 'Lib';

interface Props {
	rootId: string;
	placeholder?: string;
	isContextMenuDisabled?: boolean;
	readonly?: boolean;
	noIcon?: boolean;
	relationKey?: string;
	isPopup?: boolean;
	onCreate?: () => void;
	getDotMap?: (start: number, end: number, callback: (res: Map<string, boolean>) => void) => void;
};

interface PropsRef {
	forceUpdate: () => void;
	getNode: () => any;
};

const EDITORS = [ 
	{ relationKey: 'name', blockId: 'title' }, 
	{ relationKey: 'description', blockId: 'description' },
];

const SUB_ID_CHECK = 'headSimple-check';

const HeadSimple = observer(forwardRef<PropsRef, Props>((props, ref) => {

	const { rootId, isContextMenuDisabled, readonly, noIcon, isPopup, relationKey, getDotMap } = props;
	const check = U.Data.checkDetails(rootId, '', []);
	const object = S.Detail.get(rootId, rootId, [ 
		'layout', 'spaceId', 'featuredRelations', 'recommendedLayout', 'pluralName', 'iconName', 'iconOption', 'iconEmoji', 'iconImage',
		'done', 'fileExt', 'fileMimeType', 'relationFormat',
	], true);
	const [ dummy, setDummy ] = useState(0);
	const nodeRef = useRef(null);
	const editableRef = useRef({});
	const timeout = useRef(0);
	const featuredRelations = Relation.getArrayValue(object.featuredRelations);
	const allowDetails = !readonly && S.Block.checkFlags(rootId, rootId, [ I.RestrictionObject.Details ]);
	const canWrite = U.Space.canMyParticipantWrite();
	const blockFeatured: any = new M.Block({ id: 'featuredRelations', type: I.BlockType.Featured, childrenIds: [], fields: {}, content: {} });
	const isTypeOrRelation = U.Object.isTypeOrRelationLayout(check.layout);
	const isType = U.Object.isTypeLayout(check.layout);
	const isDate = U.Object.isDateLayout(check.layout);
	const isRelation = U.Object.isRelationLayout(check.layout);
	const cn = [ 'headSimple', check.className ];
	const canEditIcon = allowDetails && !isRelation && !isType;
	const isOwner = U.Space.isMyOwner();
	const total = S.Record.getMeta(SUB_ID_CHECK, '').total;
	const placeholder = {
		title: String(props.placeholder || ''),
		description: translate('commonDescription'),
	};
	const buttons = [];

	const init = () => {
		const { focused } = focus.state;
		const object = S.Detail.get(rootId, rootId, [ 'name' ], true);

		setValue();

		if (!focused && !object._empty_ && (object.name == translate('defaultNamePage'))) {
			focus.set('title', { from: 0, to: 0 });
		};

		window.setTimeout(() => focus.apply(), 10);
	};

	const onFocus = (e: any, item: any) => {
		editableRef.current[item.id]?.placeholderCheck();
	};

	const onBlur = (e: any, item: any) => {
		window.clearTimeout(timeout.current);
		save();
	};

	const onKeyDown = (e: any, item: any) => {
		if (item.id == 'title') {
			keyboard.shortcut('enter', e, () => e.preventDefault());
		};
	};

	const onKeyUp = () => {
		window.clearTimeout(timeout.current);
		timeout.current = window.setTimeout(() => save(), J.Constant.delay.keyboard);
	};

	const onSelectText = (e: any, item: any) => {
		focus.set(item.id, getRange(item.id));
	};

	const onCompositionStart = (e: any) => {
		window.clearTimeout(timeout.current);
	};

	const save = () => {
		for (const item of EDITORS) {
			U.Data.blockSetText(rootId, item.blockId, getValue(item.blockId), [], true);
		};
	};

	const getRange = (id: string): I.TextRange => {
		return editableRef.current[id]?.getRange();
	};

	const getValue = (id: string): string => {
		const value = String(editableRef.current[id]?.getTextValue() || '');
		return U.Common.stripTags(value);
	};

	const setValue = () => {
		const { dateFormat } = S.Common;
		const object = S.Detail.get(rootId, rootId, []);

		for (const item of EDITORS) {
			if (!editableRef.current[item.blockId]) {
				continue;
			};

			let text = String(object[item.relationKey] || '');

			if (U.Object.isDateLayout(object.layout) && object.timestamp) {
				text = U.Date.dateWithFormat(dateFormat, object.timestamp);
			};

			if ((item.blockId == J.Constant.blockId.title) && U.Object.isTypeLayout(object.layout)) {
				text = object.pluralName || object.name;
			};

			if ([ translate('defaultNamePage'), Dataview.namePlaceholder(object.layout) ].includes(text)) {
				text = '';
			};

			editableRef.current[item.blockId].setValue(text);
			editableRef.current[item.blockId].placeholderCheck();
		};
	};

	const onTemplates = () => {
		const object = S.Detail.get(rootId, rootId);

		S.Menu.open('dataviewTemplateList', {
			element: '.headSimple #button-template',
			horizontal: I.MenuDirection.Center,
			subIds: J.Menu.dataviewTemplate.concat([ 'dataviewTemplateContext' ]),
			data: {
				withTypeSelect: false,
				typeId: object.id,
				previewSize: I.PreviewSize.Small,
				templateId: object.defaultTemplateId,
				onSetDefault: id => {
					S.Menu.updateData('dataviewTemplateList', { templateId: id });
					U.Object.setDefaultTemplateId(rootId, id);
				},
				onSelect: item => {
					if (item.id == J.Constant.templateId.new) {
						onTemplateAdd();
					} else {
						U.Object.openPopup(item);
					};
				},
			}
		});

		analytics.event('ScreenTypeTemplateSelector');
	};

	const onTemplateAdd = () => {
		const object = S.Detail.get(rootId, rootId);
		const details: any = {
			targetObjectType: object.id,
			layout: object.recommendedLayout,
		};

		C.ObjectCreate(details, [], '', J.Constant.typeKey.template, S.Common.space, (message) => {
			if (message.error.code) {
				return;
			};

			const newObject = message.details;

			if (!object.defaultTemplateId) {
				U.Object.setDefaultTemplateId(object.id, newObject.id);
			};

			analytics.event('CreateTemplate', { objectType: object.type, route: analytics.route.screenType });
			U.Object.openConfig(object);
		});
	};

	const onCalendar = () => {
		const object = S.Detail.get(rootId, rootId);

		S.Menu.open('calendar', {
			element: '#calendar-icon',
			horizontal: I.MenuDirection.Center,
			data: {
				value: object.timestamp,
				canEdit: true,
				canClear: false,
				relationKey,
				onChange: (value: number) => U.Object.openDateByTimestamp(relationKey, value),
				getDotMap,
			},
		});

		analytics.event('ClickDateCalendarView');
	};

	const changeDate = (dir: number) => {
		const object = S.Detail.get(rootId, rootId);

		U.Object.openDateByTimestamp(relationKey, object.timestamp + dir * 86400);
		analytics.event(dir > 0 ? 'ClickDateForward' : 'ClickDateBack');
	};

	const onLayout = () => {
		S.Menu.open('select', {
			element: '.headSimple #button-layout',
			horizontal: I.MenuDirection.Center,
			className: 'menuTypeLayout',
			data: {
				sections: [
					{
						name: translate('menuTypeLayoutDescription'),
						children: [ 
							{ isDiv: true },
							{ id: 'reset', icon: 'reset', name: translate('menuTypeLayoutReset') },
						]
					}
				],
				noVirtualisation: true,
				onSelect: () => {
					S.Popup.open('confirm', {
						data: {
							title: translate('popupConfirmTypeLayoutResetTitle'),
							text: translate('popupConfirmTypeLayoutResetText'),
							textConfirm: translate('commonReset'),
							colorConfirm: 'red',
							colorCancel: 'blank',
							onConfirm: () => {
								C.ObjectTypeResolveLayoutConflicts(rootId);
								analytics.event('ResetToTypeDefault', { route: analytics.route.type });
							},
						}
					});
				},
			}
		});
	};

	let buttonLayout = null;
	let buttonEdit = null;
	let buttonTemplate = null;
	let buttonCreate = null;
	let descr = null;
	let featured = null;

	if (!allowDetails) {
		cn.push('isReadonly');
	};

	const Editor = (item: any) => (
		<Editable
			ref={ref => editableRef.current[item.id] = ref}
			id={`editor-${item.id}`}
			placeholder={placeholder[item.id]}
			readonly={item.readonly}
			classNameWrap={item.className}
			classNameEditor={[ 'focusable', 'c' + item.id ].join(' ')}
			classNamePlaceholder={'c' + item.id}
			onFocus={e => onFocus(e, item)}
			onBlur={e => onBlur(e, item)}
			onKeyDown={e => onKeyDown(e, item)}
			onKeyUp={() => onKeyUp()}
			onSelect={e => onSelectText(e, item)}
			onCompositionStart={onCompositionStart}
		/>
	);

	if (!isRelation && featuredRelations.includes('description')) {
		descr = <Editor className="descr" id="description" readonly={!allowDetails} />;
	};

	if (!isDate && !isTypeOrRelation) {
		featured = (
			<Block 
				{...props} 
				key={blockFeatured.id} 
				rootId={rootId} 
				iconSize={20} 
				block={blockFeatured} 
				className="small" 
				isSelectionDisabled={true}
				readonly={!allowDetails}
				isContextMenuDisabled={isContextMenuDisabled}
			/>
		);
	};

	if (isTypeOrRelation) {
		if (isType) {
			const isTemplate = U.Object.isTemplateType(object.id);
			const canShowTemplates = !U.Object.getLayoutsWithoutTemplates().includes(object.recommendedLayout) && !isTemplate;
			const allowEdit = allowDetails && !isTemplate && !U.Object.isParticipantLayout(object.recommendedLayout);
			const allowedReset = allowEdit && !U.Object.isChatLayout(object.recommendedLayout);

			if (isOwner && total && allowedReset) {
				buttonLayout = (
					<Button
						id="button-layout"
						color="blank"
						className="c28 resetLayout"
						onClick={onLayout}
					/>
				);
			};

			if (canShowTemplates) {
				buttonTemplate = (
					<Button 
						id="button-template" 
						text={translate('commonTemplates')} 
						color="blank" 
						className="c28" 
						onClick={onTemplates} 
					/>
				);
			};

			if (allowEdit) {
				buttonEdit = (
					<Button 
						id="button-edit" 
						color="blank" 
						className="c28" 
						text={translate('commonEditType')} 
						onClick={() => sidebar.rightPanelToggle(true, isPopup, 'type', { rootId })}
					/>
				);
			};
		};

		if (!canWrite) {
			buttonCreate = null;
			buttonEdit = null;
		};
	};

	if (isDate) {
		buttonCreate = (
			<>
				<Icon className="arrow left withBackground" onClick={() => changeDate(-1)} />
				<Icon className="arrow right withBackground" onClick={() => changeDate(1)}/>
				<Icon id="calendar-icon" className="calendar withBackground" onClick={onCalendar} />
			</>
		);
	};

	if (buttonLayout) {
		buttons.push(() => buttonLayout);
	};
	if (buttonTemplate) {
		buttons.push(() => buttonTemplate);
	};
	if (buttonEdit) {
		buttons.push(() => buttonEdit);
	};
	if (buttonCreate) {
		buttons.push(() => buttonCreate);
	};

	useEffect(() => {
		init();

		const object = S.Detail.get(rootId, rootId, [ 'layout' ], true);
		const isType = U.Object.isTypeLayout(object.layout);

		if (isType) {
			U.Subscription.subscribe({
				subId: SUB_ID_CHECK,
				filters: [
					{ relationKey: 'type', condition: I.FilterCondition.Equal, value: object.id },
				],
				keys: [ 'id' ],
				limit: 1,
			});
		};

		return () => {
			U.Subscription.destroyList([ SUB_ID_CHECK ]);
			focus.clear(true);
			window.clearTimeout(timeout.current);
		};

	}, []);

	useEffect(() => {
		init();
	});

	useImperativeHandle(ref, () => ({
		forceUpdate: () => setDummy(dummy + 1),
		getNode: () => nodeRef.current,
	}));

	if (object._empty_) {
		return null;
	};

	return (
		<div ref={nodeRef} className={cn.join(' ')}>
			<div className="sides">
				<div className="side left">
					<div className="titleWrap">
						{!noIcon && check.withIcon ? (
							<IconObject 
								id={`block-icon-${rootId}`} 
								size={32} 
								iconSize={32}
								object={object} 
								canEdit={canEditIcon}
							/>
						) : ''}
						<Editor className="title" id="title" readonly={isType || !allowDetails} />
					</div>
				</div>

				{buttons.length ? (
					<div className="side right">
						{buttons.map((Component, i) => <Component key={i} />)}
					</div>
				) : ''}
			</div>
			{descr}
			{featured}
		</div>
	);

}));

export default HeadSimple;