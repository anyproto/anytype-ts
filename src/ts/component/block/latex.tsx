import * as React from 'react';
import { I } from 'ts/lib';
import { Textarea } from 'ts/component';
import { observer } from 'mobx-react';

import 'katex/dist/katex.min.css';

const katex = require('katex');

interface Props extends I.BlockComponent {};
interface State {
	value: string;
}

const BlockLatex = observer(class BlockLatex extends React.Component<Props, State> {

	_isMounted: boolean = false;

	state = {
		value: '',
	};

	constructor (props: any) {
		super(props);
	};

	render () {
		const { rootId, block, readonly } = this.props;

		let { value } = this.state;
		let content = '';

		try {
			content = katex.renderToString(value);
		} catch (e) {
			console.log(JSON.stringify(e, null, 3));
		};

		return (
			<div>
				<div className="value" dangerouslySetInnerHTML={{ __html: content }} />
				<Textarea onKeyUp={(e: any, v: string) => { this.setState({ value: v }); }} />
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
	};
	
	componentWillUnmount () {
		this._isMounted = false;
	};
	
});

export default BlockLatex;