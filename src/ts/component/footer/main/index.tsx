import * as React from 'react';
import { Icon } from 'ts/component';
import { I } from 'ts/lib';
import { commonStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props {
	commonStore?: any;
};

@observer
class FooterMainIndex extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onHelp = this.onHelp.bind(this);
	};

	render () {
		return (
			<div className="footer">
				<Icon id="button-help" className={'help light ' + (commonStore.menuIsOpen('help') ? 'active' : '')} onMouseDown={this.onHelp} />
			</div>
		);
	};

	onHelp () {
		commonStore.menuOpen('help', {
			type: I.MenuType.Vertical, 
			element: '#button-help',
			offsetX: 0,
			offsetY: 4,
			vertical: I.MenuDirection.Top,
			horizontal: I.MenuDirection.Right
		});
	};

};

export default FooterMainIndex;