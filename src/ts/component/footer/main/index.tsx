import * as React from 'react';
import { Icon } from 'ts/component';
import { I } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props {
	commonStore?: any;
};

interface State {
	help: boolean;
};

@inject('commonStore')
@observer
class FooterMainIndex extends React.Component<Props, State> {
	
	state = {
		help: false
	};
	
	constructor (props: any) {
		super(props);
		
		this.onHelp = this.onHelp.bind(this);
	};

	render () {
		const { help } = this.state;
		
		let cn = [ 'help', 'light' ];
		if (help) {
			cn.push('active');
		};
		
        return (
			<div className="footer">
				<div className="copy">2018, Anytype</div>
				<Icon id="button-help" className={cn.join(' ')} onMouseDown={this.onHelp} />
			</div>
		);
	};

	onHelp () {
		const { commonStore } = this.props;
		
		this.setState({ help: true });
		commonStore.menuOpen('help', { 
			element: 'button-help',
			offsetY: 4,
			vertical: I.MenuDirection.Top,
			horizontal: I.MenuDirection.Right,
			onClose: () => {
				this.setState({ help: false });
			}
		});
	};

};

export default FooterMainIndex;