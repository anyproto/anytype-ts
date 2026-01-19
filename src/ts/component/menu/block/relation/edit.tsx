import React, { forwardRef, useRef, useState, useEffect } from 'react';
import $ from 'jquery';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import { I, C, S, U, J, analytics, Preview, translate, keyboard, Relation, Action } from 'Lib';
import { Input, MenuItemVertical, Button, Icon } from 'Component';

const MenuBlockRelationEdit = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, position, getId, getSize, close } = props;
	const { data, classNameWrap } = param;
	const { 
		rootId, blockId, readonly, noDelete, noUnlink, filter, relationId, addParam, addCommand, deleteCommand, 
		onChange, route, saveCommand,
	} = data;
	const filterRef = useRef(null);
	const buttonRef = useRef(null);
	const [ format, setFormat ] = useState<I.RelationType>(null);
	const [ objectTypes, setObjectTypes ] = useState<string[]>([]);
	const [ includeTime, setIncludeTime ] = useState(false);

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

		checkButton();
		focus();
		rebind();

		return () => {
			menuClose();
			unbind();
		};

	}, []);

	useEffect(() => {
		checkButton();
		focus();
		position();
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

	const checkButton = () => {
		const name = String(filterRef.current?.getValue() || '');
		const canSave = name.length && (format !== null) && !isReadonlyHandler();

		buttonRef.current?.setColor(canSave ? 'accent' : 'blank');
	};

	const onRelationType = (e: any) => {
		e.preventDefault();
		e.stopPropagation();

		const relation = getRelation();

		if ((relation && relation.id) || S.Menu.isAnimating(props.id)) {
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
				onSelect: (e: any, item: any) => setFormat(item.id),
			}
		});
	};

	const onObjectType = (e: any) => {
		e.preventDefault();
		e.stopPropagation();

		const type = S.Record.getTypeType();

		if (!type || S.Menu.isAnimating(props.id)) {
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
			vertical: I.MenuDirection.Center,
			data: {
				rootId,
				canEdit: !isReadonlyHandler(),
				nameAdd: translate('menuBlockRelationEditAddObjectType'),
				nameCreate: translate('commonCreateObjectTypeWithName'),
				addParam: {
					details: { type: type.id }
				},
				placeholderFocus: translate('menuBlockRelationEditFilterObjectTypes'),
				value: objectTypes, 
				types: [ type.id ],
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

	const onKeyDown = (e: any) => {
		keyboard.shortcut('enter', e, () => onSubmit(e));
	};

	const onChangeTime = (v: boolean) => {
		const relation = getRelation();

		setIncludeTime(v);

		if (relation && relation.id) {
			save();
		};
	};

	const menuOpen = (id: string, options: I.MenuParam) => {
		options = Object.assign(options, {
			isSub: true,
			passThrough: true,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Center,
			classNameWrap,
			rebind,
			parentId: props.id,
		});

		if (!S.Menu.isOpen(id) && !S.Menu.isAnimating(id)) {
			S.Menu.closeAll(J.Menu.relationEdit, () => {
				S.Menu.open(id, options);
			});
		};
	};

	const menuClose = () => {
		S.Menu.closeAll(J.Menu.relationEdit);
	};

	const onOpen = (e: any) => {
		close();
		U.Object.openEvent(e, getRelation());
	};

	const onCopy = () => {
		const relation = getRelation();
		if (!relation || !relation.id) {
			return;
		};

		add({ 
			name: relation?.name, 
			relationFormat: relation.format,
			relationFormatObjectTypes: Relation.isObject(relation.format) ? Relation.getArrayValue(relation.objectTypes) : [],
			relationFormatIncludeTime: includeTime,
		});

		close();
		analytics.event('DuplicateRelation');
	};

	const onUnlink = () => {
		const relation = getRelation();

		deleteCommand?.();
		close();

		if (relation) {
			analytics.event('DeleteRelation', relation);
		};
	};

	const onRemove = () => {
		const relation = getRelation();
		if (!relation || !relation.id) {
			return;
		};

		Action.archive([ relation.id ], '', () => {
			deleteCommand?.();
			close();
		});
	};

	const onSubmit = (e: any) => {
		e.preventDefault();

		if (buttonRef.current?.getColor() == 'blank') {
			return;
		};

		save();
		close();
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
		
		const object = S.Detail.get(rootId, rootId, [ 'type' ], true);

		C.ObjectCreateRelation(item, S.Common.space, (message: any) => {
			if (message.error.code) {
				return;
			};

			const { details } = message;
			
			data.relationId = details.id;
			S.Detail.update(J.Constant.subId.relation, { id: details.id, details }, false);
			addCommand?.(rootId, blockId, details, onChange);

			Preview.toastShow({ text: U.String.sprintf(translate('menuBlockRelationEditToastOnCreate'), details.name) });
			analytics.event('CreateRelation', { format: item.relationFormat, type: data.ref, objectType: object.type, route });
		});
	};

	const update = (item: any) => {
		const details: any[] = [];

		for (const k in item) {
			details.push({ key: k, value: item[k] });
		};

		C.ObjectListSetDetails([ relationId ], details, saveCommand);
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

	const isReadonlyHandler = () => {
		const relation = getRelation();
		const root = S.Block.getLeaf(rootId, rootId);

		let isAllowed = !root?.isLocked();
		if (relation && relation.id) {
			isAllowed = isAllowed && S.Block.isAllowed(relation.restrictions, [ I.RestrictionObject.Details ]);
		};
		if (isAllowed && root) {
			isAllowed = isAllowed && S.Block.checkFlags(rootId, rootId, [ I.RestrictionObject.Relation ]);
		};
		return readonly || !isAllowed || relation?.isReadonlyRelation;
	};

	const relation = getRelation();
	const root = S.Block.getLeaf(rootId, rootId);
	const isReadonly = isReadonlyHandler();
	const object = S.Detail.get(rootId, rootId);
	const isType = U.Object.isTypeLayout(object.layout);
	const isName = relation && (relation.relationKey == 'name');
	const isDescription = relation && (relation.relationKey == 'description');
	const isDate = Relation.isDate(format);
	const isObject = Relation.isObject(format);

	let canDuplicate = true;
	let canDelete = !noDelete;
	let canUnlink = !noUnlink && !isName;
	let opts: any = null;
	let unlinkText = '';
	let name = '';

	if (relation) {
		name = relation.name;
	};

	if (readonly) {	
		canDuplicate = canDelete = false;
	} else
	if (root) {
		if (root.isLocked() || !S.Block.checkFlags(rootId, rootId, [ I.RestrictionObject.Relation ])) {
			canDuplicate = canDelete = false;
		};
	};

	if (relation) {
		canDelete = relation ? S.Block.isAllowed(relation.restrictions, [ I.RestrictionObject.Delete ]) : false;
	};

	switch (data.ref) {
		case 'type':
			unlinkText = translate('commonUnlinkFromType');
			break;

		case 'object':
			unlinkText = translate('commonUnlinkFromObject');
			break;
	};

	canUnlink = canUnlink && !!unlinkText;

	if (isType && isDescription) {
		canUnlink = false;
	};

	if (isObject && !isReadonly && (!relation || !relation.isReadonlyValue)) {
		const length = objectTypes.length;
		const typeId = length ? objectTypes[0] : '';
		const type = S.Record.getTypeById(typeId);
		const typeProps: any = { 
			name: translate('menuBlockRelationEditSelectObjectType'),
			caption: (length > 1 ? `+${length - 1}` : ''),
		};

		if (type) {
			typeProps.name = type.name;
			typeProps.object = type;
		};

		opts = (
			<div className="section noLine">
				<div className="name">{translate('menuBlockRelationEditLimitObjectTypes')}</div>
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
				<div className="name">{translate('menuBlockRelationEditRelationName')}</div>

				{!isReadonly ? (
					<div className="inputWrap">
						<Input 
							ref={filterRef} 
							value={name}
							onChange={checkButton} 
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
				<div className="name">{translate('menuBlockRelationEditRelationType')}</div>
				<MenuItemVertical 
					id="relation-type" 
					icon={format === null ? undefined : `relation ${Relation.className(format)}`} 
					name={format === null ? translate('menuBlockRelationEditSelectRelationType') : translate(`relationName${format}`)}
					onMouseEnter={onRelationType} 
					onClick={onRelationType} 
					readonly={isReadonly}
					arrow={!relation}
				/>
			</div>
			
			{opts}

			{!isReadonly ? (
				<div className="section">
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

			{relation ? (
				<div className="section">
					<MenuItemVertical icon="expand" name={translate('commonOpenObject')} onClick={onOpen} onMouseEnter={menuClose} />
					{canDuplicate ? <MenuItemVertical icon="copy" name={translate('commonDuplicate')} onClick={onCopy} onMouseEnter={menuClose} /> : ''}
					{canUnlink ? <MenuItemVertical icon="unlink" name={unlinkText} onClick={onUnlink} onMouseEnter={menuClose} /> : ''}
					{canDelete ? <MenuItemVertical icon="remove" name={translate('commonMoveToBin')} onClick={onRemove} onMouseEnter={menuClose} /> : ''}
				</div>
			) : ''}
		</form>
	);

}));

export default MenuBlockRelationEdit;