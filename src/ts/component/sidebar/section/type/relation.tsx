import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Icon, ObjectName, IconObject } from 'Component';
import { I, S, Relation, translate } from 'Lib';

const SidebarSectionTypeRelation = observer(class SidebarSectionTypeRelation extends React.Component<I.SidebarSectionComponent> {
	
    render () {
		const { object } = this.props;
		const recommendedRelations = Relation.getArrayValue(object.recommendedRelations);
		const recommendedKeys = recommendedRelations.map(id => S.Record.getRelationById(id)).map(it => it && it.relationKey);

		const Item = (item: any) => (
			<div className="item">
				<div className="side left">
					<Icon className="dnd" />
					<IconObject object={item} />
					<ObjectName object={item} />
				</div>
				<div className="side right">
					<Icon className="eye" />
				</div>
			</div>
		);

        return (
			<div className="wrap">
				<div className="titleWrap">
					<Title text={translate('sidebarTypeRelation')} />
					<Icon className="plus withBackground" />
				</div>

				<Label text={translate('sidebarTypeRelationHeader')} />
				<div className="items">
				</div>

				<Label text={translate('sidebarTypeRelationSidebar')} />
				<div className="items">
					{recommendedKeys.map(key => {
						const relation = S.Record.getRelationByKey(key);

						return <Item key={`sidebar-${key}`} {...relation} />;
					})}
				</div>
			</div>
		);
    };

});

export default SidebarSectionTypeRelation;