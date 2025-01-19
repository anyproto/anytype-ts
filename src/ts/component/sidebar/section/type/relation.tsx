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
		this.onAdd = this.onAdd.bind(this);
	};

    render () {
		const { readonly } = this.props;
		const featured = this.getFeatured();
		const recommended = this.getRecommended();

		const Handle = SortableHandle(() => (
			<Icon className="dnd" />
		));

		const Item = SortableElement((item: any) => {
			const ce = [ 'eye' ];
			const isActive = item.container == 'section-relation-featured';
			const canDrag = !readonly;
			const canHide = !readonly;

			if (isActive) {
				ce.push('active');
			};

			return (
				<div 
					id={`item-${item.id}`}
					className="item" 
					onClick={e => this.onEdit(e, item.container, item.id)}
				>
					<div className="side left">
						{canDrag ? <Handle /> : ''}
						<IconObject object={item} />
						<ObjectName object={item} />
					</div>
					<div className="side right">
						{canHide ? <Icon className={ce.join(' ')} onClick={e => this.onToggle(e, item.container, item.id)} /> : ''}
					</div>
				</div>
			);
		});

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
					onSortEnd={result => this.onSortEnd(list.relationKey, result)}
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
					<Icon id="section-relation-plus" className="plus withBackground" onClick={this.onAdd} />
				</div>

				<Label text={translate('sidebarTypeRelationHeader')} />
				<List data={featured} container="section-relation-featured" relationKey="recommendedFeaturedRelations" />

				<Label text={translate('sidebarTypeRelationSidebar')} />
				<List data={recommended} container="section-relation-recommended" relationKey="recommendedRelations" />
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

		onChange({ [relationKey]: value });
		keyboard.disableSelection(false);
	};

	onToggle (e: any, container: string, id: string) {
		e.stopPropagation();

		const { object, onChange } = this.props;

		let { recommendedFeaturedRelations, recommendedRelations } = object;

		switch (container) {
			case 'section-relation-featured': {
				recommendedFeaturedRelations = recommendedFeaturedRelations.filter(it => it != id);
				recommendedRelations.unshift(id);
				break;
			};

			case 'section-relation-recommended': {
				recommendedRelations = recommendedRelations.filter(it => it != id);
				recommendedFeaturedRelations.unshift(id);
				break;
			};
		};

		onChange({
			recommendedFeaturedRelations,
			recommendedRelations,
		});
	};

	getFeatured () {
		return Relation.getArrayValue(this.props.object.recommendedFeaturedRelations).map(key => S.Record.getRelationById(key)).filter(it => it);
	};

	getRecommended () {
		return Relation.getArrayValue(this.props.object.recommendedRelations).map(id => S.Record.getRelationById(id)).filter(it => it);
	};

	onAdd (e: any) {
		const { object, onChange } = this.props;
		const recommendedKeys = this.getRecommended().map(it => it.relationKey);
		const recommendedRelations = Relation.getArrayValue(object.recommendedRelations);

		S.Menu.open('relationSuggest', { 
			element: '#sidebarRight #section-relation-plus',
			horizontal: I.MenuDirection.Right,
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			data: {
				filter: '',
				rootId: object.id,
				ref: 'type',
				menuIdEdit: 'blockRelationEdit',
				skipKeys: recommendedKeys,
				addCommand: (rootId: string, blockId: string, relation: any) => {
					onChange({ recommendedRelations: [ relation.id ].concat(recommendedRelations) });
				},
			}
		});
	};

	onEdit (e: any, container: string, id: string) {
		const { object, onChange } = this.props;
		const allowed = S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Relation ]);
		const recommendedRelations = Relation.getArrayValue(object.recommendedRelations);
		const relation = S.Record.getRelationById(id);
		
		S.Menu.open('blockRelationEdit', { 
			element: `#sidebarRight #${container} #item-${id}`,
			horizontal: I.MenuDirection.Center,
			classNameWrap: 'fromSidebar',
			className: 'fixed',
			data: {
				rootId: object.id,
				relationId: id,
				readonly: !allowed,
				ref: 'type',
				addCommand: (rootId: string, blockId: string, relation: any) => {
					onChange({ recommendedRelations: [ relation.id ].concat(recommendedRelations) });
				},
				deleteCommand: () => {
					onChange({ recommendedRelations: recommendedRelations.filter(it => it != relation.id) });
				},
			}
		});
	};

});

export default SidebarSectionTypeRelation;
