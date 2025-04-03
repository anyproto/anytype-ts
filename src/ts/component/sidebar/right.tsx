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
	const timeout = useRef(0);

	if (withPreview) {
		cn.push('withPreview');
	};

	useEffect(() => {
		return () => {
			window.clearTimeout(timeout.current);
			$(window).off('mousedown.sidebarRight');
		};
	}, []);

	useEffect(() => {
		const win = $(window);

		childRef.current?.forceUpdate();

		win.off('mousedown.sidebarRight');

		if (showSidebarRight) {
			window.clearTimeout(timeout.current);
			timeout.current = window.setTimeout(() => {
				win.on('mousedown.sidebarRight', (e: any) => {
					if ($(e.target).parents(`#sidebarRight`).length > 0) {
						return;
					};

					e.stopPropagation();
					sidebar.rightPanelToggle(false, true, isPopup);
					win.off('mousedown.sidebarRight');
				});
			}, J.Constant.delay.sidebar);
		};
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
