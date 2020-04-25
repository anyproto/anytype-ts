import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Storage } from 'ts/lib';
import { blockStore } from 'ts/store';
import { HeaderMainEdit as Header, FooterMainEdit as Footer, DragProvider, SelectionProvider, EditorPage } from 'ts/component';

interface Props extends RouteComponentProps<any> {};

const Constant = require('json/constant.json');

class PageMainEdit extends React.Component<Props, {}> {
	
	render () {
		const { history, location, match } = this.props;
		const rootId = match.params.id;
		
		return (
			<div>
				<SelectionProvider container=".pageMainEdit" rootId={match.params.id}>
					<DragProvider {...this.props} rootId={rootId}>
						<Header {...this.props} rootId={rootId} />
	
						<div className="wrapper">
							<EditorPage history={history} location={location} match={match} rootId={rootId} />
						</div>
					</DragProvider>
				</SelectionProvider>
				
				<Footer {...this.props} rootId={rootId} />
			</div>
		);
	};
	
	componentDidMount () {
		this.setId();
	};
	
	componentDidUpdate () {
		this.setId();
	};
	
	setId () {
		const { match } = this.props;
		Storage.set('pageId', match.params.id);
	};
	
};

export default PageMainEdit;