import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Editable } from 'Component';
import { I, J, U } from 'Lib';

const MenuText = observer(class MenuText extends React.Component<I.Menu> {
	
	_isMounted = false;
	node: any = null;

	constructor (props: I.Menu) {
		super(props);

		this.onInput = this.onInput.bind(this);
		this.onBlur = this.onBlur.bind(this);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { value, placeholder, canEdit } = data;

		return (
			<Editable
				ref={node => this.node = node}
				id="input"
				placeholder={placeholder}
				readonly={!canEdit}
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

		if (this.node) {
			this.node.setValue(U.Common.htmlSpecialChars(value));
			this.node.setRange({ from: length, to: length });
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
	};

	onBlur (e: any) {
		// this.save();
	};

	save () {
		const { param } = this.props;
		const { data } = param;
		const { onChange } = data;

		if (onChange) {
			onChange(this.getValue().trim());
		};
	};

	getValue (): string {
		return this.node ? this.node.getTextValue() : '';
	};

	placeholderCheck () {
		if (this.node) {
			this.node.placeholderCheck();
		};
	};

	placeholderHide () {
		if (this.node) {
			this.node.placeholderHide();
		};
	};
	
	placeholderShow () {
		if (this.node) {
			this.node.placeholderShow();
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
		const hh = J.Size.header;
		const cell = $(`#${cellId}`);

		raf(() => {
			const sh = input.get(0).scrollHeight;
			const height = Math.max(32, Math.min(wh - hh - 20, Math.max(cell.outerHeight(), sh)));

			obj.css({ height });
			position();
		});
	};

});

export default MenuText;
