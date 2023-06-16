import * as React from 'react';
import { Label, IconObject, Input, Loader } from 'Component';
import { I, C, translate, UtilCommon, analytics, Action, UtilData, UtilObject } from 'Lib';
import { authStore, commonStore, popupStore, detailStore, blockStore, menuStore } from 'Store';
import { observer } from 'mobx-react';
import Constant from 'json/constant.json';

interface Props extends I.PopupSettings {
	setPinConfirmed: (v: boolean) => void;
	setLoading: (v: boolean) => void;
};

interface State {
	error: string;
	loading: boolean;
};

const PopupSettingsPageAccount = observer(class PopupSettingsPageAccount extends React.Component<Props, State> {

	refName: any = null;
	pinConfirmed = false;
	format = '';
	refCheckbox: any = null;
	state = {
		error: '',
		loading: false,
	};

	constructor (props: Props) {
		super(props);

		this.onMenu = this.onMenu.bind(this);
		this.onUpload = this.onUpload.bind(this);
		this.onName = this.onName.bind(this);
		this.onLogout = this.onLogout.bind(this);
		this.onLocationMove = this.onLocationMove.bind(this);
	};

	render () {
		const { onPage } = this.props;
		const { error, loading } = this.state;
		const { account, walletPath, accountPath } = authStore;
		const { config } = commonStore;
		const profile = detailStore.get(Constant.subId.profile, blockStore.profile);
		const canMove = config.experimental;

		return (
			<React.Fragment>
				{error ? <div className="message">{error}</div> : ''}

				<div className="iconWrapper">
					{loading ? <Loader /> : ''}
					<IconObject 
						id="userpic" 
						object={profile} 
						size={112} 
						onClick={this.onMenu} 
					/>
				</div>

				<div className="rows">

					<div className="row">
						<div className="name">
							<Label className="small" text="Name" />
							<Input 
								ref={ref => this.refName = ref} 
								value={profile.name} 
								onKeyUp={this.onName} 
								placeholder={UtilObject.defaultName('Page')} 
							/>
						</div>
					</div>

					<Label className="section" text="Account" />

					{canMove ? (
						<div id="row-location" className="row cp" onClick={this.onLocationMove}>
							<Label text={translate('popupSettingsAccountMoveTitle')} />
							<div className="select">
								<div className="item">
									<div className="name">{walletPath == accountPath ? 'Default' : 'Custom'}</div>
								</div>
							</div>
						</div>
					) : ''}

					<div className="row cp" onClick={() => { onPage('delete'); }}>
						<Label text={translate('popupSettingsAccountDeleteTitle')} />
					</div>

					<div className="row red cp" onClick={this.onLogout}>
						<Label text={translate('popupSettingsLogout')} />
					</div>
				</div>
			</React.Fragment>
		);
	};

	onLogout (e: any) {
		this.props.onPage('logout');
	};

	onLocationMove () {
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
					UtilCommon.route('/auth/setup/init'); 
				};
				setLoading(false);
			});
		});
	};

	onMenu () {
		const { getId } = this.props;
        const object = this.getObject();

        if (!object.iconImage) {
            this.onUpload();
            return;
        };

        const options = [
            { id: 'upload', name: 'Change' },
            { id: 'remove', name: 'Remove' }
        ];

        menuStore.open('select', {
            element: `#${getId()} #userpic`,
            horizontal: I.MenuDirection.Center,
            data: {
                value: '',
                options,
                onSelect: (e: any, item: any) => {
					switch (item.id) {
						case 'upload': {
							this.onUpload();
							break;
						};

						case 'remove': {
							UtilObject.setIcon(blockStore.profile, '', '');
							break;
						};
					};
                },
            }
        });
    };

    onUpload () {
		Action.openFile(Constant.extension.cover, paths => {
			this.setState({ loading: true });

            C.FileUpload('', paths[0], I.FileType.Image, (message: any) => {
                if (message.error.code) {
                    return;
                };

                UtilObject.setIcon(blockStore.profile, '', message.hash, () => {
                    this.setState({ loading: false });
                });
            });
		});
    };

    onName () {
        UtilObject.setName(blockStore.profile, this.refName.getValue());
    };

	getObject () {
		return detailStore.get(Constant.subId.profile, blockStore.profile);
	};

});

export default PopupSettingsPageAccount;
