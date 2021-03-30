import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Storage } from 'ts/lib';
import { HeaderMainEdit as Header, FooterMainEdit as Footer, DragProvider, SelectionProvider, EditorPage } from 'ts/component';

interface Props extends RouteComponentProps<any> {
	rootId: string;
	isPopup?: boolean;
};

class PageMainEdit extends React.Component<Props, {}> {
	
	refHeader: any = null;

	constructor (props: any) {
		super(props);
		
		this.onOpen = this.onOpen.bind(this);
	};

	render () {
		const { history, location, match, isPopup } = this.props;
		const rootId = this.getRootId();
		
		return (
			<div>
				<SelectionProvider rootId={match.params.id}>
					<DragProvider {...this.props} rootId={rootId}>
						<Header ref={(ref: any) => { this.refHeader = ref; }} {...this.props} rootId={rootId} isPopup={isPopup} />
	
						<div id="bodyWrapper" className="wrapper">
							<EditorPage key="editorPage" {...this.props} isPopup={isPopup} rootId={rootId} onOpen={this.onOpen} />
						</div>
					</DragProvider>
				</SelectionProvider>
				
				<Footer {...this.props} rootId={rootId} />
			</div>
		);
	};
	
	onOpen () {
		if (this.refHeader) {
			this.refHeader.forceUpdate();
		};
	};

	getRootId () {
		const { rootId, match } = this.props;
		return rootId ? rootId : match.params.id;
	};
	
};

export default PageMainEdit;