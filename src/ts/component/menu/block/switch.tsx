import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, MenuItemVertical } from 'ts/component';
import { I, dispatcher } from 'ts/lib';
import { commonStore } from 'ts/store';

interface Props extends I.Menu {
};

class MenuBlockSwitch extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
	};

	render () {
		const blockActions = [
			{ id: I.TextStyle.Paragraph, icon: 'text', name: 'Text' },
			{ id: I.TextStyle.Paragraph, icon: 'page', name: 'Page' },
			{ id: I.TextStyle.Header1, icon: 'header1', name: 'Heading 1' },
			{ id: I.TextStyle.Header2, icon: 'header2', name: 'Heading 2' },
			{ id: I.TextStyle.Header3, icon: 'header3', name: 'Heading 3' },
			{ id: I.TextStyle.Header4, icon: 'header4', name: 'Heading 4' },
			{ id: I.TextStyle.Quote, icon: 'quote', name: 'Highlight' },
			{ id: 'bulleted', icon: 'list', name: 'Bulleted list' },
			{ id: 'numbered', icon: 'numbered', name: 'Numbered list' },
			{ id: 'toggle', icon: 'toggle', name: 'Toggle' },
			{ id: 'checkbox', icon: 'checkbox', name: 'Checkbox' },
			{ id: I.TextStyle.Code, icon: 'code', name: 'Code snippet' }
		];
		
		return (
			<React.Fragment>
				{blockActions.map((action: any, i: number) => {
					return <MenuItemVertical key={i} {...action} className="yellow" onClick={(e: any) => { this.onClick(e, action.id); }} />;
				})}
			</React.Fragment>
		);
	};
	
	onClick (e: any, id: any) {
		const { param } = this.props;
		const { data } = param;
		const { blockId, rootId, content } = data;
		
		commonStore.menuClose(this.props.id);
		
		let request: any = {
			contextId: rootId,
			blockId: blockId,
		};
		
		switch (id) {
			default:
				request.style = id;
				dispatcher.call('blockSetTextStyle', request, (errorCode: any, message: any) => {});
				break;
				
			case 'bulleted':
				console.log(content.marker);
				request.marker = I.MarkerType.Bullet;
				dispatcher.call('blockSetTextMarker', request, (errorCode: any, message: any) => {});
				break;
				
			case 'numbered':
				console.log(content.marker);
				request.marker = I.MarkerType.Number;
				dispatcher.call('blockSetTextMarker', request, (errorCode: any, message: any) => {});
				break;
				
			case 'toggle':
				console.log(content.toggleable);
				request.toggleable = true;
				dispatcher.call('blockSetTextToggleable', request, (errorCode: any, message: any) => {});
				break;
				
			case 'checkbox':
				console.log(content.checkable);
				request.checkable = true;
				dispatcher.call('blockSetTextCheckable', request, (errorCode: any, message: any) => {});
				break;
		};
	};

};

export default MenuBlockSwitch;