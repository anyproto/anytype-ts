import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Button } from 'Component';
import { analytics, I, Onboarding, translate, UtilCommon } from 'Lib';
import { commonStore } from 'Store';
import QRCode from 'qrcode.react';
import Url from 'json/url.json';

interface State {
	step: number;
};

const fgColor = {
	'': '#000',
	dark: '#d4d4d4',
};

const bgColor = {
	'': '#f2f2f2',
	dark: '#252525',
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
		const theme = commonStore.getThemeClass();

		let content = null;

		switch (type) {
			case 'onboarding': {
				content = (
					<React.Fragment>
						<Title text={'⚡️ ' + translate('popupMigrationOnboardingTitle')} />
						<Label text={translate('popupMigrationOnboardingText1')} />
						<Label text={translate('popupMigrationOnboardingText2')} />

						<div className="qrWrap">
							<QRCode value={Url.download} fgColor={fgColor[theme]} bgColor={bgColor[theme]} size={100} />
						</div>

						<Label text={translate('popupMigrationOnboardingText3')} />

						<div className="buttons">
							<Button text={translate('commonDone')} className="c36" onClick={close} />
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
							<QRCode value={Url.download} fgColor={fgColor[theme]} bgColor={bgColor[theme]} size={100} />
						</div>

						<Label text={UtilCommon.sprintf(translate('popupMigrationImportText3'), Url.community)} />

						<div className="buttons">
							<Button text={translate('commonDone')} className="c36" onClick={close} />
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
				eventData.route = 'MigrationImportBackupOffer';
				Onboarding.start('dashboard', false, true);
				break;
			};
			case 'import': {
				eventData.route = 'MigrationImportBackup';
				break;
			};
		};

		analytics.event('ClickMigration', eventData);
	};

});

export default PopupMigration;
