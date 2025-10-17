import React, { forwardRef, useRef, useEffect, useState, useImperativeHandle } from 'react';
import { observer } from 'mobx-react';
import { I, U } from 'Lib';

import PageType from './page/type';
import PageObjectRelation from './page/object/relation';
import PageObjectTableOfContents from './page/object/tableOfContents';
import PageWidget from './page/widget';

interface Props {
	isPopup?: boolean;
};

interface SidebarRightRefProps {
	setState: (state: State) => void;
	getState: () => State;
};

interface State {
	page: string;
	rootId: string;
	details: any;
	readonly: boolean;
	noPreview: boolean;
	blockId: string;
	previous: State;
};

const Components = {
	type:					 PageType,
	objectRelation:			 PageObjectRelation,
	objectTableOfContents:	 PageObjectTableOfContents,
	widget:					 PageWidget,
};

const SidebarRight = observer(forwardRef<SidebarRightRefProps, Props>((props, ref) => {
	
	const childRef = useRef(null);
	const spaceview = U.Space.getSpaceview();
	const [ state, setState ] = useState<State>({
		page: spaceview.isChat ? 'widget' : '',
		rootId: '',
		details: {},
		readonly: false,
		noPreview: false,
		previous: null,
		blockId: '',
	});

	const page = String(state.page || '');
	const id = U.Common.toCamelCase(page.replace(/\//g, '-'));
	const Component = Components[id];
	const pageId = U.Common.toCamelCase(`sidebarPage-${id}`);
	const cn = [ 'sidebar', 'right', 'customScrollbar', `space${I.SpaceUxType[spaceview.uxType]}` ];
	const cnp = [ 'sidebarPage', U.Common.toCamelCase(`page-${page.replace(/\//g, '-')}`) ];
	const withPreview = [ 'type' ].includes(page);

	if (withPreview) {
		cn.push('withPreview');
	};

	useEffect(() => {
		childRef.current?.forceUpdate();
	});

	useImperativeHandle(ref, () => ({
		getState: () => U.Common.objectCopy(state),
		setState: (newState: State) => {
			if (newState.page !== state.page) {
				delete(state.previous);
				newState.previous = U.Common.objectCopy(state);
			};

			setState(newState);
		},
	}));

	return (
		<div 
			id="sidebarRight"
			className={cn.join(' ')}
		>
			{Component ? (
				<div id={pageId} className={cnp.join(' ')}>
					<Component 
						ref={childRef} 
						{...props} 
						{...state}
						sidebarDirection={I.SidebarDirection.Right}
						getId={() => pageId}
					/> 
				</div>
			): ''}
		</div>
	);

}));

export default SidebarRight;