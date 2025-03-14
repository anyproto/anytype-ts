import React, { forwardRef, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Button, QR } from 'Component';
import { I, U, J, Onboarding, translate, analytics } from 'Lib';

const PopupMigration = observer(forwardRef<{}, I.Popup>((props, ref) => {

	const { param, close } = props;
	const { data } = param;
	const { type } = data;

	let content = null;

	switch (type) {
		case 'onboarding': {
			content = (
				<>
					<Title text={'⚡️ ' + translate('popupMigrationOnboardingTitle')} />
					<Label text={translate('popupMigrationOnboardingText1')} />
					<Label text={translate('popupMigrationOnboardingText2')} />

					<div className="qrWrap">
						<QR value={J.Url.download} />
					</div>

					<Label text={translate('popupMigrationOnboardingText3')} />

					<div className="buttons">
						<Button text={translate('commonDone')} className="c36" onClick={() => close()} />
					</div>
				</>
			);
			break;
		};

		case 'import': {
			content = (
				<>
					<Title text={translate('popupMigrationImportTitle')} />
					<Label text={translate('popupMigrationImportText1')} />
					<Label text={translate('popupMigrationImportText2')} />

					<div className="qrWrap">
						<QR value={J.Url.download} />
					</div>

					<Label text={U.Common.sprintf(translate('popupMigrationImportText3'), J.Url.community)} />

					<div className="buttons">
						<Button text={translate('commonDone')} className="c36" onClick={() => close()} />
					</div>
				</>
			);
			break;
		};
	};

	useEffect(() => {
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

		return () => {
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
	}, []);

	return content;

}));

export default PopupMigration;
