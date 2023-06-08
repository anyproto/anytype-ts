import * as React from 'react';
import { Header, Footer, EditorPage } from 'Component';
import { I, Onboarding, UtilObject } from 'Lib';
import { detailStore, blockStore } from 'Store';
import Constant from 'json/constant.json';

class PageMainEdit extends React.Component<I.PageComponent> {
	
	refHeader: any = null;
	refFooter: any = null;

	constructor (props: I.PageComponent) {
		super(props);
		
		this.onOpen = this.onOpen.bind(this);
	};

	render () {
		const { isPopup } = this.props;
		const rootId = this.getRootId();

		return (
			<React.Fragment>
				<Header component="mainObject" ref={ref => this.refHeader = ref} rootId={rootId} {...this.props} />

				<div id="bodyWrapper" className="wrapper">
					<EditorPage key="editorPage" {...this.props} isPopup={isPopup} rootId={rootId} onOpen={this.onOpen} />
				</div>
				
				<Footer component="mainObject" ref={ref => this.refFooter = ref} {...this.props} />
			</React.Fragment>
		);
	};

	onOpen () {
		const { isPopup } = this.props;
		const rootId = this.getRootId();
		const home = UtilObject.getSpaceDashboard();
		const object = detailStore.get(rootId, rootId, [ 'type' ], true);

		if (this.refHeader) {
			this.refHeader.forceUpdate();
		};
		if (this.refFooter) {
			this.refFooter.forceUpdate();
		};

		if (home && (rootId != home.id)) {
			let key = '';
			if (object.type == Constant.typeId.template) {
				key = 'template';
			} else 
			if (!blockStore.checkBlockTypeExists(rootId)) {
				key = 'editor';
			};
			if (key) {
				Onboarding.start(key, isPopup);
			};
		};
	};

	getRootId () {
		const { rootId, match } = this.props;
		return rootId ? rootId : match.params.id;
	};
	
};

export default PageMainEdit;