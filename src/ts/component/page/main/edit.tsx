import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Header, FooterMainEdit as Footer, EditorPage } from 'ts/component';
import { detailStore, blockStore } from 'ts/store';
import { Onboarding } from 'ts/lib';

interface Props extends RouteComponentProps<any> {
	rootId: string;
	isPopup?: boolean;
	refSidebar?: any;
};

const Constant = require('json/constant.json');

class PageMainEdit extends React.Component<Props, {}> {
	
	refHeader: any = null;
	refFooter: any = null;

	constructor (props: any) {
		super(props);
		
		this.onOpen = this.onOpen.bind(this);
	};

	render () {
		const { isPopup } = this.props;
		const rootId = this.getRootId();

		return (
			<React.Fragment>
				<Header 
					component="mainEdit" 
					ref={(ref: any) => { this.refHeader = ref; }} 
					rootId={rootId}
					{...this.props} 
				/>

				<div id="bodyWrapper" className="wrapper">
					<EditorPage key="editorPage" {...this.props} isPopup={isPopup} rootId={rootId} onOpen={this.onOpen} />
				</div>
				
				<Footer ref={(ref: any) => { this.refFooter = ref; }} {...this.props} rootId={rootId} isPopup={isPopup} />
			</React.Fragment>
		);
	};

	onOpen () {
		const { isPopup, refSidebar } = this.props;
		const rootId = this.getRootId();
		const object = detailStore.get(rootId, rootId);

		if (this.refHeader) {
			this.refHeader.forceUpdate();
		};
		if (this.refFooter) {
			this.refFooter.forceUpdate();
		};
		if (refSidebar) {
			refSidebar.id = rootId;
			refSidebar.setActive(rootId);
		};

		let key = '';
		if (object.type == Constant.typeId.template) {
			key = 'template';
		} else 
		if (!blockStore.checkBlockType(rootId)) {
			key = 'editor';
		};
		if (key) {
			Onboarding.start(key, isPopup);
		};
	};

	getRootId () {
		const { rootId, match } = this.props;
		return rootId ? rootId : match.params.id;
	};
	
};

export default PageMainEdit;