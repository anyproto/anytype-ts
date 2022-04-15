import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Icon, Button, Title, Label, Cover, Textarea, Loader, IconObject, Error, Pin, Select, Switch, Checkbox } from 'ts/component';
import { I, C, Storage, translate, Util, DataUtil, analytics, Action } from 'ts/lib';
import { authStore, blockStore, commonStore, popupStore, menuStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Popup, RouteComponentProps<any> {};

interface State {
	loading: boolean;
	error: string;
	entropy: string;
};

const { dialog } = window.require('@electron/remote');
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
	refCheckbox: any = null;

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
		this.onDelete = this.onDelete.bind(this);
		this.onDeleteCancel = this.onDeleteCancel.bind(this);
		this.onCheck = this.onCheck.bind(this);
		this.onType = this.onType.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { page } = data;
		const { account, phrase } = authStore;
		const { cover, coverImage, theme, config, autoSidebar, type } = commonStore;
		const { loading, error, entropy } = this.state;
		const pin = Storage.get('pin');

		let content = null;
		let Item = null;
		let message = null;

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
							<div className="row" onClick={() => { this.onPage('account'); }}>
								<Icon className="account" />
								<Label text={translate('popupSettingsAccountTitle')} />

								{account.status.type != I.AccountStatusType.Active ? (
									<Icon className="dot" />
								) : ''}
								<Icon className="arrow" />
							</div>

							<div className="row" onClick={() => { this.onPage('personal'); }}>
								<Icon className="personal" />
								<Label text={translate('popupSettingsPersonalTitle')} />
								<Icon className="arrow" />
							</div>

							<div className="row" onClick={() => { this.onPage('appearance'); }}>
								<Icon className="appearance" />
								<Label text={translate('popupSettingsAppearanceTitle')} />
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
						</div>
					</div>
				);
				break;

			case 'account':
				const canDelete = account.status.type == I.AccountStatusType.Active;
				const isDeleted = [ I.AccountStatusType.StartedDeletion, I.AccountStatusType.Deleted ].includes(account.status.type);

				if (account.status.type == I.AccountStatusType.PendingDeletion) {
					message = (
						<div className="flex">	
							<Label text={`This account is planned for deletion in ${Util.duration(Math.max(0, account.status.date - Util.time()))}...`} />
							<Button text="Cancel" onClick={this.onDeleteCancel} />
						</div>
					);
				};

				if (isDeleted) {
					message = (
						<React.Fragment>	
							<b>Account data removed from the backup node</b>
							You can continue to work as normal.<br/>
							All logged-in devices will continue to store data locally. However, you won't be able to sign into Anytype on new devices using your keychain recovery phrase. 
						</React.Fragment>
					);
				};

				content = (
					<div>
						<Head id="index" name={translate('popupSettingsTitle')} />
						<Title text={translate('popupSettingsAccountTitle')} />

						{message ? <div className="message">{message}</div> : ''}

						<div className="rows">
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

							<Label className="sectionName" text="Data" />

							<div className="row" onClick={this.onFileOffload}>
								<Label text="Clear file cache" />
							</div>

							<Label className="sectionName" text="Account" />

							<div className="row" onClick={this.onLogout}>
								<Label text={translate('popupSettingsLogout')} />
							</div>

							{canDelete ? (
								<div className="row red" onClick={() => { this.onPage('delete'); }}>
									<Label text={translate('popupSettingsAccountDeleteTitle')} />
								</div>
							) : ''}
						</div>
					</div>
				);
				break;

			case 'delete':
				content = (
					<div>
						<Head id="account" name={translate('commonCancel')} />
						<Title text={translate('popupSettingsAccountDeleteTitle')} />

						<div className="text">
							<b>1. We're sorry to see you go. Once you request your account to be deleted, you have 30 days to cancel this request.</b>
							<p>After 30 days, your objects are permanently removed from the Anytype backup node.</p>

							<b>2. You can continue to work as normal.</b>
							<p>All logged-in devices will continue to store data locally. However, you won't be able to sign into Anytype on new devices using your keychain recovery phrase. </p>

							<div className="check" onClick={this.onCheck}>
								<Checkbox ref={(ref: any) => { this.refCheckbox = ref; }} /> I have read it and want to delete my account
							</div>
						</div>

						<div className="rows">
							<div id="row-delete" className="row disabled" onClick={this.onDelete}>
								<Label text={translate('commonDelete')} />
							</div>
						</div>
					</div>
				);
				break;

			case 'personal': 
				const types = DataUtil.getObjectTypesForNewObject(false);
				const ot = types.find(it => it.id == type);

				content = (
					<div>
						<Head id="index" name={translate('popupSettingsTitle')} />
						<Title text={translate('popupSettingsPersonalTitle')} />

						<div className="rows">
							<div className="row flex">
								<div className="side left">
									<Label text="Default Object type" />
								</div>
								<div className="side right">
									<div id="defaultType" className="select" onClick={this.onType}>
										<div className="item">
											<div className="name">{ot?.name || DataUtil.defaultName('page')}</div>
										</div>
										<Icon className="arrow light" />
									</div>
								</div>
							</div>

							<div className="row flex">
								<div className="side left">
									<Label text="Automatically hide and show Sidebar" />
								</div>
								<div className="side right">
									<Switch value={autoSidebar} className="big" onChange={(e: any, v: boolean) => { commonStore.autoSidebarSet(v); }}/>
								</div>
							</div>
						</div>
					</div>
				);
				break;

			case 'appearance':
				const themes: any[] = [
					{ id: '', class: 'light', name: 'Light' },
					{ id: 'dark', class: 'dark', name: 'Dark' },
				];

				const inner = <div className="inner"></div>;

				content = (
					<div>
						<Head id="index" name={translate('popupSettingsTitle')} />
						<Title text={translate('popupSettingsAppearanceTitle')} />

						<div className="rows">
							<div className="row" onClick={() => { this.onPage('wallpaper'); }}>
								<Icon className="wallpaper" />
								<Label text={translate('popupSettingsWallpaperTitle')} />
								<Icon className="arrow" />
							</div>

							<Label className="sectionName center" text="Mode" />

							<div className="buttons">
								{themes.map((item: any, i: number) => (
									<div 
										key={i} 
										className={[ 'btn', (theme == item.id ? 'active' : '') ].join(' ')} 
										onClick={() => { commonStore.themeSet(item.id); }}
									>
										<Icon className={item.class} inner={inner} />
										<Label text={item.name} />
									</div>
								))}
							</div>
						</div>
					</div>
				);
				break;

			case 'wallpaper':
				let covers1 = [];
				if (coverImage) {
					covers1.push({ id: coverImage, image: coverImage, type: I.CoverType.Upload });
				};
				for (let i = 1; i <= Constant.coverCnt; ++i) {
					covers1.push({ id: 'c' + i, image: '', type: I.CoverType.Image });
				};

				let sections = [
					{ name: translate('popupSettingsPicture'), children: covers1 },
					{ 
						name: translate('popupSettingsColor'), 
						children: DataUtil.coverColors().map((it: any) => { return { ...it, image: '' }; }),
					},
					{ 
						name: translate('popupSettingsGradient'), 
						children: DataUtil.coverGradients().map((it: any) => { return { ...it, image: '' }; }), 
					},
				];

				Item = (item: any) => (
					<div className={'item ' + (item.active ? 'active': '')} onClick={() => { this.onCover(item); }}>
						<Cover {...item} preview={true} className={item.id} />
					</div>
				);

				content = (
					<div>
						<Head id="appearance" name={translate('popupSettingsAppearanceTitle')} />
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
						<Head id="account" name={translate('popupSettingsAccountTitle')} />
						
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
				const pinTime = commonStore.pinTime / 1000;

				const times: any[] = [
					{ id: 60 },
					{ id: 300 },
					{ id: 600 },
					{ id: 3600 },
				].map((it: any) => {
					it.name = Util.duration(it.id);
					return it;
				});

				content = (
					<div>
						<Head id="account" name={translate('popupSettingsAccountTitle')} />

						<Title text={translate('popupSettingsPinTitle')} />
						<Label className="description" text={translate('popupSettingsPinText')} />

						<div className="rows">
							{pin ? (
								<React.Fragment>
									<div 
										className="row red" 
										onClick={() => {
											this.onConfirmPin = this.onTurnOffPin;
											this.onPage('pinConfirm');

											analytics.event('PinCodeOff');
										}}
									>
										<Label text={translate('popupSettingsPinOff')} />
									</div>

									<div className="row flex">
										<div className="side left">
											<Label text="PIN code check time-out" />
										</div>
										<div className="side right">
											<Select id="pinTime" arrowClassName="light" options={times} value={String(pinTime || '')} onChange={(id: string) => { commonStore.pinTimeSet(id); }}/>
										</div>
									</div>

									<div 
										className="row" 
										onClick={() => {
											this.onConfirmPin = () => { this.onPage('pinSelect'); };
											this.onPage('pinConfirm');

											analytics.event('PinCodeChange');
										}}
									>
										<Label text={translate('popupSettingsPinChange')} />
									</div>
								</React.Fragment>
							): (
								<React.Fragment>
									<div 
										className="row" 
										onClick={() => {
											this.onPage('pinSelect');

											analytics.event('PinCodeOn');
										}}
									>
										<Label text={translate('popupSettingsPinOn')} />
									</div>
								</React.Fragment>
							)}
						</div>

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

			C.FileUpload('', files[0], I.FileType.Image, (message: any) => {
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
		this.onPage('pinIndex');
	};

	onTurnOffPin () {
		Storage.delete('pin');
		this.onPage('pinIndex');
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

	onDelete (e: any) {
		const check = this.refCheckbox.getValue();
		if (!check) {
			return;
		};

		C.AccountDelete(false, (message: any) => {
			authStore.accountSet({ status: message.status });			
			this.onPage('account');
		});
	};

	onDeleteCancel (e: any) {
		C.AccountDelete(true);
	};

	onCheck () {
		const node = $(ReactDOM.findDOMNode(this));
		const row = node.find('#row-delete');
		const value = this.refCheckbox.getValue();

		row.removeClass('red disabled');

		this.refCheckbox.setValue(!value);
		!value ? row.addClass('red') : row.addClass('disabled');
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
		switch (format) {
			case I.ExportFormat.Markdown:
				Action.export([], format, true, true, true, () => { this.props.close(); }, (message: any) => {
					analytics.event('ExportMarkdown', { middleTime: message.middleTime });
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
								//text: Util.sprintf('Files: %s, Size: %s', message.files, FileUtil.size(message.bytes)),
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

	onType (e: any) {
		const { getId } = this.props;
		const types = DataUtil.getObjectTypesForNewObject(false).map(it => it.id);

		menuStore.open('searchObject', {
			element: `#${getId()} #defaultType`,
			className: 'big single',
			data: {
				isBig: true,
				placeholder: 'Change object type',
				placeholderFocus: 'Change object type',
				value: commonStore.type,
				filters: [
					{ operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.In, value: types }
				],
				onSelect: (item: any) => {
					this.onTypeChange(item.id);
				},
				dataSort: (c1: any, c2: any) => {
					let i1 = types.indexOf(c1.id);
					let i2 = types.indexOf(c2.id);

					if (i1 > i2) return 1;
					if (i1 < i2) return -1;
					return 0;
				}
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
