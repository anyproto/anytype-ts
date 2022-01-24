import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Icon, Button, Title, Label, Cover, Textarea, Loader, IconObject, Error, Pin, Select, Switch } from 'ts/component';
import { I, C, Storage, translate, Util, DataUtil, analytics } from 'ts/lib';
import { authStore, blockStore, commonStore, popupStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Popup, RouteComponentProps<any> {}

interface State {
	loading: boolean;
	error: string;
	entropy: string;
}

const { dialog } = window.require('@electron/remote');
const { ipcRenderer } = window.require('electron');
const $ = require('jquery');
const Constant: any = require('json/constant.json');
const sha1 = require('sha1');
const QRCode = require('qrcode.react');

const QRColor = {
	'': '#fff',
	dark: '#aca996'
};

const PopupSettings = observer(class PopupSettings extends React.Component<Props, State> {

	refPhrase: any = null;
	state = {
		loading: false,
		error: '',
		entropy: '',
	};
	prevPage: string = '';
	pinConfirmed: boolean = false;
	onConfirmPin: () => void = null;
	onConfirmPhrase: any = null;
	format: string = '';

	constructor (props: any) {
		super(props);

		this.onClose = this.onClose.bind(this);
		this.onPage = this.onPage.bind(this);
		this.onCover = this.onCover.bind(this);
		this.onLogout = this.onLogout.bind(this);
		this.onFocusPhrase = this.onFocusPhrase.bind(this);
		this.onBlurPhrase = this.onBlurPhrase.bind(this);
		this.onCheckPin = this.onCheckPin.bind(this);
		this.onSelectPin = this.onSelectPin.bind(this);
		this.onTurnOffPin = this.onTurnOffPin.bind(this);
		this.onFileClick = this.onFileClick.bind(this);
		this.elementBlur = this.elementBlur.bind(this);
		this.onFileOffload = this.onFileOffload.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { page } = data;
		const { account, phrase } = authStore;
		const { cover, coverImage, theme, config } = commonStore;
		const { loading, error, entropy } = this.state;
		const pin = Storage.get('pin');

		let content = null;
		let Item = null;

		let Head = (item: any) => (
			<div className="head">
				<div className="element" onClick={() => { this.onPage(item.id || this.prevPage); }}>
					<Icon className="back" />
					{item.name}
				</div>
			</div>
		);

		switch (page) {

			default:
			case 'index':
				content = (
					<div>
						<Title text={translate('popupSettingsTitle')} />

						<div className="rows">
							<div className="row" onClick={() => { this.onPage('wallpaper'); }}>
								<Icon className="wallpaper" />
								<Label text={translate('popupSettingsWallpaperTitle')} />
								<Icon className="arrow" />
							</div>

							<div 
								className="row" 
								onClick={() => { 
									this.onConfirmPhrase = null; 
									this.onPage('phrase'); 
								}}
							>
								<Icon className="phrase" />
								<Label text={translate('popupSettingsPhraseTitle')} />
								<Icon className="arrow" />
							</div>

							<div className="row" onClick={() => { this.onPage('pinIndex'); }}>
								<Icon className="pin" />
								<Label text={translate('popupSettingsPinTitle')} />
								<div className="status">
									{pin ? 'On' : 'Off'}
								</div>
								<Icon className="arrow" />
							</div>

							<div className="row" onClick={() => { this.onPage('importIndex'); }}>
								<Icon className="import" />
								<Label text={translate('popupSettingsImportTitle')} />
								<Icon className="arrow" />
							</div>

							<div className="row" onClick={() => { this.onPage('exportMarkdown'); }}>
								<Icon className="export" />
								<Label text={translate('popupSettingsExportTitle')} />
								<Icon className="arrow" />
							</div>

							<div className="row" onClick={() => { this.onPage('other'); }}>
								<Icon className="other" />
								<Label text={translate('popupSettingsOtherTitle')} />
								<Icon className="arrow" />
							</div>
						</div>

						<div className="logout" onClick={this.onLogout}>{translate('popupSettingsLogout')}</div>
					</div>
				);
				break;

			case 'wallpaper':
				let colors = [ 'yellow', 'orange', 'pink', 'red', 'purple', 'navy', 'blue', 'ice', 'teal', 'green' ];
				let gradients = [ 'yellow', 'red', 'blue', 'teal', 'pinkOrange', 'bluePink', 'greenOrange', 'sky' ];
				let covers1 = [];
				let covers2 = colors.map((it: string) => { return { id: it, image: '', type: I.CoverType.Color }; });
				let covers3 = gradients.map((it: string) => { return { id: it, image: '', type: I.CoverType.Gradient }; });

				if (coverImage) {
					covers1.push({ id: coverImage, image: coverImage, type: I.CoverType.Upload });
				};
				for (let i = 1; i <= 13; ++i) {
					covers1.push({ id: 'c' + i, image: '', type: I.CoverType.Image });
				};

				let sections = [
					{ name: translate('popupSettingsPicture'), children: covers1 },
					{ name: translate('popupSettingsColor'), children: covers2 },
					{ name: translate('popupSettingsGradient'), children: covers3 },
				];

				Item = (item: any) => (
					<div className={'item ' + (item.active ? 'active': '')} onClick={() => { this.onCover(item); }}>
						<Cover {...item} preview={true} className={item.id} />
					</div>
				);

				content = (
					<div>
						<Head id="index" name={translate('popupSettingsTitle')} />
						<Title text={translate('popupSettingsWallpaperTitle')} />

						<div className="row first">
							<Label text={translate('popupSettingsWallpaperText')} />
							<div className="fileWrap item" onClick={this.onFileClick}>
								<Cover className="upload" type={I.CoverType.Color} id="white" />
							</div>
						</div>

						{sections.map((section: any, i: number) => (
							<div key={i} className="row">
								<Label className="name" text={section.name} />
								<div className="covers">
									{section.children.map((item: any, i: number) => (
										<Item key={i} {...item} active={(item.id == cover.id) && (cover.type == item.type)} />
									))}
								</div>
							</div>
						))}
					</div>
				);
				break;

			case 'phrase':
				analytics.event('ScreenKeychain', {
					type: !this.onConfirmPhrase ? 'ScreenSettings' : 'BeforeLogout'
				});

				content = (
					<div>
						<Head id="index" name={translate('popupSettingsTitle')} />
						
						<Title text={translate('popupSettingsPhraseTitle')} />
						<Label text={translate('popupSettingsPhraseText')} />
						
						<div className="inputs">
							<Textarea 
								ref={(ref: any) => this.refPhrase = ref} 
								id="phrase" 
								value={phrase} 
								className="isBlurred"
								onFocus={this.onFocusPhrase} 
								onBlur={this.onBlurPhrase} 
								onCopy={() => { 
									analytics.event('KeychainCopy', { 
										type: !this.onConfirmPhrase ? 'ScreenSettings' : 'BeforeLogout'
									}); 
								}}
								placeholder="witch collapse practice feed shame open despair creek road again ice least lake tree young address brain envelope" 
								readonly={true} 
							/>
						</div>

						{!this.onConfirmPhrase ? (
							<div className="path">
								<div className="side left">
									<b>{translate('popupSettingsMobileQRSubTitle')}</b>
									<Label text={translate('popupSettingsMobileQRText')} />
								</div>
								<div className="side right isBlurred" onClick={this.elementUnblur}>
									<div className="qrWrap">
										<QRCode value={entropy} bgColor={QRColor[theme]} size={100} />
									</div>
								</div>
							</div>
						) : (
							<div className="buttons">
								<Button text={translate('popupSettingsPhraseOk')} onClick={() => { this.onConfirmPhrase(); }} />
							</div>
						)}
					</div>
				);
				break;

			case 'pinIndex':
				content = (
					<div>
						<Head id="index" name={translate('popupSettingsTitle')} />

						<Title text={translate('popupSettingsPinTitle')} />
						<Label text={translate('popupSettingsPinText')} />

						{pin ? (
							<div className="buttons">
								<Button 
									text={translate('popupSettingsPinOff')} 
									className="blank" 
									onClick={() => {
										this.onConfirmPin = this.onTurnOffPin;
										this.onPage('pinConfirm');

										analytics.event('PinCodeOff');
									}} 
								/>

								<Button 
									text={translate('popupSettingsPinChange')} 
									className="blank" 
									onClick={() => {
										this.onConfirmPin = () => { this.onPage('pinSelect'); };
										this.onPage('pinConfirm');

										analytics.event('PinCodeChange');
									}} 
								/>
							</div>
						): (
							<div className="buttons">
								<Button 
									text={translate('popupSettingsPinOn')} 
									className="blank" 
									onClick={() => {
										this.onPage('pinSelect');

										analytics.event('PinCodeOn');
									}} 
								/>
							</div>
						)}

					</div>
				);
				break;

			case 'pinSelect':
				content = (
					<div>
						<Head id="pinIndex" name={translate('commonCancel')} />

						<Title text={translate('popupSettingsPinTitle')} />
						<Label text={translate('popupSettingsPinText')} />

						<Pin onSuccess={this.onSelectPin} />
					</div>
				);
				break;

			case 'pinConfirm':
				content = (
					<div>
						<Head name={translate('commonCancel')} />

						<Title text={translate('popupSettingsPinTitle')} />
						<Label text={translate('popupSettingsPinVerify')} />
						<Error text={error} />

						<Pin 
							value={Storage.get('pin')} 
							onSuccess={this.onCheckPin} 
							onError={() => { this.setState({ error: translate('popupSettingsPinError') }) }} 
						/>
					</div>
				);
				break;

			case 'importIndex':
				const items = [
					{ id: 'notion', name: 'Notion', disabled: false },
					{ id: 'evernote', name: 'Evernote', disabled: true },
					{ id: 'roam', name: 'Roam Researh', disabled: true },
					{ id: 'word', name: 'Word', disabled: true },
					{ id: 'text', name: 'Text & Markdown', disabled: true },
					{ id: 'html', name: 'HTML', disabled: true },
					{ id: 'csv', name: 'CSV', disabled: true },
				];

				Item = (item: any) => (
					<div 
						className={[ 'item', item.id, (item.disabled ? 'disabled' : '') ].join(' ')} 
						onClick={() => {
							if (!item.disabled) {
								this.onPage(Util.toCamelCase('import-' + item.id));
							};
						}}
					>
						{item.disabled ? <div className="soon">{translate('commonSoon')}</div> : ''}
						<div className="txt">
							<Icon />
							<div className="name">{item.name}</div>
						</div>
					</div>
				);

				content = (
					<div>
						<Head id="index" name={translate('popupSettingsTitle')} />

						<Title text={translate('popupSettingsImportTitle')} />
						<Label text={translate('popupSettingsImportText')} />

						<div className="items">
							{items.map((item: any, i: number) => (
								<Item key={i} {...item} />
							))}
						</div>
					</div>
				);
				break;

			case 'importNotion':
				content = (
					<div>
						<Head id="importIndex" name={translate('popupSettingsImportTitle')} />

						<Title text={translate('popupSettingsImportHow')} />
						<Label text={translate('popupSettingsImportFirst')} />

						<div className="path">
							<b>{translate('popupSettingsImportPageTitle')}</b><br/>
							Three dots menu on the top-left corner → <IconObject object={{ iconEmoji: ':paperclip:' }} /> Export →  <br/> Export format : "Markdown & CSV".
						</div>

						<Label className="last" text={translate('popupSettingsImportZip')} />
						
						<Button text={translate('popupSettingsImportOk')} onClick={() => { this.onImport('notion'); }} />

						<Label className="last" text={translate('popupSettingsImportWarning')} />
					</div>
				);
				break;

			case 'exportMarkdown':
				content = (
					<div>
						<Head id="index" name={translate('popupSettingsTitle')} />

						<Title text={translate('popupSettingsExportMarkdownTitle')} />
						<Label text={translate('popupSettingsExportMarkdownText')} />

						<Button text={translate('popupSettingsExportOk')} onClick={() => { this.onExport(I.ExportFormat.Markdown); }} />
					</div>
				);
				break;

			case 'other':
				const { type } = commonStore;
				const pinTime = commonStore.pinTime / 1000;

				const types = DataUtil.getObjectTypesForNewObject(false).map((it: any) => {
					it.layout = I.ObjectLayout.Type;
					return { ...it, object: it };
				});

				const times: any[] = [
					{ id: 60 },
					{ id: 300 },
					{ id: 600 },
					{ id: 3600 },
				].map((it: any) => {
					it.name = Util.duration(it.id);
					return it;
				});

				const themes: any[] = [
					{ id: '', name: 'Default' },
					{ id: 'dark', name: 'Dark' },
				];

				content = (
					<div>
						<Head id="index" name={translate('popupSettingsTitle')} />

						<Title text={translate('popupSettingsOtherTitle')} />

						<div className="row">
							<div className="side left">
								<Label text="Default Object type" />
							</div>
							<div className="side right">
								<Select id="defaultType" options={types} value={type} onChange={(id: string) => { this.onTypeChange(id); }}/>
							</div>
						</div>

						<div className="row">
							<div className="side left">
								<Label text="PIN code check time-out" />
							</div>
							<div className="side right">
								<Select id="pinTime" options={times} value={String(pinTime || '')} onChange={(id: string) => { commonStore.pinTimeSet(id); }}/>
							</div>
						</div>

						<div className="row">
							<div className="side left">
								<Label text="Theme" />
							</div>
							<div className="side right">
								<Select id="theme" options={themes} value={theme} onChange={(id: string) => { commonStore.themeSet(id); }}/>
							</div>
						</div>

						<div className="row cp textColor textColor-red" onClick={this.onFileOffload}>
							<div className="side left">
								<Label text="Clear file cache" />
							</div>
							<div className="side right" />
						</div>
					</div>
				);
				break;
		};

		return (
			<div className={[ 'tab', Util.toCamelCase('tab-' + page) ].join(' ')}>
				{loading ? <Loader id="loader" /> : ''}
				{content}
			</div>
		);
	};

	componentDidMount () {
		const { param } = this.props;
		const { data } = param;
		const { page } = data;
		const { phrase } = authStore;

		this.onPage(page || 'index');

		if (phrase) {
			C.WalletConvert(phrase, '', (message: any) => {
				this.setState({ entropy: message.entropy });
			});
		};

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
			filters: [ { name: '', extensions: Constant.extension.cover } ]
		};

		dialog.showOpenDialog(options).then((result: any) => {
			const files = result.filePaths;
			if ((files == undefined) || !files.length) {
				return;
			};

			this.setState({ loading: true });

			C.UploadFile('', files[0], I.FileType.Image, (message: any) => {
				if (message.error.code) {
					return;
				};

				this.setState({ loading: false });

				commonStore.coverSet('', message.hash, I.CoverType.Upload);
				DataUtil.pageSetCover(root, I.CoverType.Upload, message.hash);

				analytics.event('SettingsWallpaperUpload', { middleTime: message.middleTime });
			});
		});
	};

	onFocusPhrase (e: any) {
		this.refPhrase.select();
		this.elementUnblur(e);
	};

	onBlurPhrase (e: any) {
		this.elementBlur(e);
		window.getSelection().removeAllRanges();
	};

	elementBlur (e: any) {
		$(e.currentTarget).addClass('isBlurred');
	};

	elementUnblur (e: any) {
		$(e.currentTarget).removeClass('isBlurred');
	};

	onCheckPin (pin: string) {
		this.onPage('pinSelect');
		if (this.onConfirmPin) {
			this.onConfirmPin();
			this.onConfirmPin = null;
		};
		this.setState({ error: '' });
	};

	onSelectPin (pin: string) {
		Storage.set('pin', sha1(pin));
		this.onPage('index');
	};

	onTurnOffPin () {
		Storage.delete('pin');
		this.onPage('index');
	};

	onClose () {
		this.props.close();
	};

	onPage (id: string) {
		const { param } = this.props;
		const { data } = param;
		const { page } = data || {};
		const pin = Storage.get('pin');

		if (pin && (id == 'phrase') && !this.pinConfirmed) {
			this.onConfirmPin = () => { 
				this.pinConfirmed = true;
				this.onPage('phrase');
				this.pinConfirmed = false;
			};
			this.onPage('pinConfirm');
			return;
		};

		this.prevPage = page;
		popupStore.updateData(this.props.id, { page: id });

		analytics.event('settings', { params: { id } });
	};

	onCover (item: any) {
		const { root } = blockStore;

		DataUtil.pageSetCover(root, item.type, item.image || item.id);
		commonStore.coverSet(item.id, item.image, item.type);

		analytics.event('SettingsWallpaperSet', { type: item.type, id: item.id });
	};

	onLogout (e: any) {
		const { close } = this.props;

		this.onConfirmPhrase = () => {
			close();

			window.setTimeout(() => {
				C.AccountStop(false);
				authStore.logout();
				Util.route('/');
	
				this.pinConfirmed = false;
				this.onConfirmPhrase = null;
			}, Constant.delay.popup);
		};

		this.onPage('phrase');
	};

	onImport (format: string) {
		const platform = Util.getPlatform();
		const { close } = this.props;
		const { root } = blockStore;
		const options: any = { 
			properties: [ 'openFile' ],
			filters: [
				{ name: '', extensions: [ 'zip' ] }
			]
		};

		if (platform == I.Platform.Mac) {
			options.properties.push('openDirectory');
		};

		dialog.showOpenDialog(options).then((result: any) => {
			const files = result.filePaths;
			if ((files == undefined) || !files.length) {
				return;
			};

			close();
			C.BlockImportMarkdown(root, files[0], (message: any) => {
				analytics.event('ImportFromNotion', { middleTime: message.middleTime });
			});
		});
	};

	onExport (format: I.ExportFormat) {
		const { close } = this.props;

		let options: any = {};

		switch (format) {
			case I.ExportFormat.Markdown:
				options = { 
					properties: [ 'openDirectory' ],
				};

				dialog.showOpenDialog(options).then((result: any) => {
					const files = result.filePaths;
					if ((files == undefined) || !files.length) {
						return;
					};

					close();

					C.Export(files[0], [], format, true, true, true, (message: any) => {	
						if (message.error.code) {
							popupStore.open('confirm', {
								data: {
									title: 'Ooops!',
									text: 'Something went wrong. <br/>If you think it’s our fault, please write us a feedback.',
									textConfirm: 'Try one more time',
									canCancel: false,
									onConfirm: () => {
									},
								},
							});
							return;
						};
						ipcRenderer.send('pathOpen', files[0]);

						analytics.event('ExportMarkdown', { middleTime: message.middleTime });
					});
				});
				break;
		};
	};

	onFileOffload (e: any) {
		analytics.event('ScreenFileOffloadWarning');

		popupStore.open('confirm',{
			data: {
				title: 'Are you sure?',
				text: 'All media files will be deleted from your current device. They can be downloaded again from a backup node or another device.',
				textConfirm: 'Yes',
				onConfirm: () => {
					this.setState({ loading: true });

					C.FileListOffload([], false, (message: any) => {
						if (message.error.code) {
							return;
						};

						this.setState({ loading: false });

						popupStore.open('confirm',{
							data: {
								title: 'Files offloaded',
								//text: Util.sprintf('Files: %s, Size: %s', message.files, Util.fileSize(message.bytes)),
								textConfirm: 'Ok',
								canCancel: false,
							}
						});

						analytics.event('FileOffload', { middleTime: message.middleTime });
					});
				},
				onCancel: () => {
				}, 
			}
		});
	};

	onTypeChange (id: string) {
		commonStore.defaultTypeSet(id);
		analytics.event('DefaultTypeChange', { objectType: id });
	};

	init () {
		this.props.position();
		$(window).unbind('resize.settings').on('resize.settings', () => { this.props.position(); });
	};

});

export default PopupSettings;
