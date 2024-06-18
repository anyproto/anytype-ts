import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Button } from 'Component';
import { I, S, U, J, Onboarding, translate, analytics } from 'Lib';
import QRCode from 'qrcode.react';

interface State {
	step: number;
};

const PopupMigration = observer(class PopupMigration extends React.Component<I.Popup, State> {

	state = {
		step: 0,
	};
	node = null;

	render () {
		const { param, close } = this.props;
		const { data } = param;
		const { type } = data;
		const theme = S.Common.getThemeClass();

		let content = null;

		switch (type) {
			case 'onboarding': {
				content = (
					<React.Fragment>
						<Title text={'⚡️ ' + translate('popupMigrationOnboardingTitle')} />
						<Label text={translate('popupMigrationOnboardingText1')} />
						<Label text={translate('popupMigrationOnboardingText2')} />

						<div className="qrWrap">
							<QRCode value={J.Url.download} fgColor={J.Theme[theme].qr.foreground} bgColor={J.Theme[theme].qr.bg} size={100} />
						</div>

						<Label text={translate('popupMigrationOnboardingText3')} />

						<div className="buttons">
							<Button text={translate('commonDone')} className="c36" onClick={() => close()} />
						</div>
					</React.Fragment>
				);
				break;
			};

			case 'import': {
				content = (
					<React.Fragment>
						<Title text={translate('popupMigrationImportTitle')} />
						<Label text={translate('popupMigrationImportText1')} />
						<Label text={translate('popupMigrationImportText2')} />

						<div className="qrWrap">
							<QRCode value={J.Url.download} fgColor={J.Theme[theme].qr.foreground} bgColor={J.Theme[theme].qr.bg} size={100} />
						</div>

						<Label text={U.Common.sprintf(translate('popupMigrationImportText3'), J.Url.community)} />

						<div className="buttons">
							<Button text={translate('commonDone')} className="c36" onClick={() => close()} />
						</div>
					</React.Fragment>
				);
				break;
			};
		};

		return (
			<div ref={ref => this.node = ref}>
				{content}
			</div>
		);
	};

	componentDidMount () {
		const { param } = this.props;
		const { data } = param;
		const { type } = data;

		let event = '';
		switch (type) {
			case 'onboarding': {
				event = 'MigrationImportBackupOffer';
				break;
			};

			case 'import': {
				event = 'MigrationImportBackup';
				break;
			};
		};

		if (event) {
			analytics.event(event);
		};
	}

	componentWillUnmount(): void {
		const { param } = this.props;
		const { data } = param;
		const { type } = data;
		const eventData = { type: 'exit', route: '' };

		switch (type) {
			case 'onboarding': {
				eventData.route = analytics.route.migrationOffer;
				Onboarding.start('dashboard', false, true);
				break;
			};
			case 'import': {
				eventData.route = analytics.route.migrationImport;
				break;
			};
		};

		analytics.event('ClickMigration', eventData);
	};

});

export default PopupMigration;
