import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, keyboard, Util } from 'ts/lib';
import { Textarea } from 'ts/component';
import { observer } from 'mobx-react';
import { menuStore, commonStore } from 'ts/store';
import 'katex/dist/katex.min.css';

interface Props extends I.BlockComponent {};
interface State {
	value: string;
};

const $ = require('jquery');
const katex = require('katex');
require('katex/dist/contrib/mhchem.min.js');

const BlockLatex = observer(class BlockLatex extends React.Component<Props, State> {

	_isMounted: boolean = false;
	ref: any = null;

	state = {
		value: '',
	};

	constructor (props: any) {
		super(props);

		this.onKeyUp = this.onKeyUp.bind(this);
		this.onChange = this.onChange.bind(this);
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
					id="input"
					ref={(ref: any) => { this.ref = ref; }}
					placeholder="Enter text in format LaTeX" 
					value={value}
					onKeyUp={this.onKeyUp} 
					onChange={this.onChange}
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
		const { filter } = commonStore;
		const { rootId, block } = this.props;

		const k = e.key.toLowerCase();
		const node = $(ReactDOM.findDOMNode(this));
		const el: any = node.find('#input').get(0);
		const start = el.selectionStart;
		const symbolBefore = v[start - 1];
		const menuOpen = menuStore.isOpen('blockLatex');

		if ((symbolBefore == '\\') && !keyboard.isSpecial(k)) {
			commonStore.filterSet(start, '');

			menuStore.open('blockLatex', {
				element: `#block-${block.id} #input`,
				data: {
					rootId: rootId,
					blockId: block.id,
				}
			});
		};

		if (menuOpen) {
			const d = start - filter.from;
			if (d >= 0) {
				const part = v.substr(filter.from, d).replace(/^\\/, '');
				commonStore.filterSetText(part);
			};
		};
		this.setState({ value: v });
	};

	onChange (e: any, v: string) {
		this.setState({ value: v });
	};
	
});

export default BlockLatex;