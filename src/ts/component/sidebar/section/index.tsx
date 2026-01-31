import React, { forwardRef, useRef, useState, useImperativeHandle, useEffect } from 'react';
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

interface Ref extends I.SidebarSectionRef {
	getNode(): any;
	setObject(object: any): void;
	getObject(): any;
};

const SidebarSectionIndex = observer(forwardRef<Ref, Props>((props, ref) => {
	
	const { component, item, onDragStart, withState } = props;
	const [ stateObject, setStateObject ] = useState(null);
	const [ dummy, setDummy ] = useState(0);
	const object = stateObject || props.object;

	if (!object) {
		return null;
	};

	const childRef = useRef(null);
	const Component = Components[component];
	const cn = [ 'section', U.String.toCamelCase(component.replace(/\//g, '-')) ];
	const readonly = props.readonly || object?.isArchived;
	const id = [ 'section' ].concat(component.split('/'));
	const nodeRef = useRef(null);

	if (item) {
		id.push(item.id);
	};

	const updateChild = () => {
		childRef.current?.forceUpdate?.();
	};

	useEffect(() => {
		if (withState) {
			setStateObject(props.object);
		};
	}, []);

	useEffect(() => {
		updateChild();
	}, [ object ]);

	useImperativeHandle(ref, () => ({
		forceUpdate: () => setDummy(dummy + 1),
		getNode: () => nodeRef.current,
		getObject: () => object,
		setObject: (o: any) => {
			setStateObject(o);
			updateChild();
		},
	}));

	return (
		<div 
			ref={nodeRef}
			id={id.join('-')}
			className={cn.join(' ')}
			draggable={!readonly && !!onDragStart}
			onDragStart={onDragStart}
		>
			{Component ? (
				<Component 
					ref={childRef} 
					{...props} 
					object={object} 
					readonly={readonly}
				/> 
			): component}
		</div>
	);

}));

export default SidebarSectionIndex;