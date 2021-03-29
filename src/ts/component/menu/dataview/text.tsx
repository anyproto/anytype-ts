import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Textarea } from 'ts/component';
import { I, keyboard } from 'ts/lib';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

const $ = require('jquery');
const raf = require('raf');

@observer
class MenuText extends React.Component<Props, {}> {
	
	_isMounted: boolean = false;
	ref: any = null;

	constructor (props: any) {
		super(props);

		this.onInput = this.onInput.bind(this);
		this.onBlur = this.onBlur.bind(this);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { value } = data;

		return (
			<Textarea 
				ref={(ref: any) => { this.ref = ref; }} 
				id="input" 
				value={value}
				onBlur={this.onBlur}
				onInput={this.onInput}
			/>
		);
	};

	componentDidMount () {
		this._isMounted = true;

		const { param, getId } = this.props;
		const { data } = param;
		const { value } = data;
		const node = $(ReactDOM.findDOMNode(this));
		const input = node.find('#input');

		this.ref.focus();
		this.ref.setValue(value);

		if (input.length) {
			let length = value.length;
			input.get(0).setSelectionRange(length, length);
		};

		this.resize();
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	onInput (e: any) {
		this.resize();
	};

	onBlur (e: any) {
		const { param, close } = this.props;
		const { data } = param;
		const { onChange } = data;

		onChange(this.ref.getValue());
		close();
	};

	resize () {
		raf(() => {
			if (!this._isMounted) {
			return;
		};

		const { position } = this.props;
		const node = $(ReactDOM.findDOMNode(this));
		const win = $(window);
		const wh = win.height();

		node.css({ height: 'auto' });
		const sh = node.get(0).scrollHeight;

		console.log(sh);

		node.css({ height: Math.min(wh - 78, sh) });
		node.scrollTop(sh);

		position();
		});
	};

};

export default MenuText;