import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, IconUser, Switch, Button, Title, Label, Cover, Textarea, Input, Loader } from 'ts/component';
import { I, C, Storage, Key, Util, DataUtil } from 'ts/lib';
import { authStore, blockStore, commonStore } from 'ts/store';
import { observer } from 'mobx-react';

const { dialog } = window.require('electron').remote;
const $ = require('jquery');
const raf = require('raf');
const Constant: any = require('json/constant.json');
const sha1 = require('sha1');

interface Props extends I.Popup {
	history: any;
};

interface State {
	page: string;
	loading: boolean;
};

@observer
class PopupSettings extends React.Component<Props, State> {

	phraseRef: any = null;
	refObj: any = {};
	pin: string = '';
	state = {
		page: 'index',
		loading: false,
	};
	onConfirmPin: any = null;
	
	constructor (props: any) {
		super(props);
		
		this.onClose = this.onClose.bind(this);
		this.onPage = this.onPage.bind(this);
		this.onCover = this.onCover.bind(this);
		this.onLogout = this.onLogout.bind(this);
		this.onFocusPhrase = this.onFocusPhrase.bind(this);
		this.onFocusPin = this.onFocusPin.bind(this);
		this.onBlurPin = this.onBlurPin.bind(this);
		this.onChangePin = this.onChangePin.bind(this);
		this.onSelectPin = this.onSelectPin.bind(this);
		this.onTurnOffPin = this.onTurnOffPin.bind(this);
		this.onFileClick = this.onFileClick.bind(this);
	};
	
	render () {
		const { account } = authStore;
		const { coverId, coverImg } = commonStore;
		const { page, loading } = this.state;
		const pin = Storage.get('pin');

		let content = null;
		let inputs = [];
		
		let head = (
			<div className="head">
				<div className="element" onClick={() => { this.onPage('index'); }}>
					<Icon className="back" />
					Settings
				</div>
			</div>
		);
		
		switch (page) {
			
			default:
			case 'index':
				content = (
					<div>
						<Title text="Settings" />
						
						<div className="rows">
							<div className="row" onClick={() => { this.onPage('wallpaper'); }}>
								<Icon className="wallpaper" />
								<Label text="Wallpaper" />
								<Icon className="arrow" />
							</div>
							
							<div className="row" onClick={() => { this.onPage('phrase'); }}>
								<Icon className="phrase" />
								<Label text="Keychain phrase" />
								<Icon className="arrow" />
							</div>
							
							<div className="row" onClick={() => { this.onPage('pinIndex'); }}>
								<Icon className="pin" />
								<Label text="Pin code" />
								<div className="status">
									{pin ? 'On' : 'Off'}
								</div>
								<Icon className="arrow" />
							</div>
						</div>
						
						<div className="logout" onClick={this.onLogout}>Log out</div>
					</div>
				);
				break;
				
			case 'wallpaper':
				let covers1 = [];
				let covers2 = [];
				
				for (let i = 1; i <= 10; ++i) {
					covers1.push({ id: i, image: '', type: I.CoverType.Color });
				};
				
				for (let i = 11; i <= 17; ++i) {
					covers2.push({ id: i, image: '', type: I.CoverType.Image });
				};
				
				if (coverImg) {
					covers2.unshift({ id: 0, image: coverImg, type: I.CoverType.Upload });
				};
				
				const Item = (item: any) => (
					<div className={'item ' + (item.active ? 'active': '')} onClick={() => { this.onCover(item); }}>
						<Cover type={I.CoverType.Image} num={item.id} image={item.image} />
					</div>
				);
				
				content = (
					<div>
						{loading ? <Loader /> : ''}

						{head}
						
						<Title text="Wallpaper" />
						
						<div className="row first">
							<Label text="Choose or upload the wallpaper. For best results upload high resolution images." />
							<div className="fileWrap item" onClick={this.onFileClick}>
								<Cover className="upload" />
							</div>
						</div>
						
						<div className="row">
							<Label className="name" text="Colours" />
							<div className="covers">
								{covers1.map((item: any, i: number) => (
									<Item key={i} {...item} active={item.id == coverId} />
								))}
							</div>
						</div>
						
						<div className="row last">
							<Label className="name" text="Pictures" />
							<div className="covers">
								{covers2.map((item: any, i: number) => (
									<Item key={i} {...item} active={item.id == coverId} />
								))}
							</div>
						</div>
					</div>
				);
				break;
				
			case 'phrase':
				content = (
					<div>
						{head}
						
						<Title text="Keychain phrase" />
						<Label text="Your Keychain phrase protects your account. You’ll need it to sign in if you don’t have access to your devices. Keep it in a safe place." />
						<div className="inputs">
							<Textarea ref={(ref: any) => this.phraseRef = ref} value={authStore.phrase} onFocus={this.onFocusPhrase} placeHolder="witch collapse practice feed shame open despair creek road again ice least lake tree young address brain envelope" />
						</div>
					</div>
				);
				break;
				
			case 'pinIndex':
				content = (
					<div>
						{head}
						
						<Title text="Pin code" />
						<Label text="The pin code will protect your keychain phrase. As we do not store your keychain phrase or pin code and do not ask your e-mail or phone number, there is no id recovery without your pin code or keychain phrase. So, please, remember your pin code" />
						
						{pin ? (
							<div className="buttons">
								<Button text="Turn pin code off" className="blank" onClick={this.onTurnOffPin} />
								<Button text="Change pin code" className="blank" onClick={() => {
									this.onConfirmPin = this.onSelectPin; 
									this.onPage('pinConfirm');
								}} />
							</div>
						): (
							<div className="buttons">
								<Button text="Turn pin code on" className="blank" onClick={() => {
									this.onConfirmPin = this.onSelectPin; 
									this.onPage('pinSelect');
								}} />
							</div>
						)}
						
					</div>
				);
				break;
				
			case 'pinSelect':
				inputs = [];
				for (let i = 1; i <= Constant.pinSize; ++i) {
					inputs.push({ id: i });
				};
			
				content = (
					<div>
						{head}
						
						<Title text="Pin code" />
						<Label text="The pin code will protect your secret phrase. As we do not store your secret phrase or pin code and do not ask your e-mail or phone number, there is no id recovery without your pin code or secret phrase. So, please, remember your pin code." />
						<div className="inputs">
							{inputs.map((item: any, i: number) => (
								<Input ref={(ref: any) => this.refObj[item.id] = ref} maxLength={1} key={i} onFocus={(e) => { this.onFocusPin(e, item.id); }} onBlur={(e) => { this.onBlurPin(e, item.id); }} onKeyUp={(e: any) => { this.onChangePin(e, item.id); }} />
							))}
						</div>
						<Button text="Confirm" className="orange" onClick={this.onSelectPin} />
					</div>
				);
				break;
				
			case 'pinConfirm':
				inputs = [];
				for (let i = 1; i <= Constant.pinSize; ++i) {
					inputs.push({ id: i });
				};
			
				content = (
					<div>
						{head}
						
						<Title text="Pin code" />
						<Label text="To continue, first verify that it’s you. Enter current pin code" />
						<div className="inputs">
							{inputs.map((item: any, i: number) => (
								<Input ref={(ref: any) => this.refObj[item.id] = ref} maxLength={1} key={i} onFocus={(e) => { this.onFocusPin(e, item.id); }} onBlur={(e) => { this.onBlurPin(e, item.id); }} onKeyUp={(e: any) => { this.onChangePin(e, item.id); }} />
							))}
						</div>
						<Button text="Confirm" className="orange" onClick={() => { this.onPage('index'); }} />
					</div>
				);
				break;
		};
		
		return (
			<div className={'tab ' + Util.toCamelCase('tab-' + page)}>
				{content}
			</div>
		);
	};
	
