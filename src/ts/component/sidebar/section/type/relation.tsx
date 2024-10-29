import * as React from 'react';
import { observer } from 'mobx-react';
import arrayMove from 'array-move';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { Title, Label, Icon, ObjectName, IconObject } from 'Component';
import { I, S, Relation, translate, keyboard } from 'Lib';

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
			<div className="item">
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

		const ListFeatured = SortableContainer(() => (
			<div id="section-relation-featured" className="items">
				{featured.map((item, i) => <Item key={`sidebar-${item.relationKey}`} {...item} index={i} />)}
			</div>
		));

		const ListRecommended = SortableContainer(() => (
			<div id="section-relation-recommended" className="items">
				{recommended.map((item, i) => <Item key={`sidebar-${item.relationKey}`} {...item} index={i} />)}
			</div>
		));

        return (
			<div className="wrap">
				<div className="titleWrap">
					<Title text={translate('sidebarTypeRelation')} />
					<Icon className="plus withBackground" />
				</div>

				<Label text={translate('sidebarTypeRelationHeader')} />
				<ListFeatured
					axis="y" 
					transitionDuration={150}
					distance={10}
					useDragHandle={true}
					onSortStart={this.onSortStart}
					onSortEnd={result => this.onSortEnd('featuredRelations', result)}
					helperClass="isDragging"
					lockToContainerEdges={false}
					helperContainer={() => $(`#sidebarRight #section-relation-featured`).get(0)}
				/>

				<Label text={translate('sidebarTypeRelationSidebar')} />
				<ListRecommended 
					axis="y" 
					transitionDuration={150}
					distance={10}
					useDragHandle={true}
					onSortStart={this.onSortStart}
					onSortEnd={result => this.onSortEnd('recommendedRelations', result)}
					helperClass="isDragging"
					lockToContainerEdges={false}
					helperContainer={() => $(`#sidebarRight #section-relation-recommended`).get(0)}
				/>
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

});

export default SidebarSectionTypeRelation;