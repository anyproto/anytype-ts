import * as React from 'react';
import { Icon } from 'ts/component';
import { MenuDirection } from 'ts/store/common';
import { observer, inject } from 'mobx-react';

interface Props {
	commonStore?: any;
};

interface State {
	help: boolean;
};

@inject('commonStore')
@observer
class FooterAuth extends React.Component<Props, State> {
	
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
		this.setState({ help: true });
		
		const { commonStore } = this.props;
		commonStore.menuOpen('help', { 
			element: 'button-help',
			offsetY: 4,
			vertical: MenuDirection.Top,
			horizontal: MenuDirection.Right,
			onClose: () => {
				this.setState({ help: false });
			}
		});
	};

};

export default FooterAuth;