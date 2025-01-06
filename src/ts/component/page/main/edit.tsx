import React, { forwardRef, useRef } from 'react';
import { observer } from 'mobx-react';
import { Header, Footer, EditorPage } from 'Component';
import { I, S, U, Onboarding, analytics } from 'Lib';

const PageMainEdit = observer(forwardRef<I.PageRef, I.PageComponent>((props, ref) => {

	const { isPopup } = props;
	const headerRef = useRef(null);

	const onOpen = () => {
		const rootId = getRootId();
		const home = U.Space.getDashboard();
		const object = S.Detail.get(rootId, rootId, [ 'type' ], true);

		headerRef.current?.forceUpdate();

		if (home && (rootId != home.id)) {
			let key = '';
			if (U.Object.isTemplate(object.type)) {
				key = 'template';
			} else 
			if (!S.Block.checkBlockTypeExists(rootId) && Onboarding.isCompleted('basics')) {
				key = 'editor';
			};
			if (key) {
				Onboarding.start(key, isPopup);
			};
		};

		analytics.event('ScreenObject', { objectType: object.type });
	};

	const getRootId = () => {
		const { rootId, match } = props;
		return rootId ? rootId : match?.params?.id;
	};

	const rootId = getRootId();

	return (
		<>
			<Header 
				component="mainObject" 
				ref={headerRef} 
				{...props} 
				rootId={rootId} 
			/>

			<div id="bodyWrapper" className="wrapper">
				<EditorPage 
					key="editorPage" {...props} 
					isPopup={isPopup} 
					rootId={rootId} 
					onOpen={onOpen} 
				/>
			</div>
			
			<Footer 
				component="mainObject"
				{...props} 
			/>
		</>
	);

}));

export default PageMainEdit;