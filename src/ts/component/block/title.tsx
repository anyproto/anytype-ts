import * as React from 'react';
import { Input } from 'ts/component';
import { I, C } from 'ts/lib';
import { commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props {
	rootId: string;
	block: I.Block;
};

const Constant = require('json/constant.json');

@observer
class BlockTitle extends React.Component<Props, {}> {

	timeout: number = 0;

	constructor (props: any) {
		super(props);
		
		this.onChange = this.onChange.bind(this);
	};

	render (): any {
		const { rootId, block } = this.props;
		const details = blockStore.getDetail(rootId, rootId);
		const { id } = block;
		
		let { name } = details;
		if (name == Constant.default.name) {
			name = '';
		};
		
		return (
			<React.Fragment>
				<Input placeHolder={Constant.default.name} value={name} onChange={this.onChange} className={'focusable c' + id} />
			</React.Fragment>
		);
	};
	
	onChange (e: any, value: string) {
		const { rootId } = this.props;
		
		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => {
			C.BlockSetDetails(rootId, [ { key: 'name', value: value } ]);
		}, 500);
	};
	
};

export default BlockTitle;