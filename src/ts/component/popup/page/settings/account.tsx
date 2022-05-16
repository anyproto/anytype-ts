import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Icon, Button, Title, Label } from 'ts/component';
import { I, C, Storage, translate, Util, DataUtil, analytics, Action } from 'ts/lib';
import { authStore, blockStore, commonStore, popupStore, menuStore } from 'ts/store';
import { observer } from 'mobx-react';

import Head from './head';

interface Props extends I.Popup, RouteComponentProps<any> {
	prevPage: string;
	onPage: (id: string) => void;
};

interface State {
	loading: boolean;
	error: string;
	entropy: string;
};

const { dialog } = window.require('@electron/remote');
const $ = require('jquery');
const Constant: any = require('json/constant.json');
const sha1 = require('sha1');

const PopupSettingsPageAccount = observer(class PopupSettingsPageAccount extends React.Component<Props, State> {

	refPhrase: any = null;
	state = {
		loading: false,
		error: '',
		entropy: '',
	};
	pinConfirmed: boolean = false;
	onConfirmPin: () => void = null;
	onConfirmPhrase: any = null;
	format: string = '';
	refCheckbox: any = null;

	constructor (props: any) {
		super(props);

		this.onPage = this.onPage.bind(this);
		this.onCover = this.onCover.bind(this);
		this.onLogout = this.onLogout.bind(this);
		this.onFocusPhrase = this.onFocusPhrase.bind(this);
		this.onBlurPhrase = this.onBlurPhrase.bind(this);
		this.onCheckPin = this.onCheckPin.bind(this);
		this.onSelectPin = this.onSelectPin.bind(this);
		this.onTurnOffPin = this.onTurnOffPin.bind(this);
		this.elementBlur = this.elementBlur.bind(this);
		this.onFileOffload = this.onFileOffload.bind(this);
		this.onDelete = this.onDelete.bind(this);
		this.onDeleteCancel = this.onDeleteCancel.bind(this);
		this.onCheck = this.onCheck.bind(this);
	};

	render () {
		const { onPage } = this.props;
		const { account } = authStore;
		const { config } = commonStore;
		const pin = Storage.get('pin');

		let message = null;

		const canDelete = config.experimental && (account.status.type == I.AccountStatusType.Active);
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
							this.onConfirmPhrase = null; 
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
		this.props.onPage('pinSelect');
		if (this.onConfirmPin) {
			this.onConfirmPin();
			this.onConfirmPin = null;
		};
		this.setState({ error: '' });
	};

	onSelectPin (pin: string) {
		Storage.set('pin', sha1(pin));
		//this.onPage('pinIndex');
	};

	onTurnOffPin () {
		Storage.delete('pin');
		//this.onPage('pinIndex');
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

		//this.prevPage = page;
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
			this.props.close();
			Util.route('/auth/deleted');
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

});

export default PopupSettingsPageAccount;
