import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Textarea } from 'ts/component';
import { I, keyboard } from 'ts/lib';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

const $ = require('jquery');

@observer
class MenuText extends React.Component<Props, {}> {
	
	_isMounted: boolean = false;
	ref: any = null;

	constructor (props: any) {
		super(props);

		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onBlur = this.onBlur.bind(this);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { value } = data;

		return (
			<div>
				<Textarea 
					ref={(ref: any) => { this.ref = ref; }} 
					id="input" 
					value={value}
					onKeyDown={this.onKeyDown} 
					onKeyUp={this.onKeyUp} 
					onBlur={this.onBlur}
				/>
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;

		const { param } = this.props;
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

		window.setTimeout(() => { this.resize(); }, 15);
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	onKeyDown (e: any) {
	};

	onKeyUp (e: any) {
		keyboard.shortcut('enter, backspace', e, (pressed: string) => {
			this.resize();
		});
	};

	onBlur (e: any) {
		const { param, close } = this.props;
		const { data } = param;
		const { onChange } = data;

		onChange(this.ref.getValue());
		close();
	};

	resize () {
		if (!this._isMounted) {
			return;
		};

		const { position } = this.props;
		const node = $(ReactDOM.findDOMNode(this));
		const input = node.find('#input');
		const win = $(window);
		const wh = win.height();

		input.css({ height: 'auto' });
		const sh = input.get(0).scrollHeight;

		input.css({ height: Math.min(wh - 78, sh) });
		input.scrollTop(sh);

		position();
	};

};

export default MenuText;