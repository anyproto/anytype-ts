import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { MenuMain, HeaderMainEdit as Header, DragProvider, SelectionProvider, EditorPage } from 'ts/component';

interface Props extends RouteComponentProps<any> {};

class PageMainEdit extends React.Component<Props, {}> {
	
	render () {
		return (
			<SelectionProvider>
				<DragProvider >
					<Header {...this.props} />
					<MenuMain />
							
					<div className="wrapper">
						<EditorPage />
					</div>
				</DragProvider>
			</SelectionProvider>
		);
	};
	
};

export default PageMainEdit;