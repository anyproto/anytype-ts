import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { HeaderMainEdit as Header, FooterMainEdit as Footer, EditorPage } from 'ts/component';

interface Props extends RouteComponentProps<any> {
	rootId: string;
	isPopup?: boolean;
};

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
				<Header ref={(ref: any) => { this.refHeader = ref; }} {...this.props} rootId={rootId} isPopup={isPopup} />

				<div id="bodyWrapper" className="wrapper">
					<EditorPage key="editorPage" {...this.props} isPopup={isPopup} rootId={rootId} onOpen={this.onOpen} />
				</div>
				
				<Footer ref={(ref: any) => { this.refFooter = ref; }} {...this.props} rootId={rootId} isPopup={isPopup} />
			</React.Fragment>
		);
	};
	
	onOpen () {
		if (this.refHeader) {
			this.refHeader.forceUpdate();
		};
		if (this.refFooter) {
			this.refFooter.forceUpdate();
		};
	};

	getRootId () {
		const { rootId, match } = this.props;
		return rootId ? rootId : match.params.id;
	};
	
};

export default PageMainEdit;