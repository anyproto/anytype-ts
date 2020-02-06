import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, Input, Button } from 'ts/component';
import { focus, Util } from 'ts/lib';

const { dialog } = window.require('electron').remote;

const $ = require('jquery');
const raf = require('raf');
const SMALL_WIDTH = 220;

interface Props {
	icon?: string;
	textUrl?: string;
	textFile?: string;
	withFile?: boolean;
	accept?: string[];
	onChangeUrl? (e: any, url: string): void;
	onChangeFile? (e: any, path: string): void;
};

interface State {
	focused: boolean;
	small: boolean;
};

class InputWithFile extends React.Component<Props, State> {

	private static defaultProps = {
		textUrl: 'Paste a link',
		withFile: true,
	};
	
	_isMounted: boolean = false;
	state = {
		focused: false,
		small: false 
	};
	
	t = 0;
	urlRef: any = null;

	constructor (props: any) {
		super(props);
		
		this.onSubmit = this.onSubmit.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onClickFile = this.onClickFile.bind(this);
	};
	
	render () {
		const { focused, small } = this.state;
		const { icon, textUrl, textFile, withFile } = this.props;

		let cn = [ 'inputWithFile' ];		
		let placeHolder = textUrl;
		let onFocus = focused ? () => {} : this.onFocus;
		let onBlur = focused ? this.onBlur : () => {};
		let or = ' or ';
		
		if (!withFile) {
			cn.push('noFile');
		};
		if (small) {
			cn.push('small');
		};
		if (focused) {
			cn.push('focused');
		};
		
		if (withFile && focused) {
			placeHolder += or + (!small ? textFile : '');
		};
		
		return (
			<div className={cn.join(' ')}>
				{icon ? <Icon className={icon} /> : ''}
			
				<div id="text" className="txt">
					<form id="form" onSubmit={this.onSubmit}>
						{focused ? (
							<span>
								<Input id="url" ref={(ref: any) => { this.urlRef = ref; }} placeHolder={placeHolder} onKeyDown={this.onKeyDown} onKeyUp={(e: any) => { this.onChangeUrl(e, false); }} onFocus={onFocus} onBlur={onBlur} />
								<Button type="input" className="dn" />
							</span>
						) : (
							<span className="urlToggle" onClick={this.onFocus}>{textUrl + (withFile && small ? or : '')}</span>
						)}
					</form>
					{withFile ? (
						<span className="fileWrap" onMouseDown={this.onClickFile}>
							{!small ? <span>&nbsp;or&nbsp;</span> : ''}
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
	};
	
	componentDidUpdate () {
		this.resize();
		
		if (this.state.focused && this.urlRef) {
			this.urlRef.focus();
		};
	};
	
	componentWillUnmount () {
		this._isMounted = false;
	};
	
	resize () {
		raf(() => {
			if (!this._isMounted) {
				return;
			};
			
			const node = $(ReactDOM.findDOMNode(this));
			const width = node.find('#text').width();
			const small = width < SMALL_WIDTH ? true : false;
			
			if (small != this.state.small) {
				this.setState({ small: small });	
			};
		});
	};
	
	onFocus (e: any) {
		e.stopPropagation();
		this.setState({ focused: true });
	};
	
	onBlur (e: any) {
		e.stopPropagation();
		this.setState({ focused: false });
	};
	
	focus () {
		this.setState({ focused: true });
	};
	
	onKeyDown (e: any) {
	};
	
	onChangeUrl (e: any, force: boolean) {
		const { onChangeUrl } = this.props;
		
		focus.clear();
		
		window.clearTimeout(this.t);
		this.t = window.setTimeout(() => {
			if (!this.urlRef) {
				return;
			};
			
			let url = this.urlRef.getValue() || '';
			if (!url) {
				return;
			};
			
			if (!url.match(/^[^:]+:\/\//)) {
				url = 'http://' + url;
			};
			
			if (onChangeUrl) {
				onChangeUrl(e, url);
			};
		}, force ? 0 : 1000);
	};
	
	onClickFile (e: any) {
		const { onChangeFile, accept } = this.props;
		
		e.preventDefault();
		e.stopPropagation();
		focus.clear();
		
		let options: any = { 
			properties: [ 'openFile' ], 
			filters: [  ] 
		};
		if (accept) {
			options.filters = [
				{ name: '', extensions: accept }
			];
		};
		
		dialog.showOpenDialog(null, options, (files: any[]) => {
			if ((files == undefined) || !files.length) {
				return;
			};
			
			if (onChangeFile) {
				onChangeFile(e, files[0]);	
			};
		});
	};
	
	onSubmit (e: any) {
		e.preventDefault();
		this.onChangeUrl(e, true);
	};
	
};

export default InputWithFile;