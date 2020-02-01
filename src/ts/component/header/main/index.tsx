import * as React from 'react';
import { Icon } from 'ts/component';
import { observer, inject } from 'mobx-react';
import { I, C, Util} from 'ts/lib';

interface Props {
	commonStore?: any;
	blockStore?: any;
};

const Constant = require('json/constant.json');

@inject('commonStore')
@inject('blockStore')
@observer
class HeaderMainIndex extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onNew = this.onNew.bind(this);
	};

	render () {
		return (
			<div className="header">
				<Icon className="logo" />
				<div className="menu">
					<div className="item" onClick={this.onNew}>
						<Icon className="new" />New
					</div>
				</div>
			</div>
		);
	};
	
	onNew (e: any) {
		Util.pageCreate(e, this.props, Util.randomSmile(), Constant.defaultName);
	};
	
};

export default HeaderMainIndex;