	componentDidMount () {
		this.init();
	};
	
	componentDidUpdate () {
		this.init();
	};
	
	componentWillUnmount () {
		$(window).unbind('resize.settings');
	};
	
	onFileClick (e: any) {
		const { root } = blockStore;
		const options: any = { 
			properties: [ 'openFile' ], 
			filters: [ { name: '', extensions: Constant.extension.image } ] 
		};
		
		dialog.showOpenDialog(options).then((result: any) => {
			const files = result.filePaths;
			if ((files == undefined) || !files.length) {
				return;
			};

			this.setState({ loading: true });

			C.UploadFile('', files[0], I.FileType.Image, true, (message: any) => {
				if (message.error.code) {
					return;
				};
				
				this.setState({ loading: false });
				commonStore.coverSetImage(message.hash);
				DataUtil.pageSetCover(root, I.CoverType.Image, message.hash);
			});
		});
	};
	
	onFocusPhrase (e: any) {
		this.phraseRef.select();
	};
	
	onFocusPin (e: any, id: number) {
		this.refObj[id].addClass('active');
	};
	
	onBlurPin (e: any, id: number) {
		this.refObj[id].removeClass('active');
	};
	
	onChangePin (e: any, id: number) {
		const { history } = this.props;
		
		let k = e.which;
		let input = this.refObj[id];
		let prev = this.refObj[id - 1];
		let next = this.refObj[id + 1];
		let v = input.getValue();
		
		input.setType(input.getValue() ? 'password' : 'text');
		
		if ((k == Key.backspace) && prev) {
			prev.setValue('');
			prev.setType('text');
			prev.focus();
		} else 
		if (v && next) {
			next.focus();	
		};
		
		let pin = this.getPin();
		if (pin.length == Constant.pinSize) {
			this.pin = pin;
			
			if (this.onConfirmPin) {
				this.onConfirmPin();
				this.onConfirmPin = null;
			};
		};
	};
	
	onSelectPin () {
		if (this.pin.length == Constant.pinSize) {
			Storage.set('pin', sha1(this.pin));
		};
		
		this.onPage('index');
	};
	
	onTurnOffPin () {
		Storage.delete('pin');
		this.onPage('index');
	};
	
	getPin () {
		let c: string[] = [];
		for (let i in this.refObj) {
			c.push(this.refObj[i].getValue());
		};
		return c.join('');
	};
	
	onClose () {
		commonStore.popupClose(this.props.id);
	};
	
	onPage (id: string) {
		this.setState({ page: id });
	};
	
	onCover (item: any) {
		commonStore.coverSetNum(item.id);
	};
	
	onLogout (e: any) {
		const { history } = this.props;
		
		C.AccountStop(false);
		authStore.logout();
		history.push('/');
	};
	
	init () {
		this.resize();
		$(window).unbind('resize.settings').on('resize.settings', () => { this.resize(); });
		
		window.setTimeout(() => {
			if (this.refObj[1]) {
				this.refObj[1].focus();
			};
		}, 15);
	};
	
	resize () {
		const obj = $('#popupSettings');
		raf(() => {
			obj.css({ marginTop: -obj.outerHeight() / 2 });
		});
	};
	
};

export default PopupSettings;