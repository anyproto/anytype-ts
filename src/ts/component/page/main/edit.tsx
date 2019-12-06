import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { MenuMain, HeaderMainEdit as Header, DragProvider, SelectionProvider, EditorPage } from 'ts/component';

interface Props extends RouteComponentProps<any> {};

class PageMainEdit extends React.Component<Props, {}> {
	
	render () {
		const { match } = this.props;
		
		return (
			<SelectionProvider container=".pageMainEdit" rootId={match.params.id}>
				<DragProvider rootId={match.params.id}>
					<Header {...this.props} rootId={match.params.id} />
					<MenuMain />
							
					<div className="wrapper">
						<EditorPage {...this.props} rootId={match.params.id} container=".pageMainEdit" addOffsetY={0} />
					</div>
				</DragProvider>
			</SelectionProvider>
		);
	};
	
};

export default PageMainEdit;