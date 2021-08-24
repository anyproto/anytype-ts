import * as React from 'react';
import { I, keyboard } from 'ts/lib';
import { Textarea } from 'ts/component';
import { observer } from 'mobx-react';
import { menuStore } from 'ts/store';
import 'katex/dist/katex.min.css';

const katex = require('katex');
require('katex/dist/contrib/mhchem.min.js');

interface Props extends I.BlockComponent {};
interface State {
	value: string;
};

const BlockLatex = observer(class BlockLatex extends React.Component<Props, State> {

	_isMounted: boolean = false;

	state = {
		value: '',
	};

	constructor (props: any) {
		super(props);

		this.onKeyUp = this.onKeyUp.bind(this);
	};

	render () {
		const { rootId, block, readonly } = this.props;

		let { value } = this.state;
		let content = '';

		try {
			content = katex.renderToString(value, {
				macros: {
					'\\f': '#1f(#2)',
				},
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
					onKeyUp={this.onKeyUp} 
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

	onKeyUp (e: any, v: string) {
		const { block } = this.props;

		keyboard.shortcut('\\', e, (pressed: any) => {
			menuStore.open('blockLatex', {
				element: `#block-${block.id}`
			});
		});

		this.setState({ value: v });
	};
	
});

export default BlockLatex;