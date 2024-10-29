import * as React from 'react';
import { observer } from 'mobx-react';
import { I, U } from 'Lib';

import TypeTitle from './type/title';
import TypeLayout from './type/layout';
import TypeRelation from './type/relation';

const Components = {
	'type/title': TypeTitle,
	'type/layout': TypeLayout,
	'type/relation': TypeRelation,
};

interface Props extends I.SidebarSectionComponent {
	component: string;
};

interface State {
	object: any;
};

const SidebarSectionIndex = observer(class SidebarSectionIndex extends React.Component<Props, State> {
	
	state = {
		object: null,
	};
	ref = null;

    render () {
		const { object } = this.state;
		const { component } = this.props;
		const Component = Components[component];
		const cn = [ 'section', U.Common.toCamelCase(component.replace(/\//g, '-')) ];

		if (!object || !Component) {
			return null;
		};

        return (
			<div className={cn.join(' ')}>
				<Component ref={ref => this.ref = ref} {...this.props} object={object} />
			</div>
		);
    };

	componentDidMount (): void {
		this.setObject(this.props.object);
	};

	setObject (object: any): void {
		this.setState({ object }, () => this.ref?.forceUpdate());
	};

});

export default SidebarSectionIndex;