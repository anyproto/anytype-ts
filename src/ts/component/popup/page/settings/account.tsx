import * as React from 'react';
import { IconObject, Input, Title, Loader, Icon, Error } from 'Component';
import { I, S, translate, UtilCommon, UtilObject, UtilSpace } from 'Lib';
import { observer } from 'mobx-react';

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

		this.onName = this.onName.bind(this);
		this.onDescription = this.onDescription.bind(this);
	};

	render () {
		const { error, loading } = this.state;
		const { account } = S.Auth;
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

    onName () {
        UtilObject.setName(S.Block.profile, this.refName.getValue());
    };

	onDescription (e) {
		UtilObject.setDescription(S.Block.profile, this.refDescription.getValue());
	};

});

export default PopupSettingsPageAccount;