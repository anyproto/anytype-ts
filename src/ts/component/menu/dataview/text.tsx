import * as React from 'react';
import * as ReactDOM from 'react-dom';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { setRange } from 'selection-ranges';
import { Editable } from 'Component';
import { I, Util, keyboard, translate } from 'Lib';

interface Props extends I.Menu {}

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
			<Editable
				ref={(ref: any) => { this.ref = ref; }}
				id="input"
				placeholder={placeholder || translate(`placeholderCell${relation.format}`)}
				onFocus={this.onFocus}
				onBlur={this.onBlur}
				onInput={this.onInput}
				onPaste={this.onInput}
			/>
		);
	};

	componentDidMount () {
		this._isMounted = true;

		const { param } = this.props;
		const { data } = param;
		const { value } = data;
		const length = value.length;

		if (this.ref) {
			this.ref.setValue(value);
			this.ref.setRange({ from: length, to: length });
		};

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
	};

	save () {
		const { param } = this.props;
		const { data } = param;
		const { onChange } = data;

		keyboard.setFocus(false);
		onChange(this.getValue().trim());
	};

	getValue (): string {
		return this.ref ? this.ref.getTextValue() : '';
	};

	placeholderCheck () {
		if (this.ref) {
			this.ref.placeholderCheck();
		};
	};

	placeholderHide () {
		if (this.ref) {
			this.ref.placeholderHide();
		};
	};
	
	placeholderShow () {
		if (this.ref) {
			this.ref.placeholderShow();
		};
	};

	resize () {
		if (!this._isMounted) {
			return;
		};

		const { position, getId, param } = this.props;
		const { data } = param;
		const { cellId } = data;
		const win = $(window);
		const obj = $(`#${getId()}`);
		const input = obj.find('#input');
		const wh = win.height();
		const hh = Util.sizeHeader();
		const cell = $(`#${cellId}`);

		raf(() => {
			const sh = input.get(0).scrollHeight;
			const height = Math.max(32, Math.min(wh - hh - 20, Math.max(cell.outerHeight(), sh)));

			obj.css({ height });
			input.scrollTop(sh);
			position();
		});
	};

});

export default MenuText;