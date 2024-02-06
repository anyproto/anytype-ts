import * as React from 'react';
import { IconObject, Input, Title, Loader, Icon, Error } from 'Component';
import { I, C, translate, UtilCommon, Action, UtilObject, UtilRouter } from 'Lib';
import { authStore, detailStore, blockStore, menuStore, commonStore } from 'Store';
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
	format = '';
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
		this.onLocationMove = this.onLocationMove.bind(this);
	};

	render () {
		const { error, loading } = this.state;
		const { account } = authStore;
		const profile = UtilObject.getProfile();
	
		let name = profile.name;
		if (name == translate('defaultNamePage')) {
			name = '';
		};

		return (
			<div className="sections">
				<div className="section top">
					<Error text={error} />

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
						value={name}
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
							onClick={() => UtilCommon.copyToast(translate('popupSettingsAccountAnytypeIdentityTitle'), account.id)}
						/>
						<Icon className="copy" />
					</div>
				</div>
			</div>
		);
	};

	onLocationMove () {
		const { setLoading } = this.props;
		const { account } = authStore;
		const { info } = account;
		const localStoragePath = String(info.localStoragePath || '');

		if (!localStoragePath) {
			return;
		};

		const accountPath = localStoragePath.replace(new RegExp(account.id + '\/?$'), '');
		const options = { 
			defaultPath: accountPath,
			properties: [ 'openDirectory' ],
		};

		UtilCommon.getElectron().showOpenDialog(options).then((result: any) => {
			const files = result.filePaths;
			if ((files == undefined) || !files.length) {
				return;
			};

			setLoading(true);
			C.AccountMove(files[0], (message: any) => {
				if (message.error.code) {
					this.setState({ error: message.error.description });
				} else {
					UtilRouter.go('/auth/setup/init', {}); 
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
		const { accountSpaceId } = authStore;

		Action.openFile(Constant.fileExtension.cover, paths => {
			this.setState({ loading: true });

            C.FileUpload(accountSpaceId, '', paths[0], I.FileType.Image, {}, (message: any) => {
                if (!message.error.code) {
					UtilObject.setIcon(blockStore.profile, '', message.objectId, () => {
						this.setState({ loading: false });
					});
                };
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
