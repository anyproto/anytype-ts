import React, { forwardRef, useRef, useEffect, useState, useImperativeHandle } from 'react';
import { observer } from 'mobx-react';
import { J, U, S, sidebar } from 'Lib';

import PageType from './page/type';
import PageObjectRelation from './page/object/relation';
import PageObjectTableOfContents from './page/object/tableOfContents';

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
};

const SidebarRight = observer(forwardRef<SidebarRightRefProps, Props>((props, ref) => {
	
	const { isPopup } = props;
	const showSidebarRight = S.Common.getShowSidebarRight(isPopup);
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
	const cn = [ 'sidebar', 'right' ];
	const id = U.Common.toCamelCase(page.replace(/\//g, '-'));
	const Component = Components[id];
	const pageId = U.Common.toCamelCase(`sidebarPage-${id}`);
	const cnp = [ 'sidebarPage', U.Common.toCamelCase(`page-${id}`), 'customScrollbar' ];
	const withPreview = [ 'type' ].includes(page);

	if (withPreview) {
		cn.push('withPreview');
	};

	useEffect(() => {
		childRef.current?.forceUpdate();
	});

	useImperativeHandle(ref, () => ({
		getState: () => {
			return U.Common.objectCopy(state);
		},
		setState: (newState: State) => {
			if (newState.page !== state.page) {
				delete(state.previous);
				newState.previous = U.Common.objectCopy(state);
			};

			setState(newState);
		},
	}));

	return showSidebarRight ? (
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
						getId={() => pageId}
					/> 
				</div>
			): ''}
		</div>
	) : null;

}));

export default SidebarRight;
