import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { MenuMain, HeaderMainEdit as Header, DragProvider, SelectionProvider, EditorPage } from 'ts/component';

interface Props extends RouteComponentProps<any> {};

class PageMainEdit extends React.Component<Props, {}> {
	
	render () {
		const { match } = this.props;
		
		return (
			<SelectionProvider>
				<DragProvider >
					<Header {...this.props} />
					<MenuMain />
							
					<div className="wrapper">
						<EditorPage {...this.props} rootId={match.params.id} />
					</div>
				</DragProvider>
			</SelectionProvider>
		);
	};
	
};

export default PageMainEdit;