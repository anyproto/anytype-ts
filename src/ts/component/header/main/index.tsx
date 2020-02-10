import * as React from 'react';
import { Icon } from 'ts/component';
import { I, Util, DataUtil } from 'ts/lib';

interface Props {};

const Constant = require('json/constant.json');

class HeaderMainIndex extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onAdd = this.onAdd.bind(this);
	};

	render () {
		return (
			<div className="header">
				<Icon className="logo" />
				<div className="menu">
					<div className="item" onClick={this.onAdd}>
						<Icon className="plus-new" />New
					</div>
				</div>
			</div>
		);
	};
	
	onAdd (e: any) {
		DataUtil.pageCreate(e, this.props, Util.randomSmile(), Constant.default.name);
	};
	
};

export default HeaderMainIndex;