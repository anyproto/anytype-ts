import * as React from 'react';
import { observer } from 'mobx-react';
import { I } from 'Lib';

const SidebarPageObjectRelation = observer(class SidebarPageObjectRelation extends React.Component<I.SidebarPageComponent> {
	
	constructor (props: I.SidebarPageComponent) {
		super(props);
	};

    render () {
        return (
			<React.Fragment>
			</React.Fragment>
		);
	};

});

export default SidebarPageObjectRelation;