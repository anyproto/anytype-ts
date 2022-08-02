import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Icon, Title, Label } from 'Component';
import { I, C, Storage, translate, Util, analytics } from 'Lib';
import { authStore, commonStore, popupStore } from 'Store';
import { observer } from 'mobx-react';

import Head from './head';

interface Props extends I.Popup, RouteComponentProps<any> {
	prevPage: string;
	onPage: (id: string) => void;
	setPinConfirmed: (v: boolean) => void;
	setLoading: (v: boolean) => void;
};

interface State {
	error: string;
};

const Constant: any = require('json/constant.json');

const PopupSettingsPageAccount = observer(class PopupSettingsPageAccount extends React.Component<Props, State> {

	refPhrase: any = null;
	pinConfirmed: boolean = false;
	format: string = '';
	refCheckbox: any = null;
	state = {
		error: '',
	};

	constructor (props: any) {
		super(props);

		this.onLogout = this.onLogout.bind(this);
		this.onFileOffload = this.onFileOffload.bind(this);
		this.onDelete = this.onDelete.bind(this);
		this.onDeleteCancel = this.onDeleteCancel.bind(this);
		this.onLocationMove = this.onLocationMove.bind(this);
	};

	render () {
		const { onPage } = this.props;
		const { error } = this.state;
		const { account } = authStore;
		const { config } = commonStore;
		const pin = Storage.get('pin');
		const canDelete = account.status.type == I.AccountStatusType.Active;
		const canMove = config.experimental;

		return (
			<div>
				<Head {...this.props} id="index" name={translate('popupSettingsTitle')} />
				<Title text={translate('popupSettingsAccountTitle')} />

				{error ? <div className="message">{error}</div> : ''}

				<div className="rows">
					<div className="row" onClick={() => { onPage('phrase'); }}>
						<Icon className="phrase" />
						<Label text={translate('popupSettingsPhraseTitle')} />
						<Icon className="arrow" />
					</div>

					<div className="row" onClick={() => { onPage('pinIndex'); }}>
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

					{canMove ? (
						<div id="row-location" className="row location" onClick={this.onLocationMove}>
							<Label text={translate('popupSettingsAccountMoveTitle')} />
							<Icon className="arrow" />
						</div>
					) : ''}

					{canDelete ? (
						<div className="row" onClick={() => { onPage('delete'); }}>
							<Label text={translate('popupSettingsAccountDeleteTitle')} />
						</div>
					) : ''}

					<div className="row red" onClick={this.onLogout}>
						<Label text={translate('popupSettingsLogout')} />
					</div>
				</div>
			</div>
		);
	};

	onLogout (e: any) {
		this.props.onPage('logout');
	};

	onDelete (e: any) {
		const check = this.refCheckbox.getValue();
		if (!check) {
			return;
		};

		C.AccountDelete(false, (message: any) => {
			if (message.error.code) {
				return;
			};

			authStore.accountSet({ status: message.status });		
			this.props.close();
			Util.route('/auth/deleted');
		});
	};

	onDeleteCancel (e: any) {
		C.AccountDelete(true);
	};

	onFileOffload (e: any) {
		const { setLoading } = this.props;

		analytics.event('ScreenFileOffloadWarning');

		popupStore.open('confirm',{
			data: {
				title: 'Are you sure?',
				text: 'All media files will be deleted from your current device. They can be downloaded again from a backup node or another device.',
				textConfirm: 'Yes',
				onConfirm: () => {
					setLoading(true);

					C.FileListOffload([], false, (message: any) => {
						setLoading(false);

						if (message.error.code) {
							return;
						};

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
			}
		});
	};

	onLocationMove (e: any) {
		const { account } = authStore;
		const { setLoading } = this.props;
		const accountPath = account.info.localStoragePath.replace(new RegExp(account.id + '\/?$'), '');
		const options = { 
			defaultPath: accountPath,
			properties: [ 'openDirectory' ],
		};

		window.Electron.showOpenDialog(options).then((result: any) => {
			const files = result.filePaths;
			if ((files == undefined) || !files.length) {
				return;
			};

			setLoading(true);
			C.AccountMove(files[0], (message: any) => {
				if (message.error.code) {
					this.setState({ error: message.error.description });
				} else {
					Util.route('/auth/setup/init'); 
				};
				setLoading(false);
			});
		});
	};

});

export default PopupSettingsPageAccount;
