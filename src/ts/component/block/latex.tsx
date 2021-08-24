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
			content = katex.renderToString(value, {
				throwOnError: false
			});
		} catch (e) {
			console.log(e.message);
		};

		return (
			<div>
				<div className="value" dangerouslySetInnerHTML={{ __html: content }} />
				<Textarea 
					placeholder="Enter text in format LaTeX" 
					value={value}
					rows={1}
					onKeyUp={(e: any, v: string) => { this.setState({ value: v }); }} 
				/>
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