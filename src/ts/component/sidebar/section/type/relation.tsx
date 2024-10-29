import * as React from 'react';
import { observer } from 'mobx-react';
import arrayMove from 'array-move';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { Title, Label, Icon, ObjectName, IconObject } from 'Component';
import { I, C, S, Relation, translate, keyboard } from 'Lib';

const SidebarSectionTypeRelation = observer(class SidebarSectionTypeRelation extends React.Component<I.SidebarSectionComponent> {
	
	constructor (props: I.SidebarSectionComponent) {
		super(props);

		this.onSortStart = this.onSortStart.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
	};

    render () {
		const { object } = this.props;
		const featured = Relation.getArrayValue(object.featuredRelations).map(key => S.Record.getRelationByKey(key));
		const recommended = Relation.getArrayValue(object.recommendedRelations).map(id => S.Record.getRelationById(id));

		const Handle = SortableHandle(() => (
			<Icon className="dnd" />
		));

		const Item = SortableElement((item: any) => (
			<div 
				id={`item-${item.id}`}
				className="item" 
				onClick={e => this.onEdit(e, item.container, item.id)}
			>
				<div className="side left">
					<Handle />
					<IconObject object={item} />
					<ObjectName object={item} />
				</div>
				<div className="side right">
					<Icon className="eye" />
				</div>
			</div>
		));

		const List = (list: any) => {
			const SortableList = SortableContainer(() => (
				<div id={list.container} className="items">
					{list.data.map((item, i) => (
						<Item 
							key={[ list.container, item.id ].join('-')} 
							{...item} 
							container={list.container}
							index={i} 
						/>
					))}
				</div>
			));

			return (
				<SortableList
					axis="y" 
					transitionDuration={150}
					distance={10}
					useDragHandle={true}
					onSortStart={this.onSortStart}
					onSortEnd={result => this.onSortEnd('featuredRelations', result)}
					helperClass="isDragging"
					lockToContainerEdges={false}
					helperContainer={() => $(`#sidebarRight #${list.container}`).get(0)}
				/>
			);
		};

        return (
			<div className="wrap">
				<div className="titleWrap">
					<Title text={translate('sidebarTypeRelation')} />
					<Icon className="plus withBackground" />
				</div>

				<Label text={translate('sidebarTypeRelationHeader')} />
				<List data={featured} container="section-relation-featured" />

				<Label text={translate('sidebarTypeRelationSidebar')} />
				<List data={recommended} container="section-relation-recommended" />
			</div>
		);
    };

	onSortStart () {
		keyboard.disableSelection(true);
	};
	
	onSortEnd (relationKey: string, result: any) {
		const { oldIndex, newIndex } = result;
		const { object, onChange } = this.props;
		const value = arrayMove(Relation.getArrayValue(object[relationKey]), oldIndex, newIndex);

		onChange(relationKey, value);
		keyboard.disableSelection(false);
	};

	onEdit (e: any, container: string, id: string) {
		const { object } = this.props;
		const allowed = S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Relation ]);
		const relation = S.Record.getRelationById(id);
		
		S.Menu.open('blockRelationEdit', { 
			element: `#sidebarRight #${container} #item-${id}`,
			offsetX: 32,
			data: {
				rootId: object.id,
				relationId: id,
				readonly: !allowed,
				ref: 'type',
				addCommand: (rootId: string, blockId: string, relation: any, onChange?: (relation: any) => void) => {
					C.ObjectTypeRelationAdd(rootId, [ relation.relationKey ], () => {
						if (onChange) {
							onChange(relation.relationKey);
						};
					});
				},
				deleteCommand: () => {
					C.ObjectTypeRelationRemove(object.id, [ relation.relationKey ]);
				},
			}
		});
	};

});

export default SidebarSectionTypeRelation;