import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, MenuItemVertical } from 'ts/component';
import { I, dispatcher } from 'ts/lib';
import { commonStore } from 'ts/store';

interface Props extends I.Menu {};

class MenuBlockStyle extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
	};

	render () {
		const actions = [
			{ id: I.TextStyle.Paragraph, icon: 'text', name: 'Text' },
			{ id: I.TextStyle.Header1, icon: 'header1', name: 'Heading 1' },
			{ id: I.TextStyle.Header2, icon: 'header2', name: 'Heading 2' },
			{ id: I.TextStyle.Header3, icon: 'header3', name: 'Heading 3' },
			{ id: I.TextStyle.Quote, icon: 'quote', name: 'Highlighted' },
			{ id: I.TextStyle.Code, icon: 'code', name: 'Code snippet' },
			{ id: I.TextStyle.Bulleted, icon: 'list', name: 'Bulleted list' },
			{ id: I.TextStyle.Numbered, icon: 'numbered', name: 'Numbered list' },
			{ id: I.TextStyle.Toggle, icon: 'toggle', name: 'Toggle' },
			{ id: I.TextStyle.Checkbox, icon: 'checkbox', name: 'Checkbox' },
		];
		
		return (
			<React.Fragment>
				{actions.map((action: any, i: number) => {
					return <MenuItemVertical key={i} {...action} onClick={(e: any) => { this.onClick(e, action.id); }} />;
				})}
			</React.Fragment>
		);
	};
	
	onClick (e: any, id: I.TextStyle) {
		const { param } = this.props;
		const { data } = param;
		const { blockId, rootId, content, onSelect } = data;
		
		commonStore.menuClose(this.props.id);
		onSelect(id);
	};

};

export default MenuBlockStyle;