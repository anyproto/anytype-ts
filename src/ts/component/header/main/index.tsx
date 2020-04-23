import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Icon } from 'ts/component';
import { I, Util, DataUtil } from 'ts/lib';
import { blockStore } from 'ts/store';

interface Props extends RouteComponentProps<any>  {};

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
						<Icon className="plus-new" />
						<div className="name">New</div>
					</div>
				</div>
			</div>
		);
	};
	
	onAdd (e: any) {
		const { root } = blockStore;
		
		DataUtil.pageCreate(e, this.props, root, '', { name: Constant.default.name }, I.BlockPosition.Bottom, (message: any) => {
			Util.scrollTopEnd();
		});
	};
	
};

export default HeaderMainIndex;