import React, { forwardRef, useEffect, useRef, useState } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { observable } from 'mobx';
import { I, C, S, U, J, Relation, translate, Dataview, keyboard, analytics, Preview, Action } from 'Lib';
import { Icon, Input, MenuItemVertical, Button } from 'Component';

const MenuDataviewRelationEdit = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { id, getId, getSize, param, close } = props;
	const { className, classNameWrap, data } = param;
	const { 
		rootId, blockId, extendedOptions, readonly, noUnlink, getView, filter, relationId, addParam, addCommand, onChange, 
		loadData, unlinkCommand,
	} = data;

	const filterRef = useRef(null);
	const buttonRef = useRef(null);
	const [ format, setFormat ] = useState<I.RelationType>(null);
	const [ objectTypes, setObjectTypes ] = useState<string[]>([]);
	const [ includeTime, setIncludeTime ] = useState<boolean>(false);

	useEffect(() => {
		const relation = getRelation();

		if (relation) {
			setFormat(relation.format);
			setObjectTypes(Relation.getArrayValue(relation.objectTypes));
			setIncludeTime(relation.includeTime);
		};

		if (filter) {
			filterRef.current?.setValue(filter);
		};

		focus();
		checkButton();
		rebind();

		return () => {
			menuClose();
			unbind();
		};

	}, []);

	useEffect(() => {
		focus();
		checkButton();
		props.position();
	});

	const rebind = () => {
		unbind();
		$(window).on('keydown.menu', e => onKeyDown(e));
	};
	
	const unbind = () => {
		$(window).off('keydown.menu');
	};

	const focus = () => {
		window.setTimeout(() => filterRef.current?.focus(), 15);
	};

	const getSections = () => {
		const relation = getRelation();

		if (!relation) {
			return [];
		};

		const viewRelation = getViewRelation();
		const object = S.Detail.get(rootId, rootId);
		const isFile = relation && (relation.format == I.RelationType.File);
		const isName = relation && (relation.relationKey == 'name');
		const isDescription = relation && (relation.relationKey == 'description');
		const canFilter = !isFile;
		const canSort = !isFile;
		const canHide = !isName;
		const canAlign = !isName; 
		const canCalculate = relation;
		const isType = U.Object.isTypeLayout(object.layout);
		
		let unlinkText = translate('commonUnlink');
		if (U.Object.isCollectionLayout(object.layout)) {
			unlinkText = translate('commonUnlinkFromCollection');
		};
		if (U.Object.isSetLayout(object.layout)) {
			unlinkText = translate('commonUnlinkFromSet');
		};
		if (isType) {
			unlinkText = translate('commonUnlinkFromType');
		};

		let canOpen = true;
		let canDuplicate = true;
		let canDelete = true;
		let canUnlink = !noUnlink && !isName;

		if (isType && isDescription) {
			canUnlink = false;
		};

		if (relation && relation.id) {
			const isAllowedRelation = S.Block.checkFlags(rootId, blockId, [ I.RestrictionDataview.Relation ]);

			canDuplicate = canDuplicate && isAllowedRelation;
			canDelete = canDelete && S.Block.isAllowed(relation.restrictions, [ I.RestrictionObject.Delete ]);

			if (isType) {
				canUnlink = canUnlink && S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Details ]);
			} else {
				canUnlink = canUnlink && isAllowedRelation;
			};
		} else {
			canOpen = false;
			canUnlink = false;
		};

		if (!relation || !relation.id || readonly) {
			canDuplicate = false;
			canDelete = false;
		};

		let sections: any[] = [
			{
				children: [
					canOpen ? { id: 'open', icon: 'expand', name: translate('commonOpenObject') } : null,
					canDuplicate ? { id: 'copy', icon: 'copy', name: translate('commonDuplicate') } : null,
					canUnlink ? { id: 'unlink', icon: 'unlink', name: unlinkText } : null,
					canDelete ? { id: 'remove', icon: 'remove', name: translate('commonMoveToBin') } : null,
				]
			}
		];

		if (extendedOptions && !readonly) {
			sections = sections.concat([
				{
					children: [
						canFilter ? { id: 'filter', icon: 'relation-filter', name: translate('menuDataviewRelationEditAddFilter') } : null,
						canSort ? { id: 'sort0', icon: 'relation-sort0', name: translate('menuDataviewRelationEditSortAscending'), type: I.SortType.Asc } : null,
						canSort ? { id: 'sort1', icon: 'relation-sort1', name: translate('menuDataviewRelationEditSortDescending'), type: I.SortType.Desc } : null,
						{ id: 'insert-left', icon: 'relation-insert-left', name: translate('menuDataviewRelationEditInsertLeft'), dir: -1 },
						{ id: 'insert-right', icon: 'relation-insert-right', name: translate('menuDataviewRelationEditInsertRight'), dir: 1 },
						canHide ? { id: 'hide', icon: 'relation-hide', name: translate('menuDataviewRelationEditHideRelation') } : null,
					]
				},
				{
					children: [
						canAlign ? { id: 'align', icon: U.Data.alignHIcon(viewRelation?.align), name: translate('commonAlign'), arrow: true } : null,
						canCalculate ? { id: 'calculate', icon: 'relation c-number', name: translate('commonCalculate'), arrow: true } : null,
					]
				},
			]);
		};

		sections = sections.map(s => {
			s.children = s.children.filter(c => c);
			return s;
		});

		sections = sections.filter(s => s.children.length);
		return sections;
	};

	const onMouseEnter = (e: any, item: any) => {
		if (!keyboard.isMouseDisabled) {
			onOver(e, item);
		};
	};

	const onOver = (e: any, item: any) => {
		if (!item.arrow) {
			menuClose();
			return;
		};

		const relation = getRelation();

		if (!relation) {
			return;
		};

		const viewRelation = getViewRelation();
		const object = S.Detail.get(rootId, rootId);

		let menuContext = null;
		let menuId = '';

		const menuParam: any = {
			menuKey: item.id,
			element: `#${getId()} #item-${item.id}`,
			vertical: I.MenuDirection.Center,
			isSub: true,
			offsetX: getSize().width,
			className,
			classNameWrap,
			onOpen: context => menuContext = context,
			rebind: rebind,
			parentId: id,
			data: {},
		};

		switch (item.id) {
			case 'align': {
				menuId = 'blockAlign';

				menuParam.data = Object.assign(menuParam.data, {
					value: viewRelation?.align,
					restricted: [ I.BlockHAlign.Justify ],
					onSelect: (align: I.BlockHAlign) => {
						saveViewRelation('align', align);
						close();
					}
				});
				break;
			};

			case 'calculate': {
				const save = (id: any) => {
					id = Number(id) || 0;

					saveViewRelation('formulaType', id);
					analytics.event('ChangeGridFormula', { type: id, format: relation.format, objectType: object.type });
				};

				menuId = 'select';
				menuParam.subIds = [ 'select2' ];
				menuParam.data = Object.assign(menuParam.data, {
					options: U.Menu.getFormulaSections(relation.relationKey),
					onOver: (e: any, item: any) => {
						if (!item.arrow) {
							S.Menu.closeAll([ 'select2' ]);
							return;
						};

						const options = Relation.formulaByType(relation.relationKey, relation.format).filter(it => it.section == item.id);

						S.Menu.closeAll([ 'select2' ], () => {
							S.Menu.open('select2', {
								component: 'select',
								element: `#${menuContext.getId()} #item-${item.id}`,
								offsetX: menuContext.getSize().width,
								vertical: I.MenuDirection.Center,
								isSub: true,
								className,
								classNameWrap,
								rebind: menuContext.getChildRef()?.rebind,
								parentId: menuContext.props.id,
								data: {
									rootId,
									options,
									onSelect: (e: any, item: any) => {
										save(item.id);
										menuContext?.close();
									},
								}
							});
						});
					},
					onSelect: (e: any, item: any) => {
						save(item.id);
					},
				});
				break;
			};
		};

		if (menuId && !S.Menu.isOpen(menuId, item.id)) {
			S.Menu.closeAll(J.Menu.relationEdit, () => {
				S.Menu.open(menuId, menuParam);
			});
		};
	};

	const onClick = (e: any, item: any) => {
		e.preventDefault();
		e.stopPropagation();

		const view = getView();
		const relation = getRelation();

		if (!relation) {
			return;
		};

		const object = S.Detail.get(rootId, rootId);
		const relations = Dataview.viewGetRelations(rootId, blockId, view);
		const idx = view.relations.findIndex(it => it && (it.relationKey == relation.relationKey));

		let needClose = true;

		switch (item.id) {
			case 'open': {
				U.Object.openConfig(null, relation);
				break;
			};

			case 'copy': {
				add({ 
					name: relation.name, 
					relationFormat: relation.format,
					relationFormatObjectTypes: relation.objectTypes || [],
					_index_: idx,
				});
				break;
			};

			case 'unlink': {
				if (unlinkCommand) {
					unlinkCommand(rootId, blockId, relation, () => close());
				} else {
					C.BlockDataviewRelationDelete(rootId, blockId, [ relation.relationKey ], () => close());
				};
				break;
			};

			case 'remove': {
				Action.archive([ relation.id ], '', () => {
					C.BlockDataviewRelationDelete(rootId, blockId, [ relation.relationKey ], () => close());
				});
				break;
			};

			case 'filter': {
				const conditions = Relation.filterConditionsByType(relation.format);
				const condition = conditions.length ? conditions[0].id : I.FilterCondition.None;
				const filter = {
					relationKey: relation.relationKey,
					condition: condition as I.FilterCondition,
					value: Relation.formatValue(relation, null, false),
				};

				C.BlockDataviewFilterAdd(rootId, blockId, view.id, filter, () => {
					S.Menu.open('dataviewFilterList', { 
						element: `#button-${blockId}-filter`,
						horizontal: I.MenuDirection.Center,
						offsetY: 10,
						onOpen: () => $(`#block-${blockId} .hoverArea`).addClass('active'),
						onClose: () => $(`#block-${blockId} .hoverArea`).removeClass('active'),
						data: {
							...data,
							view: observable.box(view),
						},
					});
				});
				break;
			};

			case 'sort0':
			case 'sort1': {
				C.BlockDataviewSortRemove(rootId, blockId, view.id, view.sorts.map(it => it.id), () => {
					C.BlockDataviewSortAdd(rootId, blockId, view.id, { 
						relationKey: relation.relationKey, 
						type: item.type,
					});
				});
				break;
			};

			case 'insert-left':
			case 'insert-right': {
				S.Menu.open('relationSuggest', { 
					element: `#${getId()} #item-${item.id}`,
					offsetX: getSize().width,
					vertical: I.MenuDirection.Center,
					noAnimation: true,
					data: {
						rootId,
						blockId,
						menuIdEdit: 'blockRelationEdit',
						filter: '',
						ref: 'dataview',
						skipKeys: relations.map(it => it.relationKey),
						addCommand: (rootId: string, blockId: string, relation: any, onChange: (message: any) => void) => {
							const index = Math.max(0, idx + item.dir);

							const cb = (message: any) => {
								S.Menu.closeAll([ id, 'relationSuggest' ]);
								loadData(view.id, 0);
								onChange?.(message);
							};

							Dataview.addTypeOrDataviewRelation(rootId, blockId, relation, object, view, index, cb);
						},
					}
				});

				needClose = false;
				break;
			};

			case 'hide': {
				saveViewRelation('isVisible', false);
				break;
			};
		};

		if (needClose) {
			close();
		};

	};

	const onRelationType = (e: any) => {
		e.preventDefault();
		e.stopPropagation();

		const relation = getViewRelation();
		
		if (relation || S.Menu.isAnimating(id)) {
			return;
		};

		menuOpen('select', { 
			element: `#${getId()} #item-relation-type`,
			data: {
				...data,
				filter: '',
				value: format,
				options: U.Menu.getRelationTypes(),
				noFilter: true,
				onSelect: (e: any, item: any) => {
					setFormat(item.id);
				},
			}
		});
	};

	const onObjectType = (e: any) => {
		e.preventDefault();
		e.stopPropagation();

		if (isReadonlyHandler() || S.Menu.isAnimating(id)) {
			return;
		};

		let relation: any = getRelation();
		if (!relation) {
			relation = { format };
		};

		menuOpen('dataviewObjectValues', { 
			element: `#${getId()} #item-object-type`,
			className: 'single',
			width: getSize().width,
			data: {
				rootId,
				nameAdd: translate('menuDataviewRelationEditAddObjectType'),
				nameCreate: translate('commonCreateObjectTypeWithName'),
				placeholderFocus: translate('menuDataviewRelationEditFilterObjectTypes'),
				canEdit: true,
				value: objectTypes, 
				types: [ S.Record.getTypeType()?.id ],
				filters: [
					{ relationKey: 'resolvedLayout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Type },
					{ relationKey: 'recommendedLayout', condition: I.FilterCondition.NotIn, value: U.Object.getSystemLayouts() },
				],
				relation: observable.box(relation),
				valueMapper: it => S.Record.getTypeById(it.id),
				onChange: (value: any, callBack?: () => void) => {
					setObjectTypes(Relation.getArrayValue(value));

					if (relation.id) {
						save();
					};

					callBack?.();
				},
			}
		});
	};

	const menuOpen = (id: string, options: I.MenuParam) => {
		options = Object.assign(options, {
			isSub: true,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Center,
			classNameWrap,
			rebind,
			parentId: props.id,
		});

		if (!S.Menu.isOpen(id)) {
			S.Menu.closeAll(J.Menu.relationEdit, () => S.Menu.open(id, options));
		};
	};

	const menuClose = () => {
		S.Menu.closeAll(J.Menu.relationEdit);
	};

	const onChangeTime = (v: boolean) => {
		const relation = getRelation();

		setIncludeTime(v);

		if (relation && relation.id) {
			save();
		};
	};

	const onSubmit = (e: any) => {
		e.preventDefault();

		if (buttonRef.current?.getColor() == 'blank') {
			return;
		};

		save();
		close();
	};

	const onChangeHandler = () => {
		checkButton();
	};

	const onKeyDown = (e: any) => {
		keyboard.shortcut('enter', e, () => onSubmit(e));
	};

	const checkButton = () => {
		const name = String(filterRef.current?.getValue() || '');
		const canSave = name.length && (format !== null) && !isReadonlyHandler();

		buttonRef.current?.setColor(canSave ? 'accent' : 'blank');
	};

	const isReadonlyHandler = () => {
		if (readonly) {
			return true;
		};

		const relation = getRelation();

		let isAllowed = true;

		if (relation) {
			isAllowed = S.Block.isAllowed(relation.restrictions, [ I.RestrictionObject.Details ]);
		};
		if (isAllowed) {
			isAllowed = S.Block.checkFlags(rootId, blockId, [ I.RestrictionDataview.Relation ]);
		};

		return !isAllowed || (relation && relation.isReadonlyRelation);
	};

	const saveViewRelation = (k: string, v: any) => {
		const relation = getViewRelation();
		const view = getView();

		if (view && relation) {
			C.BlockDataviewViewRelationReplace(rootId, blockId, view.id, relation.relationKey, { ...relation, [k]: v });
		};
	};

	const save = () => {
		const name = String(filterRef.current?.getValue() || '');
		const relation = getRelation();
		const item: any = { 
			relationFormat: format,
			relationFormatObjectTypes: Relation.isObject(format) ? Relation.getArrayValue(objectTypes) : [],
			relationFormatIncludeTime: includeTime,
		};

		if (name) {
			item.name = name;
		};

		relation && relation.id ? update(item) : add(item);
	};

	const add = (item: any) => {
		const object = S.Detail.get(rootId, rootId);

		C.ObjectCreateRelation(item, S.Common.space, (message: any) => {
			if (message.error.code) {
				return;
			};

			const { details } = message;
			
			data.relationId = details.id;
			S.Detail.update(J.Constant.subId.relation, { id: details.id, details }, false);
			addCommand?.(rootId, blockId, { ...details, _index_: item._index_ }, onChange);

			Preview.toastShow({ text: U.String.sprintf(translate('menuDataviewRelationEditToastOnCreate'), details.name) });
			analytics.event('CreateRelation', { format: item.relationFormat, type: ref, objectType: object.type });
		});
	};

	const update = (item: any) => {
		const details: any[] = [];

		for (const k in item) {
			details.push({ key: k, value: item[k] });
		};

		C.ObjectListSetDetails([ relationId ], details);
	};

	const getRelation = (): any => {
		let ret: any = null;

		if (relationId) {
			ret = S.Record.getRelationById(relationId);
		} else 
		if (addParam) {
			ret = addParam;
			ret.format = Number(ret.format) || I.RelationType.LongText;
		};

		return ret;
	};

	const getViewRelation = (): I.ViewRelation => {
		if (!getView) {
			return null;
		};

		const relation = getRelation();
		if (!relation) {
			return null;
		};

		return getView()?.getRelation(relation.relationKey);
	};

	const relation = getRelation();
	const isDate = Relation.isDate(format);
	const isObject = Relation.isObject(format);
	const isReadonly = isReadonlyHandler();
	const sections = getSections();
	const ccn = [ 'item' ];
	
	if (relation) {
		ccn.push('disabled');
	};

	let opts = null;
	let name = '';

	if (relation) {
		name = relation.name;
	};

	if (isObject && !isReadonly && (!relation || !relation.isReadonlyValue)) {
		const length = objectTypes.length;
		const typeId = length ? objectTypes[0] : '';
		const type = S.Record.getTypeById(typeId);
		const typeProps: any = { 
			name: translate('menuDataviewRelationEditSelectObjectType'),
			caption: (length > 1 ? '+' + (length - 1) : ''),
		};

		if (type) {
			typeProps.name = type.name;
			typeProps.object = type;
		};

		opts = (
			<div className="section noLine">
				<div className="name">{translate('menuDataviewRelationEditLimitObjectTypes')}</div>
				<MenuItemVertical
					id="object-type"
					onMouseEnter={onObjectType}
					onClick={onObjectType}
					arrow={!isReadonly}
					{...typeProps}
				/>
			</div>
		);
	};

	if (isDate && relation) {
		opts = (
			<div className="section">
				<MenuItemVertical 
					id="includeTime" 
					icon="clock" 
					name={translate('commonIncludeTime')}
					onMouseEnter={menuClose}
					readonly={readonly}
					withSwitch={true}
					switchValue={includeTime}
					onSwitch={(e: any, v: boolean) => onChangeTime(v)}
				/>
			</div>
		);
	};

	return (
		<form 
			className="form" 
			onSubmit={onSubmit} 
			onMouseDown={menuClose}
		>
			<div className="section">
				<div className="name">{translate('menuDataviewRelationEditRelationName')}</div>
				{!isReadonly ? (
					<div className="inputWrap">
						<Input 
							ref={filterRef} 
							value={name} 
							onChange={onChangeHandler}
							onMouseEnter={menuClose}
						/>
					</div>
				) : (
					<div className="item isReadonly">
						<Icon className="lock" />
						{relation ? relation.name : ''}
					</div>
				)}
			</div>

			<div className={[ 'section', (!opts && !isReadonly ? 'noLine' : '') ].join(' ')}>
				<div className="name">{translate('menuDataviewRelationEditRelationType')}</div>
				<MenuItemVertical 
					id="relation-type" 
					icon={format === null ? undefined : `relation ${Relation.className(format)}`} 
					name={format === null ? translate('menuDataviewRelationEditSelectRelationType') : translate(`relationName${format}`)}
					onMouseEnter={onRelationType} 
					readonly={isReadonly}
					arrow={!relation}
				/>
			</div>
			
			{opts}

			{!isReadonly ? (
				<div className="section" onMouseEnter={menuClose}>
					<div className="inputWrap">
						<Button 
							ref={buttonRef} 
							type="input" 
							text={translate(relation ? 'commonSave' : 'commonCreate')} 
							color="blank" 
							className="c28"
						/>
					</div>
				</div>
			) : ''}

			{sections.map((section: any, i: number) => (
				<div key={i} className="section">
					{section.children.map((action: any, c: number) => (
						<MenuItemVertical 
							key={c}
							{...action}
							onClick={e => onClick(e, action)} 
							onMouseEnter={e => onMouseEnter(e, action)}
						/>
					))}
				</div>
			))}
		</form>
	);

}));

export default MenuDataviewRelationEdit;