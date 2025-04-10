import * as React from 'react';
import { IconObject, Input, Title, Loader, Icon, Error } from 'Component';
import { I, S, U, J, translate } from 'Lib';
import { observer } from 'mobx-react';

interface Props extends I.PageSettingsComponent {
	setLoading: (v: boolean) => void;
};

interface State {
	error: string;
	loading: boolean;
};

const PageMainSettingsAccount = observer(class PageMainSettingsAccount extends React.Component<Props, State> {

	refName: any = null;
	refDescription: any = null;
	format = '';
	timeout = 0;
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
		const { config } = S.Common;
		const { error, loading } = this.state;
		const { account } = S.Auth;
		const profile = U.Space.getProfile();

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
							size={128}
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
						maxLength={160}
					/>

					<Input
						ref={ref => this.refDescription = ref}
						value={profile.description}
						onKeyUp={this.onDescription}
						placeholder={translate('popupSettingsAccountPersonalInformationDescriptionPlaceholder')}
						maxLength={160}
					/>
				</div>

				<div className="section">
					<Title text={translate('popupSettingsAccountAnytypeIdentityTitle')} />

					<div className="inputWrapper withIcon">
						<Input
							value={account.id}
							readonly={true}
							onClick={() => U.Common.copyToast(translate('popupSettingsAccountAnytypeIdentityTitle'), account.id)}
						/>
						<Icon className="copy" />
					</div>
				</div>

				{config.experimental ? (
					<div className="section">
						<Title text={translate('popupSettingsEthereumIdentityTitle')} />

						<div className="inputWrapper withIcon">
							<Input
								value={account.info.ethereumAddress}
								readonly={true}
								onClick={() => U.Common.copyToast(translate('popupSettingsEthereumIdentityTitle'), account.info.ethereumAddress)}
							/>
							<Icon className="copy" />
						</div>
					</div>
				) : ''}
			</div>
		);
	};

	componentWillUnmount(): void {
		window.clearTimeout(this.timeout);
	};

	onName () {
		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => U.Object.setName(S.Block.profile, this.refName.getValue()), J.Constant.delay.keyboard);
	};

	onDescription () {
		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => U.Object.setDescription(S.Block.profile, this.refDescription.getValue()), J.Constant.delay.keyboard);
	};

});

export default PageMainSettingsAccount;
