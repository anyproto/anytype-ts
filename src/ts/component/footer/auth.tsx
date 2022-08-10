import * as React from 'react';
import { Icon } from 'Component';
import { I, Util, sidebar } from 'Lib';
import { menuStore } from 'Store';

interface Props {};

class FooterAuth extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onHelp = this.onHelp.bind(this);
	};

	render () {
		return (
			<div id="footer" className="footer">
				<div className="copy">{Util.date('Y', Util.time())}, Anytype</div>
				<Icon id="button-help" className="help light" tooltip="Help" tooltipY={I.MenuDirection.Top} onClick={this.onHelp} />
			</div>
		);
	};

	componentDidMount () {
		sidebar.resizePage();
	};

	componentDidUpdate () {
		sidebar.resizePage();	
	};

	onHelp () {
		menuStore.open('help', {
			element: '#button-help',
			vertical: I.MenuDirection.Top,
			horizontal: I.MenuDirection.Right
		});
	};

};

export default FooterAuth;