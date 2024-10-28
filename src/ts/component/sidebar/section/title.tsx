import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, ObjectName } from 'Component';
import { I } from 'Lib';

const SidebarSectionTitle = observer(class SidebarSectionTitle extends React.Component<I.SidebarSectionComponent> {
	
    render () {
		const { object } = this.props;

        return (
			<div className="section sectionTitle">
				<IconObject 
					id={`sidebar-icon-title-${object.id}`} 
					object={object} size={24} 
					canEdit={!object.isReadonly}
					menuParam={{
						horizontal: I.MenuDirection.Center,
					}}
				/>

				<ObjectName object={object} />
			</div>
		);
    };

});

export default SidebarSectionTitle;