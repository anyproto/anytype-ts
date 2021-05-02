import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Icon } from 'ts/component';
import { I } from 'ts/lib';
import { menuStore } from 'ts/store';

interface Props extends RouteComponentProps<any>  {
	rootId: string;
};

class FooterMainEdit extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onHelp = this.onHelp.bind(this);
	};

	render () {
		return (
			<div className="footer">
				<Icon id="button-help" className="help" onMouseDown={this.onHelp} />
			</div>
		);
	};

	onHelp () {
		menuStore.open('help', {
			element: '#button-help',
			offsetY: -4,
			vertical: I.MenuDirection.Top,
			horizontal: I.MenuDirection.Right
		});
	};
	
};

export default FooterMainEdit;