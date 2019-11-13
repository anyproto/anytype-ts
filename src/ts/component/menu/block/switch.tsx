import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, MenuItemVertical } from 'ts/component';
import { I } from 'ts/lib';
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
			{ icon: 'p', name: 'Text' },
			{ icon: 'newPage', name: 'Page' },
			{ icon: 'h2', name: 'Heading 1' },
			{ icon: 'h3', name: 'Heading 2' },
			{ icon: 'h4', name: 'Heading 3' },
			{ icon: 'quote', name: 'Highlight' },
			{ icon: 'ul', name: 'Bulleted list' },
			{ icon: 'ol', name: 'Numbered list' },
			{ icon: 'toggle', name: 'Toggle' },
			{ icon: 'checkbox', name: 'Checkbox' },
			{ icon: 'code', name: 'Code snippet' }
		];
		
		return (
			<React.Fragment>
				{blockActions.map((action: any, i: number) => {
					return <MenuItemVertical key={i} {...action} onClick={(e: any) => { this.onClick(e); }} />;
				})}
			</React.Fragment>
		);
	};
	
	onClick (e: any) {
		commonStore.menuClose(this.props.id);
	};

};

export default MenuBlockSwitch;