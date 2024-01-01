import * as React from 'react';
import $ from 'jquery';
import { Input, Icon } from 'Component';
import { I, translate } from 'Lib';

interface Props {
	id?: string;
	className?: string;
	inputClassName?: string;
	icon?: string;
	value?: string;
	placeholder?: string;
	placeholderFocus?: string;
	tooltip?: string;
	tooltipCaption?: string;
	tooltipX?: I.MenuDirection.Left | I.MenuDirection.Center | I.MenuDirection.Right;
	tooltipY?: I.MenuDirection.Top | I.MenuDirection.Bottom;
	focusOnMount?: boolean;
	onClick?(e: any): void;
	onFocus?(e: any): void;
	onBlur?(e: any): void;
	onKeyDown?(e: any, v: string): void;
	onKeyUp?(e: any, v: string): void;
	onChange?(value: string): void;
	onClear?(): void;
	onIconClick?(e: any): void;
};

interface State {
	isActive: boolean;
};

class Filter extends React.Component<Props, State> {

	public static defaultProps = {
		className: '',
		inputClassName: '',
		tooltipY: I.MenuDirection.Bottom,
	};

	state = {
		isActive: false,
	};
	
	node: any = null;
	isFocused = false;
	placeholder: any = null;
	ref = null;

	constructor (props: Props) {
		super(props);

		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onChange = this.onChange.bind(this);
		this.onClear = this.onClear.bind(this);
	};
	
	render () {
		const { isActive } = this.state;
		const { id, value, icon, tooltip, tooltipCaption, tooltipX, tooltipY, placeholder = translate('commonFilterClick'), className, inputClassName, focusOnMount, onKeyDown, onKeyUp, onClick, onIconClick } = this.props;
		const cn = [ 'filter' ];

		if (className) {
			cn.push(className);
		};

		if (isActive) {
			cn.push('isActive');
		};

		let iconObj = null;
		if (icon) {
			iconObj = (
				<Icon 
					className={icon} 
					tooltip={tooltip}
					tooltipCaption={tooltipCaption}
					tooltipX={tooltipX}
					tooltipY={tooltipY}
					onClick={onIconClick} 
				/>
			);
		};

		return (
			<div
				ref={node => this.node = node}
				id={id} 
				className={cn.join(' ')}
				onClick={onClick}
			>
				<div className="inner">
					{iconObj}

					<div className="filterInputWrap">
						<Input 
							ref={ref => this.ref = ref}
							id="input"
							className={inputClassName}
							value={value}
							focusOnMount={focusOnMount}
							onFocus={this.onFocus} 
							onBlur={this.onBlur} 
							onChange={this.onChange} 
							onKeyDown={onKeyDown}
							onKeyUp={onKeyUp}
						/>
						<div id="placeholder" className="placeholder">{placeholder}</div>
					</div>

					<Icon className="clear" onClick={this.onClear} />
				</div>
				<div className="line" />
			</div>
		);
	};

	componentDidMount() {
		const node = $(this.node);

		this.ref.setValue(this.props.value);
		this.placeholder = node.find('#placeholder');

		this.checkButton();
		this.resize();
	};

	componentDidUpdate () {
		this.checkButton();
		this.resize();
	};

	focus () {
		this.ref.focus();
		this.checkButton();
	};

	blur () {
		this.ref.blur();
	};

	setRange (range: I.TextRange) {
		this.ref.setRange(range);
	};

	onFocus (e: any) {
		const { placeholderFocus, onFocus } = this.props;

		this.isFocused = true;
		this.addFocusedClass();

		if (placeholderFocus) {
			this.placeholderSet(placeholderFocus);
		};

		if (onFocus) { 
			onFocus(e);
		};
	};
	
	onBlur (e: any) {
		const { placeholderFocus, placeholder, onBlur } = this.props;

		this.isFocused = false;
		this.removeFocusedClass();

		if (placeholderFocus) {
			this.placeholderSet(placeholder);
		};

		if (onBlur) {
			onBlur(e);
		};
	};

	addFocusedClass () {
		this.addClass('isFocused');
	};

	removeFocusedClass () {
		this.removeClass('isFocused');
	};

	addClass (c: string) {
		$(this.node).addClass(c);
	};

	removeClass (c: string) {
		$(this.node).removeClass(c);
	};

	setActive (v: boolean) {
		this.setState({ isActive: v });
	};

	onClear (e: any) {
		e.preventDefault();
		e.stopPropagation();

		const { onClear } = this.props;

		this.ref.setValue('');
		this.ref.focus();
		this.onChange(e, '');

		if (onClear) {
			onClear();
		};
	};

	onChange (e: any, v: string) {	
		const { onChange } = this.props;

		this.checkButton();

		if (onChange) {
			onChange(v);
		};
	};

	checkButton () {
		const node = $(this.node);

		this.getValue() ? node.addClass('active') : node.removeClass('active');
		this.placeholderCheck();
	};

	setValue (v: string) {
		this.ref.setValue(v);
		this.checkButton();
	};

	getValue () {
		return this.ref.getValue();
	};

	placeholderCheck () {
		this.getValue() ? this.placeholderHide() : this.placeholderShow();	
	};

	placeholderSet (v: string) {
		this.placeholder.text(v);
	};
	
	placeholderHide () {
		this.placeholder.hide();
	};

	placeholderShow () {
		this.placeholder.show();
	};

	resize () {
		this.placeholder.css({ lineHeight: this.placeholder.height() + 'px' });
	};

};

export default Filter;