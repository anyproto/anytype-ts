import * as React from 'react';
import { Header, Footer, EditorPage } from 'Component';
import { I, S, U, Onboarding, analytics } from 'Lib';

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
		const home = U.Space.getDashboard();
		const object = S.Detail.get(rootId, rootId, [ 'type' ], true);

		if (this.refHeader) {
			this.refHeader.forceUpdate();
		};

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

	getRootId () {
		const { rootId, match } = this.props;
		return rootId ? rootId : match.params.id;
	};
	
};

export default PageMainEdit;
