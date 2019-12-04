import * as React from 'react';
import { Icon } from 'ts/component';
import { I, Util } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props {
	commonStore?: any;
};

@inject('commonStore')
@observer
class FooterAuth extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onHelp = this.onHelp.bind(this);
	};

	render () {
		const { commonStore } = this.props;
		const date = (new Date()).getTime() / 1000;
		
		return (
			<div className="footer">
				<div className="copy">{Util.date('Y', date)}, Anytype</div>
				<Icon id="button-help" className={'help light ' + (commonStore.menuIsOpen('help') ? 'active' : '')} onMouseDown={this.onHelp} />
			</div>
		);
	};

	onHelp () {
		const { commonStore } = this.props;
		
		commonStore.menuOpen('help', { 
			element: 'button-help',
			offsetY: 4,
			vertical: I.MenuDirection.Top,
			horizontal: I.MenuDirection.Right
		});
	};

};

export default FooterAuth;