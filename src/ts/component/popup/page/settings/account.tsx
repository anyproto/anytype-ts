import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Icon, Button, Title, Label } from 'ts/component';
import { I, C, Storage, translate, Util, analytics } from 'ts/lib';
import { authStore, commonStore, popupStore } from 'ts/store';
import { observer } from 'mobx-react';

import Head from './head';

interface Props extends I.Popup, RouteComponentProps<any> {
	prevPage: string;
	onPage: (id: string) => void;
	setConfirmPhrase: (v: () => void) => void;
	setPinConfirmed: (v: boolean) => void;
};

const Constant: any = require('json/constant.json');
const { dialog } = window.require('@electron/remote');

const PopupSettingsPageAccount = observer(class PopupSettingsPageAccount extends React.Component<Props, {}> {

	refPhrase: any = null;
	pinConfirmed: boolean = false;
	format: string = '';
	refCheckbox: any = null;

	constructor (props: any) {
		super(props);

		this.onLogout = this.onLogout.bind(this);
		this.onFileOffload = this.onFileOffload.bind(this);
		this.onDelete = this.onDelete.bind(this);
		this.onDeleteCancel = this.onDeleteCancel.bind(this);
		this.onMove = this.onMove.bind(this);
	};

	render () {
		const { onPage, setConfirmPhrase } = this.props;
		const { account } = authStore;
		const { config } = commonStore;
		const pin = Storage.get('pin');
		const canDelete = config.experimental && (account.status.type == I.AccountStatusType.Active);
		const canMove = config.experimental;
		const isDeleted = [ I.AccountStatusType.StartedDeletion, I.AccountStatusType.Deleted ].includes(account.status.type);
		const isPending = [ I.AccountStatusType.PendingDeletion ].includes(account.status.type);

		let message = null;

		if (isPending) {
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
					All logged-in devices will continue to store data locally. However, you won't be able to sign into Anytype on new devices using your recovery recovery phrase. 
				</React.Fragment>
			);
		};

		return (
			<div>
				<Head {...this.props} id="index" name={translate('popupSettingsTitle')} />
				<Title text={translate('popupSettingsAccountTitle')} />

				{message ? <div className="message">{message}</div> : ''}

				<div className="rows">
					<div 
						className="row" 
						onClick={() => { 
							setConfirmPhrase(null);
							onPage('phrase'); 
						}}
					>
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

					{canDelete ? (
						<div className="row" onClick={this.onMove}>
							<Label text={translate('popupSettingsAccountMoveTitle')} />
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
		const { close, onPage, setConfirmPhrase, setPinConfirmed } = this.props;

		setConfirmPhrase(() => {
			close();

			window.setTimeout(() => {
				C.AccountStop(false);
				authStore.logout();
				Util.route('/');
	
				setPinConfirmed(false);
				setConfirmPhrase(null);
			}, Constant.delay.popup);
		});

		onPage('phrase');
	};

	onDelete (e: any) {
		const check = this.refCheckbox.getValue();
		if (!check) {
			return;
		};

		C.AccountDelete(false, (message: any) => {
			authStore.accountSet({ status: message.status });		
			this.props.close();
			Util.route('/auth/deleted');
		});
	};

	onDeleteCancel (e: any) {
		C.AccountDelete(true);
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
			}
		});
	};

	onMove (e: any) {
		const options = { 
			properties: [ 'openDirectory' ],
		};

		dialog.showOpenDialog(options).then((result: any) => {
			const files = result.filePaths;
			if ((files == undefined) || !files.length) {
				return;
			};

			C.AccountMove(files[0], () => {
				Util.route('/auth/setup/init');
			});
		});
	};

});

export default PopupSettingsPageAccount;
