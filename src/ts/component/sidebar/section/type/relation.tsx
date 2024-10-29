import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Icon } from 'Component';
import { I, translate } from 'Lib';

const SidebarSectionTypeRelation = observer(class SidebarSectionTypeRelation extends React.Component<I.SidebarSectionComponent> {
	
    render () {
		const { object } = this.props;

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
				</div>
			</div>
		);
    };

});

export default SidebarSectionTypeRelation;