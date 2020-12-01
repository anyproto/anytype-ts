import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Textarea } from 'ts/component';
import { I, C, DataUtil } from 'ts/lib';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

const $ = require('jquery');
const raf = require('raf');

@observer
class MenuText extends React.Component<Props, {}> {
	
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

		window.setTimeout(() => { this.resize(); });
	};

	onKeyDown (e: any) {
		this.resize();
	};

	onKeyUp (e: any) {
		this.resize();
	};

	onBlur (e: any) {
		const { param } = this.props;
		const { data } = param;
		const { onChange } = data;

		onChange(this.ref.getValue());
	};

	resize () {
		const { position } = this.props;
		const node = $(ReactDOM.findDOMNode(this));
		const input = node.find('#input');
		const win = $(window);
		const wh = win.height();

		raf(() => {
			input.css({ height: 'auto', overflow: 'visible' });
		
			const sh = input.get(0).scrollHeight;

			console.log(sh);

			input.css({ height: Math.min(wh - 76, sh), overflow: 'auto' });
			input.scrollTop(sh);

			position();
		});
	};

};

export default MenuText;