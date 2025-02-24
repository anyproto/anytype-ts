import React, { forwardRef, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Icon, ObjectName, IconObject } from 'Component';
import { I, S, Relation, translate, keyboard } from 'Lib';
import { DndContext, closestCenter, useSensors, useSensor, useDroppable, PointerSensor, KeyboardSensor, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates, arrayMove, useSortable } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';

const SidebarSectionTypeRelation = observer(forwardRef<{}, I.SidebarSectionComponent>((props, ref) => {

	const { readonly, object, onChange } = props;
	const [ active, setActive ] = useState(null);
	const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

	const recommendedFeaturedRelations = Relation.getArrayValue(object.recommendedFeaturedRelations);
	const recommendedRelations = Relation.getArrayValue(object.recommendedRelations);
	const recommendedHiddenRelations = Relation.getArrayValue(object.recommendedHiddenRelations);
	const featured = recommendedFeaturedRelations.map(key => S.Record.getRelationById(key)).filter(it => it);
	const recommended = recommendedRelations.map(key => S.Record.getRelationById(key)).filter(it => it);
	const hidden = recommendedHiddenRelations.map(key => S.Record.getRelationById(key)).filter(it => it);
	const lists = [
		{ id: 'featured', name: translate('sidebarTypeRelationHeader'), data: featured, relationKey: 'recommendedFeaturedRelations' },
		{ id: 'recommended', name: translate('sidebarTypeRelationSidebar'), data: recommended, relationKey: 'recommendedRelations' },
		{ id: 'hidden', name: translate('sidebarTypeRelationHidden'), data: hidden, relationKey: 'recommendedHiddenRelations' },
	];

	const onSortStart = (e: any) => {
		setActive(e.active);
		keyboard.disableSelection(true);
	};
	
	const onSortEnd = (event) => {
        const { active, over } = event;
        if (!over || (active.id == over.id)) {
			return;
		};

		const from = lists.find(it => it.id == active.data.current.list);
		const to = lists.find(it => it.id == over.data.current.list);

        if (!from || !to) {
			return;
		};

        const fromItems = Relation.getArrayValue(object[from.relationKey]);
        const toItems = Relation.getArrayValue(object[to.relationKey]);
        const oldIndex = fromItems.indexOf(active.id);
        const newIndex = toItems.indexOf(over.id);

        if (from.id == to.id) {
            onChange({ [from.relationKey]: arrayMove(fromItems, oldIndex, newIndex) });
        } else {
			toItems.splice(newIndex, 0, active.id);

            onChange({
                [from.relationKey]: fromItems.filter(id => id != active.id),
                [to.relationKey]: toItems,
            });
        };

		keyboard.disableSelection(false);
    };

	const onAdd = (e: any, id: string) => {
		const list = lists.find(it => it.id == id);
		const keys = lists.reduce((acc, it) => acc.concat(it.data.map(it => it.relationKey)), []);
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

	const onEdit = (e: any, listId: string, id: string) => {
		const list = lists.find(it => it.id == listId);
		const allowed = S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Relation ]);
		const ids = Relation.getArrayValue(object[list.relationKey]);
		
		S.Menu.open('blockRelationEdit', { 
			element: `#sidebarRight #${listId} #item-${id}`,
			horizontal: I.MenuDirection.Center,
			classNameWrap: 'fromSidebar',
			className: 'fixed',
			data: {
				rootId: object.id,
				relationId: id,
				readonly: !allowed,
				ref: 'type',
				addCommand: (rootId: string, blockId: string, relation: any) => {
					onChange({ [list.relationKey]: [ id ].concat(ids) });
				},
				deleteCommand: () => {
					onChange({ [list.relationKey]: ids.filter(it => it != id) });
				},
			}
		});
	};

	const Item = (item: any) => {
		const { attributes, listeners, transform, transition, setNodeRef } = useSortable({ id: item.id, data: item, disabled: item.disabled });
		const canDrag = !item.disabled;
		const cn = [ 'item' ];
		const style = {
			transform: CSS.Transform.toString(transform),
			transition,
		};

		let onClick = e => onEdit(e, item.list, item.id);
		if (item.isEmpty) {
			cn.push('empty');
			onClick = e => onAdd(e, item.list);
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
			>
				{!item.isEmpty ? (
					<>
						{canDrag ? <Icon className="dnd" /> : ''}
						<IconObject object={item} />
					</>
				) : ''}
				<ObjectName object={item} />
			</div>
		);
	};

	const List = (list: any) => {
		return (
			<SortableContext 
				items={list.data.map(it => it.id)} 
				strategy={verticalListSortingStrategy}
			>
				<Label text={list.name} />
				<div className="items">
					{list.data.length ? (
						<>
							{list.data.map((item, i) => (
								<Item 
									key={[ list.list, item.id ].join('-')} 
									{...item} 
									list={list.list}
									index={i}
									disabled={readonly}
								/>
							))}
						</>
					) : (
						<Item 
							key={[ list.list, 'empty' ].join('-')} 
							{...{ id: 'empty', name: translate('sidebarTypeRelationEmpty'), isEmpty: true }} 
							list={list.list}
							disabled={true}
						/>
					)}
				</div>
			</SortableContext>
		);
	};

	return (
		<div className="wrap">
			<div className="titleWrap">
				<Title text={translate('sidebarTypeRelation')} />
				<Icon id="section-relation-plus" className="plus withBackground" onClick={e => onAdd(e, 'recommended')} />
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