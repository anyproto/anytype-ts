import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { Icon, Editable } from 'Component';
import { I, C, S, U, J, keyboard, analytics, translate, Dataview } from 'Lib';

const BlockDataviewHead = observer(forwardRef<I.ViewRef, I.ViewComponent>((props, ref) => {

	const { 
		rootId, block, readonly, className, isCollection, getTarget, onSourceSelect, onSourceTypeSelect, loadData,
	} = props;
	const [ isEditing, setIsEditing ] = useState(false);
	const nodeRef = useRef(null);
	const editableRef = useRef(null);
	const rangeRef = useRef<I.TextRange>(null);
	const menuContext = useRef(null);
	const targetObjectId = block.getTargetObjectId();
	const object = getTarget();
	const cn = [ 'dataviewHead' ];
	const placeholder = Dataview.namePlaceholder(object.layout);

	useEffect(() => {
		setValue();

		return () => {
			save();
		};

	}, []);

	useEffect(() => {
		setValue();

		if (isEditing) {
			const l = getValue().length;
			setRange(rangeRef.current || { from: l, to: l });
		};
	});

	const onTitle = () => {
		const element = `#block-head-${block.id}`;
		const object = S.Detail.get(rootId, targetObjectId);
		const sourceName = isCollection ? translate('commonCollection') : translate('commonSet');
		const canEdit = !readonly && !object.isDeleted;
		const canSource = !readonly && !object.isDeleted;

		if (isEditing) {
			return;
		};

		if (!targetObjectId) {
			onSourceSelect(element, {});
			return;
		};

		const options: any[] = [
			canEdit ? { id: 'editTitle', icon: 'editText', name: translate('blockDataviewHeadMenuEdit') } : null,
			canSource ? { id: 'sourceChange', icon: 'source', name: U.String.sprintf(translate('blockDataviewHeadMenuChange'), sourceName), arrow: true } : null,
			{ id: 'sourceOpen', icon: 'expand', name: U.String.sprintf(translate('blockDataviewHeadMenuOpen'), sourceName) },
		].filter(it => it);

		S.Menu.open('select', {
			element,
			offsetY: 4,
			width: 240,
			classNameWrap: 'fromBlock',
			onOpen: context => menuContext.current = context,
			data: {
				options,
				onOver: onTitleOver,
				onSelect: onTitleSelect,
			},
		});
	};

	const onTitleOver = (e: any, item: any) => {
		if (!menuContext.current) {
			return;
		};

		if (!item.arrow) {
			S.Menu.closeAll([ 'searchObject' ]);
			return;
		};

		const addParam: any = {};
		const onCreate = (message: any, isNew: boolean) => {
			if (message.views && message.views.length) {
				window.setTimeout(() => loadData(message.views[0].id, 0, true), 50);
			};

			if (isNew) {
				menuContext.current.close();
				setIsEditing(true);
			};

			analytics.event('InlineSetSetSource', { type: isNew ? 'newObject' : 'externalObject' });
		};

		let filters: I.Filter[] = [];
		let menuId = '';
		let menuParam: any = {
			menuKey: item.id,
			element: `#${menuContext.current.getId()} #item-${item.id}`,
			offsetX: menuContext.current.getSize().width,
			vertical: I.MenuDirection.Center,
			classNameWrap: 'fromBlock',
			isSub: true,
			data: {},
		};

		if (isCollection) {
			filters = filters.concat([
				{ relationKey: 'resolvedLayout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Collection },
			]);

			addParam.name = translate('blockDataviewCreateNewCollection');
			addParam.nameWithFilter = translate('blockDataviewCreateNewCollectionWithName');

			addParam.onClick = (details: any) => {
				C.ObjectCreate(details, [], '', J.Constant.typeKey.collection, S.Common.space, (message: any) => { 
					C.BlockDataviewCreateFromExistingObject(rootId, block.id, message.objectId, (message: any) => onCreate(message, true));
				});
			};
		} else {
			filters = filters.concat([
				{ relationKey: 'resolvedLayout', condition: I.FilterCondition.In, value: [ I.ObjectLayout.Set, I.ObjectLayout.Type ] },
				{ relationKey: 'setOf', condition: I.FilterCondition.NotEmpty, value: null },
			]);

			addParam.name = translate('blockDataviewCreateNewSet');
			addParam.nameWithFilter = translate('blockDataviewCreateNewSetWithName');

			addParam.onClick = (details: any) => {
				C.ObjectCreateSet([], details, '', S.Common.space, (message: any) => {
					C.BlockDataviewCreateFromExistingObject(rootId, block.id, message.objectId, (message: any) => {
						$(nodeRef.current).find('#head-source-select').trigger('click');
						onCreate(message, true);
					});
				});
			};
		};

		switch (item.id) {
			case 'sourceChange':
				menuId = 'searchObject';

				menuParam = Object.assign(menuParam, {
					className: 'single',
					rebind: menuContext.current.getChildRef()?.rebind,
					parentId: menuContext.current.props.id,
				});

				menuParam.data = Object.assign(menuParam.data, {
					rootId,
					blockId: block.id,
					blockIds: [ block.id ],
					filters,
					canAdd: true,
					value: [ targetObjectId ],
					addParam,
					withPlural: true,
					onSelect: (item: any) => {
						C.BlockDataviewCreateFromExistingObject(rootId, block.id, item.id, (message: any) => onCreate(message, false));
						menuContext.current?.close();
					}
				});
				break;
		};

		if (menuId && !S.Menu.isOpen(menuId, item.id)) {
			S.Menu.closeAll([ 'searchObject' ], () => {
				S.Menu.open(menuId, menuParam);
			});
		};
	};

	const onTitleSelect = (e: any, item: any) => {
		if (item.arrow) {
			return;
		};

		switch (item.id) {
			case 'editTitle': {
				setIsEditing(true);
				break;
			};

			case 'sourceOpen': {
				U.Object.openAuto(getTarget());
				analytics.event('InlineSetOpenSource');
				break;
			};

		};
	};

	const onSource = () => {
		onSourceTypeSelect(`#block-${block.id} #head-source-select`);
	};

	const onBlur = () => {
		save();
		rangeRef.current = null;
		window.setTimeout(() => setIsEditing(false), 40);
	};

	const onKeyDown = (e: any) => {
		keyboard.shortcut('enter', e, () => { 
			e.preventDefault();
			save(); 
		});
	};

	const onKeyUp = () => {
		checkInput(!getValue());
	};

	const onSelect = () => {
		if (editableRef.current) {
			rangeRef.current = editableRef.current.getRange();
		};
	};

	const setValue = () => {
		if (!editableRef.current) {
			return;
		};

		const object = getTarget();
		const placeholder = Dataview.namePlaceholder(object.layout);

		let name = U.Object.name(object, true);
		if ([ 
			translate('defaultNamePage'), 
			placeholder,
		].includes(name)) {
			name = '';
		};

		editableRef.current.setValue(name);
		editableRef.current.placeholderCheck();
		checkInput(!name);
	};

	const getValue = () => {
		return String(editableRef.current?.getTextValue() || '');
	};

	const checkInput = (isEmpty: boolean) => {
		$(editableRef.current?.getNode()).toggleClass('isEmpty', isEmpty);
	};

	const save = () => {
		if (!isEditing || !targetObjectId) {
			return;
		};

		const object = getTarget();
		const placeholder = Dataview.namePlaceholder(object.layout);
		
		let value = getValue();
		if ([ object.name, object.pluralName ].includes(value)) {
			return;
		};

		if ([ 
			translate('defaultNamePage'), 
			placeholder,
		].includes(value)) {
			value = '';
		};

		const key = U.Object.isTypeLayout(object.layout) ? 'pluralName' : 'name';
		C.ObjectListSetDetails([ targetObjectId ], [ { key, value } ]);

		editableRef.current?.placeholderCheck();
	};

	const setRange = (range: I.TextRange) => {
		editableRef.current?.setRange(range);
	};

	if (className) {
		cn.push(className);
	};

	if (isEditing) {
		cn.push('isEditing');
	};

	let icon = null;
	if (targetObjectId && !isCollection) {
		icon = <Icon id="head-source-select" className="source withBackground" onClick={onSource} />;
	} else {
		icon = <div id="head-source-select" />;
	};

	return (
		<div 
			id={`block-head-${block.id}`}
			ref={nodeRef}
			className={cn.join(' ')}
		>
			<Editable
				ref={editableRef}
				id="value"
				readonly={readonly || !isEditing}
				placeholder={placeholder}
				onMouseDown={onTitle}
				onBlur={onBlur}
				onKeyDown={onKeyDown}
				onKeyUp={onKeyUp}
				onSelect={onSelect}
			/>
			{icon}
		</div>
	);

}));

export default BlockDataviewHead;