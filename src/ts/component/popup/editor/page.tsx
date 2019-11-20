import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I } from 'ts/lib';
import { RouteComponentProps } from 'react-router';
import { MenuMain, HeaderMainEdit as Header, DragProvider, SelectionProvider, EditorPage } from 'ts/component';

interface Props extends I.Popup, RouteComponentProps<any> {
	history: any;
}; 

class PopupEditorPage extends React.Component<Props, {}> {
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { id } = data;
		
		return (
			<SelectionProvider container=".popupEditorPage .content">
				<DragProvider rootId={id}>
					<Header {...this.props} />
					<MenuMain />
							
					<div className="wrapper">
						<EditorPage rootId={id} container=".popupEditorPage" />
					</div>
				</DragProvider>
			</SelectionProvider>
		);
	};
	
};

export default PopupEditorPage;