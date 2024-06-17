import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { Icon, Input, Button } from 'Component';
import { I, keyboard, focus, translate, Action } from 'Lib';
const Constant = require('json/constant.json');

interface Props {
	icon?: string;
	textUrl?: string;
	textFile?: string;
	withFile?: boolean;
	accept?: string[];
	block?: I.Block;
	readonly?: boolean;
	canResize?: boolean;
	onChangeUrl? (e: any, url: string): void;
	onChangeFile? (e: any, path: string): void;
};

interface State {
	focused: boolean;
	size: Size;
};

const SMALL_WIDTH = 248;
const ICON_WIDTH = 60;

enum Size { Icon = 0, Small = 1, Full = 2 };

class InputWithFile extends React.Component<Props, State> {

	public static defaultProps = {
		withFile: true,
		canResize: true,
	};

	_isMounted = false;
	node: any = null;
	state = {
		focused: false,
		size: Size.Full,
	};
	t = 0;
	refUrl: any = null;

	constructor (props: Props) {
		super(props);
		
		this.onSubmit = this.onSubmit.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onClickFile = this.onClickFile.bind(this);
	};
	
	render () {
		const { focused, size } = this.state;
		const { icon, textUrl = translate('inputWithFileTextUrl'), textFile, withFile, readonly } = this.props;
		const cn = [ 'inputWithFile', 'resizable' ];		
		const or = ` ${translate('commonOr')} `;
		const onBlur = focused ? this.onBlur : null;
		const onFocus = !focused ? this.onFocus : null;
		const isSmall = size == Size.Small;
		const isIcon = size == Size.Icon;

		let placeholder = textUrl;
		let onClick = null;
		
		if (!withFile) {
			cn.push('noFile');
		};
		
		if (isSmall) {
			cn.push('isSmall');
		};

		if (readonly) {
			cn.push('isReadonly');
		};
		
		if (isIcon) {
			cn.push('isIcon');
			onClick = e => this.onClickFile(e);
		};
		
		if (focused) {
			cn.push('isFocused');
		};
		
		if (withFile && focused) {
			placeholder += or + (!isSmall ? textFile : '');
		};
		
		return (
			<div 
				ref={node => this.node = node}
				className={cn.join(' ')}
				onClick={onClick}
			>
				{icon ? <Icon className={icon} /> : ''}
			
				<div id="text" className="txt">
					<form id="form" onSubmit={this.onSubmit}>
						{focused ? (
							<React.Fragment>
								<Input 
									id="url" 
									ref={ref => this.refUrl = ref}
									placeholder={placeholder}
									onPaste={e => this.onChangeUrl(e, true)} 
									onFocus={onFocus} 
									onBlur={onBlur} 
								/>
								<Button type="input" className="dn" />
							</React.Fragment>
						) : (
							<span className="urlToggle" onClick={this.onFocus}>{textUrl + (withFile && isSmall ? or : '')}</span>
						)}
					</form>

					{withFile ? (
						<span className="fileWrap" onMouseDown={this.onClickFile}>
							{!isSmall ? <span>&nbsp;{translate('commonOr')}&nbsp;</span> : ''}
							<span className="border">{textFile}</span>
						</span>
					) : ''}
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.resize();
		this.rebind();
	};
	
	componentDidUpdate () {
		const { focused } = this.state;
		const { block } = this.props;
		
		this.resize();
		this.rebind();
		
		if (focused) {
			if (this.refUrl) {
				this.refUrl.focus();
			};
			focus.set(block.id, { from: 0, to: 0 });
		};
	};
	
	componentWillUnmount () {
		const { focused } = focus.state;
		const { block } = this.props;
		
		this._isMounted = false;
		this.unbind();
		
		if (focused == block.id) {
			keyboard.setFocus(false);
		};
	};
	
	rebind () {
		const { canResize } = this.props;
		if (!this._isMounted || !canResize) {
			return;
		};
		
		$(this.node).off('resizeMove').on('resizeMove', (e: any) => this.resize());
	};
	
	unbind () {
		const { canResize } = this.props;
		if (!this._isMounted || !canResize) {
			return;
		};
		
		$(this.node).off('resizeMove');
	};
	
	resize () {
		const { canResize } = this.props;
		if (!canResize) {
			return;
		};

		raf(() => {
			if (!this._isMounted) {
				return;
			};
			
			const node = $(this.node);
			const rect = (node.get(0) as HTMLInputElement).getBoundingClientRect();
			
			let size = Size.Full;
			if (rect.width <= SMALL_WIDTH) {
				size = Size.Small;
			};
			if (rect.width <= ICON_WIDTH) {
				size = Size.Icon;
			};
			
			if (size != this.state.size) {
				this.setState({ size });	
			};
		});
	};
	
	onFocus (e: any) {
		e.stopPropagation();

		const { readonly } = this.props;
		if (readonly) {
			return;
		};
		this.setState({ focused: true });
	};
	
	onBlur (e: any) {
		e.stopPropagation();
		this.setState({ focused: false });
	};
	
	focus () {
		this.setState({ focused: true });
	};
	
	onChangeUrl (e: any, force: boolean) {
		const { onChangeUrl, readonly } = this.props;
		
		if (readonly) {
			return;
		};
		
		window.clearTimeout(this.t);
		this.t = window.setTimeout(() => {
			if (!this.refUrl) {
				return;
			};
			
			const url = this.refUrl.getValue() || '';
			if (!url) {
				return;
			};
			
			if (onChangeUrl) {
				onChangeUrl(e, url);
			};
		}, force ? 50 : Constant.delay.keyboard);
	};
	
	onClickFile (e: any) {
		const { onChangeFile, accept, readonly } = this.props;
		
		e.preventDefault();
		e.stopPropagation();

		if (readonly) {
			return;
		};

		Action.openFile(accept, paths => {
			if (onChangeFile) {
				onChangeFile(e, paths[0]);	
			};
		});
	};
	
	onSubmit (e: any) {
		e.preventDefault();
		this.onChangeUrl(e, true);
	};
	
};

export default InputWithFile;