import * as React from 'react';
import { Header, Footer, EditorPage } from 'Component';
import { I, S, Onboarding, UtilObject, analytics, UtilSpace } from 'Lib';
import { blockStore } from 'Store';

class PageMainEdit extends React.Component<I.PageComponent> {
	
	refHeader: any = null;

	constructor (props: I.PageComponent) {
		super(props);
		
		this.onOpen = this.onOpen.bind(this);
	};

	render () {
		const { isPopup } = this.props;
		const rootId = this.getRootId();

		return (
			<React.Fragment>
				<Header 
					component="mainObject" 
					ref={ref => this.refHeader = ref} 
					{...this.props} 
					rootId={rootId} 
				/>

				<div id="bodyWrapper" className="wrapper">
					<EditorPage key="editorPage" {...this.props} isPopup={isPopup} rootId={rootId} onOpen={this.onOpen} />
				</div>
				
				<Footer component="mainObject" {...this.props} />
			</React.Fragment>
		);
	};

	onOpen () {
		const { isPopup } = this.props;
		const rootId = this.getRootId();
		const home = UtilSpace.getDashboard();
		const object = S.Detail.get(rootId, rootId, [ 'type' ], true);

		if (this.refHeader) {
			this.refHeader.forceUpdate();
		};

		if (home && (rootId != home.id)) {
			let key = '';
			if (UtilObject.isTemplate(object.type)) {
				key = 'template';
			} else 
			if (!blockStore.checkBlockTypeExists(rootId)) {
				key = 'editor';
			};
			if (key) {
				Onboarding.start(key, isPopup);
			};
		};

		analytics.event('ScreenObject', { objectType: object.type });
	};

	getRootId () {
		const { rootId, match } = this.props;
		return rootId ? rootId : match.params.id;
	};
	
};

export default PageMainEdit;