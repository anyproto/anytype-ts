import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Icon } from 'ts/component';
import { I, Util, DataUtil } from 'ts/lib';
import { commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any>  {};

const Constant = require('json/constant.json');

@observer
class FooterMainIndex extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onHelp = this.onHelp.bind(this);
		this.onAdd = this.onAdd.bind(this);
	};

	render () {
		return (
			<div className="footer">
				<Icon id="button-help" className={'help light ' + (commonStore.menuIsOpen('help') ? 'active' : '')} onMouseDown={this.onHelp} />
				<Icon id="button-plus" className="plusBig" onClick={this.onAdd} tooltip="Add new page" tooltipY={I.MenuDirection.Top} />
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
	
	onAdd (e: any) {
		const { root } = blockStore;
		const details = { 
			iconEmoji: Util.randomSmile(), 
			name: Constant.default.name 
		};
		
		DataUtil.pageCreate(e, this.props, root, '', details, I.BlockPosition.Bottom, (message: any) => {
			Util.scrollTopEnd();
		});
	};

};

export default FooterMainIndex;