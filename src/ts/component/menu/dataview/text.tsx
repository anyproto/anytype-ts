import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, Util, keyboard, translate } from 'ts/lib';
import { observer } from 'mobx-react';
import { setRange } from 'selection-ranges';

interface Props extends I.Menu {}

const $ = require('jquery');
const raf = require('raf');

const MenuText = observer(class MenuText extends React.Component<Props, {}> {
	
	_isMounted: boolean = false;
	ref: any = null;

	constructor (props: any) {
		super(props);

		this.onInput = this.onInput.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { value, placeholder } = data;
		const relation = data.relation.get();

		return (
			<div>
				<div 
					id="input"
					ref={(ref: any) => { this.ref = ref; }} 
					contentEditable={true}
					suppressContentEditableWarning={true}
					onFocus={this.onFocus}
					onBlur={this.onBlur}
					onInput={this.onInput}
					onPaste={this.onInput}
				>
					{value}
				</div>
				<div id="placeholder" className="placeholder">
					{placeholder || translate(`placeholderCell${relation.format}`)}
				</div>
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;

		const { param } = this.props;
		const { data } = param;
		const { value } = data;
		const node = $(ReactDOM.findDOMNode(this));
		const input = node.find('#input').get(0);
		const length = value.length;

		input.focus({ preventScroll: true });
		setRange(input, { start: length, end: length });

		this.resize();
		this.placeholderCheck();
	};

	componentWillUnmount () {
		this.save();
		this._isMounted = false;
	};

	onInput (e: any) {
		this.resize();
		this.placeholderCheck();
	};

	onFocus () {
		keyboard.setFocus(true);
	};

	onBlur (e: any) {
		this.save();
		this.props.close();
	};

	save () {
		const { param } = this.props;
		const { data } = param;
		const { onChange } = data;

		keyboard.setFocus(false);
		onChange(this.getValue().trim());
	};

	getValue (): string {
		if (!this._isMounted) {
			return '';
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		const input = node.find('#input');

		return String(input.get(0).innerText || '');
	};

	placeholderCheck () {
		this.getValue() ? this.placeholderHide() : this.placeholderShow();			
	};

	placeholderHide () {
		if (!this._isMounted) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		node.find('#placeholder').hide();
	};
	
	placeholderShow () {
		if (!this._isMounted) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		node.find('#placeholder').show();
	};

	resize () {
		if (!this._isMounted) {
			return;
		};

		const { position, getId } = this.props;

		raf(() => {
			const obj = $(`#${getId()}`);
			const input = obj.find('#input');
			const win = $(window);
			const wh = win.height();
			const hh = Util.sizeHeader();
			const o = obj.offset();
	
			obj.css({ height: 'auto' });
			input.css({ height: 'auto' });
	
			const sh = input.get(0).scrollHeight;
			input.css({ height: Math.min(wh - hh - o.top - 20, sh) });
			input.scrollTop(sh);

			position();
		});
	};

});

export default MenuText;