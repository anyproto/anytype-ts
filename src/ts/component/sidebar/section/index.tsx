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
	const cn = [ 'section', U.Common.toCamelCase(component.replace(/\//g, '-')) ];
	const readonly = props.readonly || object?.isArchived;
	const id = [ 'section' ].concat(component.split('/'));

	if (item) {
		id.push(item.id);
	};

	useEffect(() => {
		if (withState) {
			setStateObject(props.object);
		};
	}, []);

	useEffect(() => {
		childRef.current?.forceUpdate();
	}, [ object ]);

	useImperativeHandle(ref, () => ({
		forceUpdate: () => setDummy(dummy + 1),
		getObject: () => object,
		setObject: (o: any) => {
			setStateObject(o);
			childRef.current?.forceUpdate();
		},
	}));

	return (
		<div 
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