import React, { forwardRef, useRef, useEffect, useState, useImperativeHandle } from 'react';
import { observer } from 'mobx-react';
import { J, U, S, sidebar } from 'Lib';

import PageType from './page/type';
import PageObjectRelation from './page/object/relation';

interface Props {
	isPopup?: boolean;
};

interface SidebarRightRefProps {
	setState: (state: State) => void;
};

interface State {
	page: string;
	rootId: string;
	details: any;
	readonly: boolean;
	noPreview: boolean;
	previous: State;
};

const Components = {
	'type': PageType,
	'object/relation': PageObjectRelation,
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
	});

	const { page = '' } = state;
	const Component = Components[page];
	const cn = [ 'sidebar', 'right' ];
	const cnp = [ 'sidebarPage', U.Common.toCamelCase(`page-${page.replace(/\//g, '-')}`) ];
	const withPreview = [ 'type' ].includes(page);

	if (withPreview) {
		cn.push('withPreview');
	};

	useEffect(() => {
		childRef.current?.forceUpdate();
	});

	useImperativeHandle(ref, () => ({
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
				<div className={cnp.join(' ')}>
					<Component 
						ref={childRef} 
						{...props} 
						{...state}
					/> 
				</div>
			): ''}
		</div>
	) : null;

}));

export default SidebarRight;
