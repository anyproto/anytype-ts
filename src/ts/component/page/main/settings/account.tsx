import React, { forwardRef, useEffect, useRef } from 'react';
import { IconObject, Input, Title, Icon, Label, Button } from 'Component';
import { I, S, U, J, C, translate, keyboard, Action, analytics, Relation } from 'Lib';
import { observer } from 'mobx-react';

const PageMainSettingsAccount = observer(forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const { config } = S.Common;
	const { account } = S.Auth;
	const profile = U.Space.getProfile();
	const timeout = useRef(0);
	const participant = U.Space.getParticipant() || profile;
	const globalName = Relation.getStringValue(participant?.globalName);

	let name = profile.name;
	if (name == translate('defaultNamePage')) {
		name = '';
	};

	const onSave = (e: any, key: string, value: string) => {
		let t = J.Constant.delay.keyboard;

		keyboard.shortcut('enter', e, () => {
			e.preventDefault();
			t = 0;
		});

		window.clearTimeout(timeout.current);
		timeout.current = window.setTimeout(() => {
			if (profile[key] != value) {
				C.ObjectListSetDetails([ S.Block.profile ], [ { key, value: String(value || '') } ]);
			};
		}, t);
	};

	const onUpsell = () => {
		const route = analytics.route.settingsAccount;

		Action.openSettings('membership', route);
		analytics.event('ClickUpgradePlanTooltip', { route });
	};

	useEffect(() => {
		return () => {
			window.clearTimeout(timeout.current);
		};
	}, []);

	return (
		<div className="sections">
			<div className="section top">
				<div className="iconWrapper">
					<IconObject
						id="userpic"
						object={profile}
						size={128}
						canEdit={true}
						menuParam={{
							horizontal: I.MenuDirection.Center,
							classNameWrap: 'fromBlock',
						}}
					/>
				</div>
			</div>

			<div className="section">
				<Title text={translate('popupSettingsAccountPersonalInformationTitle')} />

				<Input
					value={name}
					onKeyUp={(e, v) => onSave(e, 'name', v)}
					placeholder={translate('popupSettingsAccountPersonalInformationNamePlaceholder')}
					maxLength={160}
				/>

				<Input
					value={profile.description}
					onKeyUp={(e, v) => onSave(e, 'description', v)}
					placeholder={translate('popupSettingsAccountPersonalInformationDescriptionPlaceholder')}
					maxLength={160}
				/>
			</div>

			{participant ? (
				globalName ? (
					<div className="section">
						<div className="anyNameWrapper">
							<Icon className="badge" />
							<Title text={translate('popupSettingsAccountAnyIdTitle')} />
						</div>

						<div className="inputWrapper withIcon">
							<Input
								value={globalName}
								readonly={true}
								onClick={() => U.Common.copyToast(translate('popupSettingsAccountAnyIdTitle'), account.id)}
							/>
							<Icon className="copy" />
						</div>
					</div>
				) : (
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

						<div className="upsellWrapper">
							<div className="text">
								<Icon />
								<Title text={translate('membershipUpsellAnyIdTitle')} />
								<Label text={translate('membershipUpsellAnyIdText')} />
								<Button
									color="blank"
									text={translate('membershipUpsellAnyIdExplorePlans')}
									onClick={onUpsell}
								/>
							</div>
						</div>
					</div>
				)
			) : ''}

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

}));

export default PageMainSettingsAccount;
