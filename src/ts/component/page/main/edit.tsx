import React, { forwardRef, useRef } from 'react';
import { observer } from 'mobx-react';
import { motion, AnimatePresence } from 'motion/react';
import { Header, Footer, EditorPage } from 'Component';
import { I, S, U, Onboarding, analytics, keyboard } from 'Lib';

const PageMainEdit = observer(forwardRef<I.PageRef, I.PageComponent>((props, ref) => {

	const { isPopup } = props;
	const headerRef = useRef(null);
	const rootId = keyboard.getRootId(isPopup);
	const ns = U.Common.getEventNamespace(isPopup);

	const onOpen = () => {
		const home = U.Space.getDashboard();
		const object = S.Detail.get(rootId, rootId, [ 'type' ], true);

		headerRef.current?.forceUpdate();

		if (home && (rootId != home.id)) {
			let key = '';
			if (U.Object.isTemplateType(object.type)) {
				key = 'template';
			} else 
			if (Onboarding.isCompletedCommon()) {
				key = 'editor';
			};
			if (key) {
				Onboarding.start(key, isPopup);
			};
		};

		analytics.event('ScreenObject', { objectType: object.type });
	};

	return (
		<>
			<Header 
				component="mainObject" 
				ref={headerRef} 
				{...props} 
				rootId={rootId} 
			/>

			<AnimatePresence mode="popLayout">
				<motion.div
					id="bodyWrapper" 
					className="wrapper"
					{...U.Common.animationProps({
						transition: { duration: 0.3, delay: 0.2 },
					})}
				>
					<EditorPage 
						key="editorPage"
						ref={ref => S.Common.refSet(`editor${ns}`, ref)}
						{...props} 
						isPopup={isPopup} 
						rootId={rootId} 
						onOpen={onOpen} 
					/>
				</motion.div>
			</AnimatePresence>
			
			<Footer component="mainObject" {...props} />
		</>
	);

}));

export default PageMainEdit;
