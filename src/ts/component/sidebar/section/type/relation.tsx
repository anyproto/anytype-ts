import React, { forwardRef, useState, useRef, useImperativeHandle, useEffect, MouseEvent } from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Icon, ObjectName, IconObject } from 'Component';
import { I, S, C, U, Relation, translate, keyboard, analytics } from 'Lib';
import { DndContext, closestCenter, useSensors, useSensor, PointerSensor, KeyboardSensor, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates, arrayMove, useSortable } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';

const SidebarSectionTypeRelation = observer(forwardRef<I.SidebarSectionRef, I.SidebarSectionComponent>((props, ref) => {

	const { readonly, rootId, object, onChange } = props;
	const nodeRef = useRef(null);
	const [ active, setActive ] = useState(null);
	const [ dummy, setDummy ] = useState(0);
	const [ isLoaded, setIsLoaded ] = useState(false);
	const [ conflictIds, setConflictIds ] = useState([]);
	const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

	const skipKeys = [ 'name', 'description' ];
	const filterMapper = it => it && !skipKeys.includes(it.relationKey);

	const recommendedFeaturedRelations = Relation.getArrayValue(object.recommendedFeaturedRelations);
	const recommendedRelations = Relation.getArrayValue(object.recommendedRelations);
	const recommendedHiddenRelations = Relation.getArrayValue(object.recommendedHiddenRelations);
	const featured = recommendedFeaturedRelations.map(key => S.Record.getRelationById(key)).filter(filterMapper);
	const recommended = recommendedRelations.map(key => S.Record.getRelationById(key)).filter(filterMapper);
	const hidden = recommendedHiddenRelations.map(key => S.Record.getRelationById(key)).filter(filterMapper);
	const lists: any[] = [
		{ id: I.SidebarRelationList.Featured, name: translate('sidebarTypeRelationHeader'), data: featured, relationKey: 'recommendedFeaturedRelations' },
		{ id: I.SidebarRelationList.Recommended, name: translate('sidebarTypeRelationSidebar'), data: recommended, relationKey: 'recommendedRelations' },
		{ id: I.SidebarRelationList.Hidden, name: translate('sidebarTypeRelationHidden'), data: hidden, relationKey: 'recommendedHiddenRelations' },
	];

	const addConfirm = (ids: string[]) => {
		let title = '';
		let text = '';
		if (ids.length == 1) {
			title = translate('popupConfirmLocalFieldsTitleSingle');
			text = translate('popupConfirmLocalFieldsTextSingle');
		} else {
			title = translate('popupConfirmLocalFieldsTitlePlural');
			text = translate('popupConfirmLocalFieldsTextPlural');
		};

		S.Popup.open('confirm', {
			data: {
				title,
				text,
				textConfirm: translate('commonAdd'),
				colorConfirm: 'blank',
				colorCancel: 'blank',
				onConfirm: () => {
					const recommendedRelations = Relation.getArrayValue(object.recommendedRelations);

					onChange({ recommendedRelations: recommendedRelations.concat(ids) });
					analytics.stackAdd('AddConflictRelation', { count: ids.length });
				},
			},
		});
	};

	const onMore = (e: MouseEvent, item: any) => {
		e.preventDefault();
		e.stopPropagation();

		const element = $(nodeRef.current).find(`#item-${item.id}`);

		S.Menu.open('select', {
			element: element.find('.icon.more'),
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			horizontal: I.MenuDirection.Right,
			onOpen: () => element.addClass('active'),
			onClose: () => element.removeClass('active'),
			data: {
				options: [
					{ id: 'addToType', name: translate('sidebarRelationLocalAddToType') },
				],
				onSelect: (e, option) => {
					switch (option.id) {
						case 'addToType': {
							addConfirm([ item.id ]);
							break;
						};
					};
				},
			},
		});
	};

	if (conflictIds.length) {
		const ids = [].concat(recommendedFeaturedRelations, recommendedRelations, recommendedHiddenRelations);
		const conflictRelations = conflictIds.filter(it => !ids.includes(it)).map(id => S.Record.getRelationById(id)).filter(filterMapper);

		if (conflictRelations.length) {
			lists.push({
				id: I.SidebarRelationList.Local, name: translate('sidebarTypeRelationFound'), data: conflictRelations, relationKey: '',
				description: translate('sidebarTypeRelationLocalDescription'),
				onInfo: () => {
					S.Menu.open('select', {
						element: `#sidebarRight #button-more-${I.SidebarRelationList.Local}`,
						className: 'fixed',
						classNameWrap: 'fromSidebar',
						horizontal: I.MenuDirection.Right,
						data: {
							options: [
								{ id: 'addToType', name: translate('sidebarRelationLocalAddToType'), icon: '' },
							],
							onSelect: (e, option) => {
								switch (option.id) {
									case 'addToType': {
										addConfirm(conflictRelations.map(it => it.id));
										break;
									};
								};
							},
						}
					});
				},
				onMore,
			});
		};
	};

	const loadConflicts = () => {
		if (isLoaded) {
			return;
		};

		U.Data.getConflictRelations(rootId, ids => {
			setIsLoaded(true);
			setConflictIds(ids);
		});
	};

	const onSortStart = (e: any) => {
		keyboard.disableSelection(true);
		setActive(e.active);
	};
	
	const onSortEnd = (event) => {
		keyboard.disableSelection(false);

        const { active, over } = event;
        if (!over || (active.id == over.id)) {
			return;
		};

		const from = lists.find(it => it.id == active.data.current.list.id);
		const to = lists.find(it => it.id == over.data.current.list.id);

        if (!from || !to) {
			return;
		};

        const fromItems = Relation.getArrayValue(object[from.relationKey]);
        const toItems = Relation.getArrayValue(object[to.relationKey]);
        const oldIndex = fromItems.indexOf(active.id);
        const newIndex = toItems.indexOf(over.id);

		let analyticsId = '';

        if (from.id == to.id) {
            onChange({ [from.relationKey]: arrayMove(fromItems, oldIndex, newIndex) });

			analyticsId = 'SameGroup';
        } else 
		if ((from.relationKey && to.relationKey) || (from.id == I.SidebarRelationList.Local)) {
			toItems.splice(newIndex, 0, active.id);
			onChange({
				[from.relationKey]: fromItems.filter(id => id != active.id),
				[to.relationKey]: toItems,
			});

			analyticsId = I.SidebarRelationList[to.id];
        };
		if (from.id == I.SidebarRelationList.Local) {
			analytics.stackAdd('AddConflictRelation', { count: 1 });
		};

		analytics.stackAdd('ReorderRelation', { id: analyticsId });
    };

	const onAdd = (e: any, list: any) => {
		const keys = U.Object.getTypeRelationKeys(object.id).concat('description');
		const ids = list.data.map(it => it.id);

		S.Menu.open('relationSuggest', { 
			element: $(e.currentTarget),
			horizontal: I.MenuDirection.Center,
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			data: {
				filter: '',
				rootId: object.id,
				ref: 'type',
				menuIdEdit: 'blockRelationEdit',
				skipKeys: keys,
				addCommand: (rootId: string, blockId: string, relation: any) => {
					onChange({ [list.relationKey]: [ relation.id ].concat(ids) });
				},
			}
		});
	};

	const onEdit = (e: any, list: any, id: string) => {
		const allowed = S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Relation ]);
		const ids = Relation.getArrayValue(object[list.relationKey]);
		
		S.Menu.open('blockRelationEdit', { 
			element: `#sidebarRight #item-${id}`,
			horizontal: I.MenuDirection.Center,
			classNameWrap: 'fromSidebar',
			className: 'fixed',
			data: {
				rootId: object.id,
				relationId: id,
				readonly: !allowed,
				noUnlink: list.id == I.SidebarRelationList.Local,
				ref: 'type',
				addCommand: (rootId: string, blockId: string, relation: any) => {
					onChange({ [list.relationKey]: [ relation.id ].concat(ids) });
				},
				deleteCommand: () => {
					onChange({ [list.relationKey]: ids.filter(it => it != id) });
				},
			}
		});
	};

	const Item = (item: any) => {
		const list = item.list;
		const { attributes, listeners, transform, transition, setNodeRef } = useSortable({ id: item.id, data: item, disabled: item.disabled });
		const canDrag = !item.disabled;
		const cn = [ 'item' ];
		const style = {
			transform: CSS.Transform.toString(transform),
			transition,
		};

		let onClick = e => onEdit(e, list, item.id);
		if (item.isEmpty) {
			cn.push('empty');
			onClick = e => onAdd(e, list);
		};

		return (
			<div 
				id={`item-${item.id}`}
				ref={setNodeRef}
				{...attributes}
				{...listeners}
				style={style}
				className={cn.join(' ')}
				onClick={onClick}
				onContextMenu={onClick}
			>
				{!item.isEmpty ? (
					<>
						{canDrag ? <Icon className="dnd" /> : ''}
						<IconObject object={item} />
					</>
				) : ''}
				<ObjectName object={item} />
				{list.onMore ? <Icon className="more" onClick={e => list.onMore(e, item)} /> : ''}
			</div>
		);
	};

	const emptyId = (id: I.SidebarRelationList) => {
		return [ id, 'empty' ].join('-');
	};

	const List = (list: any) => (
		<SortableContext 
			items={list.data.map(it => it.id)} 
			strategy={verticalListSortingStrategy}
		>
			<div className="sectionNameWrap">
				<div className="side left">
					<Label text={list.name} />
					{list.description ? (
						<Icon 
							className="question"
							tooltipParam={{
								text: list.description, 
								className: 'relationGroupDescription',
								typeX: I.MenuDirection.Center, 
								typeY: I.MenuDirection.Bottom, 
								offsetX: -8, 
								delay: 0,
							}}
						/> 
					) : ''}
				</div>
				<div className="side right">
					{list.onInfo ? (
						<Icon 
							id={`button-more-${list.id}`}
							className="more withBackground"
							tooltipParam={{ text: translate('commonActions') }}
							onClick={list.onInfo}
						/>
					) : ''}
				</div>
			</div>
			<div className="items">
				{list.data.length ? (
					<>
						{list.data.map((item, i) => (
							<Item 
								key={[ list.id, item.id ].join('-')} 
								{...item} 
								list={list}
								index={i}
								disabled={readonly}
							/>
						))}
					</>
				) : (
					<Item 
						key={emptyId(list.id)} 
						{...{ id: emptyId(list.id), name: translate('sidebarTypeRelationEmpty'), isEmpty: true }} 
						list={list}
						disabled={true}
					/>
				)}
			</div>
		</SortableContext>
	);

	useImperativeHandle(ref, () => ({
		forceUpdate: () => setDummy(dummy + 1),
	}));

	useEffect(() => {
		loadConflicts();
	});

	return (
		<div ref={nodeRef} className="wrap">
			<div className="titleWrap">
				<Title text={translate('sidebarTypeRelation')} />
				<Icon 
					id="section-relation-plus" 
					className="plus withBackground" 
					tooltipParam={{ text: translate('commonAddRelation') }}
					onClick={e => onAdd(e, lists.find(it => it.id == I.SidebarRelationList.Recommended))} 
				/>
			</div>

			<DndContext 
				sensors={sensors} 
				collisionDetection={closestCenter} 
				modifiers={[ restrictToVerticalAxis, restrictToFirstScrollableAncestor ]} 
				onDragStart={onSortStart} 
				onDragEnd={onSortEnd}
			>
				{lists.map((list, i) => <List key={list.id} {...list} list={list.id} />)}

				<DragOverlay>
					{active ? <Item {...active.data.current} /> : null}
				</DragOverlay>
			</DndContext>
		</div>
	);

}));

export default SidebarSectionTypeRelation;
