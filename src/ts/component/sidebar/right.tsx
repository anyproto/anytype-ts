import React, { forwardRef, useRef, useEffect, useState, useImperativeHandle } from 'react';
import { observer } from 'mobx-react';
import { I, U, S } from 'Lib';

import PageType from './page/type';
import PageObjectRelation from './page/object/relation';
import PageObjectTableOfContents from './page/object/tableOfContents';
import PageWidget from './page/widget';
import PageAllObject from './page/allObject';

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
	allObject:				 PageAllObject,
};

const SidebarRight = observer(forwardRef<SidebarRightRefProps, Props>((props, ref) => {
	
	const { isPopup } = props;
	const rightSidebar = S.Common.getRightSidebarState(isPopup);
	const childRef = useRef(null);
	const [ state, setState ] = useState<State>({
		page: '',
		rootId: '',
		details: {},
		readonly: false,
		noPreview: false,
		previous: null,
		blockId: '',
	});

	const { page = '' } = state;
	const id = U.Common.toCamelCase(page.replace(/\//g, '-'));
	const Component = Components[id];
	const pageId = U.Common.toCamelCase(`sidebarPage-${id}`);
	const cn = [ 'sidebar', 'right', 'customScrollbar' ];
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

	return rightSidebar.isOpen ? (
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
	) : null;

}));

export default SidebarRight;