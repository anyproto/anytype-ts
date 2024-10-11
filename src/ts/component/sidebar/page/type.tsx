import * as React from 'react';
import { observer } from 'mobx-react';

const SidebarPageType = observer(class SidebarPageType extends React.Component {
	
	node = null;

	constructor (props) {
		super(props);

	};

    render() {
        return (
			<div>Edit Type</div>
		);
    };

});

export default SidebarPageType;