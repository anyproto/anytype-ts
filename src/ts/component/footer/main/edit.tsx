import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Icon } from 'ts/component';
import { I } from 'ts/lib';
import { commonStore } from 'ts/store';

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
				<Icon id="button-help" menuId="help" className="help" onMouseDown={this.onHelp} />
			</div>
		);
	};

	onHelp () {
		commonStore.menuOpen('help', {
			type: I.MenuType.Vertical, 
			element: '#button-help',
			offsetX: 0,
			offsetY: -4,
			vertical: I.MenuDirection.Top,
			horizontal: I.MenuDirection.Right
		});
	};
	
};

export default FooterMainEdit;