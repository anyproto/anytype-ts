import * as React from 'react';
import { IconObject, Input, Title, Loader, Button, Icon } from 'Component';
import { I, C, translate, UtilCommon, Action, UtilObject } from 'Lib';
import { authStore, detailStore, blockStore, menuStore } from 'Store';
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
	refDescription: any = null;
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
		this.onDescription = this.onDescription.bind(this);
		this.onLogout = this.onLogout.bind(this);
		this.onLocationMove = this.onLocationMove.bind(this);
	};

	render () {
		const { error, loading } = this.state;
		const { account } = authStore;
		const profile = detailStore.get(Constant.subId.profile, blockStore.profile);

		return (
			<div className="sections">
				<div className="section top">
					{error ? <div className="message">{error}</div> : ''}

					<div className="iconWrapper">
						{loading ? <Loader /> : ''}
						<IconObject
							id="userpic"
							object={profile}
							size={108}
							onClick={this.onMenu}
						/>
					</div>
				</div>

				<div className="section">
					<Title text={translate('popupSettingsAccountPersonalInformationTitle')} />

					<Input
						ref={ref => this.refName = ref}
						value={profile.name}
						onKeyUp={this.onName}
						placeholder={translate('popupSettingsAccountPersonalInformationNamePlaceholder')}
					/>

					<Input
						ref={ref => this.refDescription = ref}
						value={profile.description}
						onKeyUp={this.onDescription}
						placeholder={translate('popupSettingsAccountPersonalInformationDescriptionPlaceholder')}
					/>
				</div>

				<div className="section">
					<Title text={translate('popupSettingsAccountAnytypeIdentityTitle')} />

					<div className="inputWrapper withIcon">
						<Input
							value={account.id}
							readonly={true}
							onClick={() => UtilCommon.copyToast(translate('popupSettingsAccountAnytypeIdentityAccountId'), account.id)}
						/>
						<Icon className="copy" />
					</div>
				</div>

				<div className="section bottom">
					<Button color="red" text={translate('popupSettingsLogout')} onClick={this.onLogout} />
				</div>
			</div>
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
					UtilCommon.route('/auth/setup/init', {}); 
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
            { id: 'upload', name: translate('commonChange') },
            { id: 'remove', name: translate('commonRemove') },
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

	onDescription (e) {
		UtilObject.setDescription(blockStore.profile, this.refDescription.getValue());
	};

	getObject () {
		return detailStore.get(Constant.subId.profile, blockStore.profile);
	};

});

export default PopupSettingsPageAccount;
