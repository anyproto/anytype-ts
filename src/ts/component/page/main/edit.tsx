import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Storage } from 'ts/lib';
import { HeaderMainEdit as Header, DragProvider, SelectionProvider, EditorPage } from 'ts/component';

interface Props extends RouteComponentProps<any> {};

const Constant = require('json/constant.json');

class PageMainEdit extends React.Component<Props, {}> {
	
	render () {
		const { history, location, match } = this.props;
		
		return (
			<SelectionProvider container=".pageMainEdit" rootId={match.params.id}>
				<DragProvider rootId={match.params.id}>
					<Header {...this.props} rootId={match.params.id} />

					<div className="wrapper">
						<EditorPage history={history} location={location} match={match} rootId={match.params.id} addOffsetX={-Constant.size.blockMenu} />
					</div>
				</DragProvider>
			</SelectionProvider>
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