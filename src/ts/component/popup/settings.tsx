import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Icon, Title, Label, Loader, Error, Pin, Select } from 'ts/component';
import { I, C, Storage, translate, Util, analytics, Action } from 'ts/lib';
import { authStore, blockStore, commonStore, popupStore } from 'ts/store';
import { observer } from 'mobx-react';

import PageIndex from './page/settings/index';
import PageAccount from './page/settings/account';
import PageDelete from './page/settings/delete';
import PagePersonal from './page/settings/personal';
import PageAppearance from './page/settings/appearance';
import PageWallpaper from './page/settings/wallpaper';
import PagePhrase from './page/settings/phrase';
import PageImportIndex from './page/settings/import/index';
import PageImportNotion from './page/settings/import/notion';
import PageExportMarkdown from './page/settings/export/markdown';

interface Props extends I.Popup, RouteComponentProps<any> {};

interface State {
	loading: boolean;
	error: string;
};

const { dialog } = window.require('@electron/remote');
const $ = require('jquery');
const sha1 = require('sha1');

const Components: any = {
	index:				 PageIndex,
	account:			 PageAccount,
	delete:				 PageDelete,
	personal:			 PagePersonal,
	appearance:			 PageAppearance,
	wallpaper:			 PageWallpaper,
	phrase:				 PagePhrase,

	importIndex:		 PageImportIndex,
	importNotion:		 PageImportNotion,

	exportMarkdown:		 PageExportMarkdown,
};

const PopupSettings = observer(class PopupSettings extends React.Component<Props, State> {

	refPhrase: any = null;
	state = {
		loading: false,
		error: '',
	};
	prevPage: string = '';
	pinConfirmed: boolean = false;
	onConfirmPin: any = null;
	onConfirmPhrase: any = null;
	format: string = '';

	constructor (props: any) {
		super(props);

		this.onClose = this.onClose.bind(this);
		this.onPage = this.onPage.bind(this);
		this.onCheckPin = this.onCheckPin.bind(this);
		this.onSelectPin = this.onSelectPin.bind(this);
		this.onTurnOffPin = this.onTurnOffPin.bind(this);
		this.setConfirmPhrase = this.setConfirmPhrase.bind(this);
		this.setConfirmPin = this.setConfirmPin.bind(this);
		this.setPinConfirmed = this.setPinConfirmed.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { page } = data;
		const { loading, error } = this.state;
		const pin = Storage.get('pin');

		let content = null;

		let Head = (item: any) => (
			<div className="head">
				<div className="element" onClick={() => { this.onPage(item.id || this.prevPage); }}>
					<Icon className="back" />
					{item.name}
				</div>
			</div>
		);

		switch (page) {
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
		};

		if (Components[page]) {
			const Component = Components[page];
			content = (
				<Component 
					{...this.props} 
					onPage={this.onPage} 
					onExport={this.onExport} 
					onImport={this.onImport}
					setConfirmPin={this.setConfirmPin}
					setConfirmPhrase={this.setConfirmPhrase}
					setPinConfirmed={this.setPinConfirmed}
					onConfirmPin={this.onConfirmPin}
					onConfirmPhrase={this.onConfirmPhrase}
				/>
			);
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

		this.onPage(page || 'index');
		this.init();
	};

	componentDidUpdate () {
		this.init();
	};

	componentWillUnmount () {
		$(window).unbind('resize.settings');
	};

	onCheckPin (pin: string) {
		this.onPage('pinSelect');
		if (this.onConfirmPin) {
			this.onConfirmPin();
			this.setConfirmPin(null);
		};
		this.setState({ error: '' });
	};

	setConfirmPin (v: () => void) {
		this.onConfirmPin = v;
		this.forceUpdate();
	};

	setConfirmPhrase (v: () => void) {
		this.onConfirmPhrase = v;
		this.forceUpdate();
	};

	setPinConfirmed (v: boolean) {
		this.pinConfirmed = v;
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
			this.setConfirmPin(() => { 
				this.pinConfirmed = true;
				this.onPage('phrase');
				this.pinConfirmed = false;
			});
			this.onPage('pinConfirm');
			return;
		};

		this.prevPage = page;
		popupStore.updateData(this.props.id, { page: id });

		analytics.event('settings', { params: { id } });
	};

	onImport (format: I.ImportFormat) {
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

	init () {
		this.props.position();
		$(window).unbind('resize.settings').on('resize.settings', () => { this.props.position(); });
	};

});

export default PopupSettings;
