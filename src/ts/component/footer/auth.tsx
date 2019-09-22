import * as React from 'react';
import { Icon } from 'ts/component';
import { MenuDirection } from 'ts/store/common';
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
        return (
			<div className="footer">
				<div className="copy">2018, Anytype</div>
				<Icon id="button-help" className="help light" onMouseDown={this.onHelp} />
			</div>
		);
    };

	onHelp () {
		const { commonStore } = this.props;
		commonStore.menuOpen('help', { 
			element: 'button-help',
			offsetY: 4,
			vertical: MenuDirection.Top,
			horizontal: MenuDirection.Right 
		});
	};

};

export default FooterAuth;