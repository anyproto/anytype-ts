import * as React from 'react';
import { observer } from 'mobx-react';
import { I, S } from 'Lib';

const SidebarPageType = observer(class SidebarPageType extends React.Component<I.SidebarPageComponent> {
	
	node = null;

	constructor (props: I.SidebarPageComponent) {
		super(props);

	};

    render () {
		const { rootId } = this.props;
		const type = S.Record.getTypeById(rootId);

        return (
			<div>Edit Type {type.name}</div>
		);
    };

});

export default SidebarPageType;