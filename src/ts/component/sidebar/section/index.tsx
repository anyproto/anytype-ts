import * as React from 'react';
import { observer } from 'mobx-react';
import { I, U } from 'Lib';

import TypeTitle from './type/title';
import TypeLayout from './type/layout';
import TypeRelation from './type/relation';
import TypeTemplate from './type/template';

import ObjectRelation from './object/relation';
import ObjectTableOfContents from './object/tableOfContents';

const Components = {
	'type/title': TypeTitle,
	'type/layout': TypeLayout,
	'type/relation': TypeRelation,
	'type/template': TypeTemplate,

	'object/relation': ObjectRelation,
	'object/tableOfContents': ObjectTableOfContents,
};

interface Props extends I.SidebarSectionComponent {
	component: string;
	withState?: boolean;
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
		const { component, item, onDragStart } = this.props;
		const object = this.getObject();
		if (!object) {
			return null;
		};

		const Component = Components[component];
		const cn = [ 'section', U.Common.toCamelCase(component.replace(/\//g, '-')) ];
		const readonly = this.isReadonly();
		const id = [ 'section' ].concat(component.split('/'));

		if (item) {
			id.push(item.id);
		};

        return (
			<div 
				id={id.join('-')}
				className={cn.join(' ')}
				draggable={!readonly && !!onDragStart}
				onDragStart={onDragStart}
			>
				{Component ? (
					<Component 
						ref={ref => this.ref = ref} 
						{...this.props} 
						object={object} 
						readonly={readonly}
					/> 
				): component}
			</div>
		);
    };

	componentDidMount (): void {
		const { withState } = this.props;

		if (withState) {
			this.setObject(this.props.object);
		};
	};

	getObject (): any {
		return this.state.object || this.props.object;
	};

	setObject (object: any): void {
		this.setState({ object }, () => this.ref?.forceUpdate());
	};

	isReadonly (): boolean {
		const { readonly } = this.props;
		const object = this.getObject();

		return readonly || object?.isArchived;
	};

});

export default SidebarSectionIndex;
