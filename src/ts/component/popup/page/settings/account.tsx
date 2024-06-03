import * as React from 'react';
import { IconObject, Input, Title, Loader, Icon, Error } from 'Component';
import { I, C, translate, UtilCommon, Action, UtilObject, UtilSpace } from 'Lib';
import { authStore, blockStore, menuStore } from 'Store';
import { observer } from 'mobx-react';
const Constant = require('json/constant.json');

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

		this.onSelect = this.onSelect.bind(this);
		this.onUpload = this.onUpload.bind(this);
		this.onName = this.onName.bind(this);
		this.onDescription = this.onDescription.bind(this);
	};

	render () {
		const { error, loading } = this.state;
		const { account } = authStore;
		const profile = UtilSpace.getProfile();
	
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
							canEdit={true}
							onSelect={this.onSelect}
							onUpload={this.onUpload}
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

	onSelect (icon: string) {
		UtilObject.setIcon(blockStore.profile, icon, '');
	};

	onUpload (objectId: string) {
		UtilObject.setIcon(blockStore.profile, '', objectId);
	};

    onName () {
        UtilObject.setName(blockStore.profile, this.refName.getValue());
    };

	onDescription (e) {
		UtilObject.setDescription(blockStore.profile, this.refDescription.getValue());
	};

});

export default PopupSettingsPageAccount;