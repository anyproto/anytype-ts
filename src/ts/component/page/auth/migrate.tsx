import React, { forwardRef, useState } from 'react';
import { Frame, ProgressBar, Button, Icon, Title, Label } from 'Component';
import * as I from 'Interface';
import Storage from 'Lib/storage';

const PageAuthMigrate = forwardRef<I.PageRef, I.PageComponent>((props, ref) => {

	const { dataPath } = S.Common;
	const accountId = Storage.get('accountId');
	const [ screen, setScreen ] = useState('init');
	const [ errorTitle, setErrorTitle ] = useState('');
	const [ errorText, setErrorText ] = useState('');
	const types = [ I.ProgressType.Migrate ];
	const list = S.Progress.getList(it => types.includes(it.type));
	const progress = list.length ? list[0] : null;

	let segments = [];
	if (progress) {
		segments.push({ name: '', caption: '', percent: progress.current / progress.total, isActive: true });
	};

	const onMigrate = () => {
		S.Auth.clearAll();
		segments = [];
		setScreen('migration');

		C.AccountMigrate(accountId, dataPath, (message: any) => {
			if (message.requiredSpace) {
				setErrorTitle(translate('pageAuthMigrateErrorNotEnoughSpaceTitle'));
				setErrorText(U.String.sprintf(translate('pageAuthMigrateErrorNotEnoughSpaceText'), U.File.size(message.requiredSpace)));
				setScreen('error');
				return;
			} else
			if (message.error.code) {
				setErrorTitle(translate('commonError'));
				setErrorText(message.error.description);
				setScreen('error');
				return;
			};

			U.Router.go('/auth/setup/init', { replace: true });
		});
	};

	let content = null;

	switch (screen) {
		default:
		case 'init': {
			content = (
				<>
					<Icon />
					<Title text={translate('pageAuthMigrateInitTitle')} />
					<Label text={translate('pageAuthMigrateInitText')} />
					<div className="buttons">
						<Button text={translate('pageAuthMigrateInitButtonStartUpdate')} size={48} color="accent" onClick={onMigrate} />
						<Button text={translate('pageAuthMigrateInitButtonReadMore')} size={48} color="none" onClick={() => setScreen('info')} />
					</div>
				</>
			);
			break;
		};

		case 'info': {
			content = (
				<>
					<Icon name="common/close" withBackground={true} onClick={() => setScreen('init')} />

					<div className="items">
						<div className="item">
							<Icon className="process" />
							<div className="text">
								<Title text={translate('pageAuthMigrateInfoProcessTitle')} />
								<Label text={translate('pageAuthMigrateInfoProcessText')} />
							</div>
						</div>
						<div className="item">
							<Icon className="data" />
							<div className="text">
								<Title text={translate('pageAuthMigrateInfoDataTitle')} />
								<Label text={translate('pageAuthMigrateInfoDataText1')} />
								<Label text={translate('pageAuthMigrateInfoDataText2')} />
							</div>
						</div>
					</div>
				</>
			);
			break;
		};

		case 'migration': {
			content = (
				<>
					<Title text={translate('pageAuthMigrateTitle')} />
					<Label text={translate('pageAuthMigrateText')} />
					<ProgressBar segments={segments} />
				</>
			);
			break;
		};

		case 'error': {
			content = (
				<>
					<Icon />
					<Title text={errorTitle} />
					<Label text={errorText} />
					<Button text={translate('pageAuthMigrateTryAgain')} size={48} color="accent" onClick={onMigrate} />
				</>
			);
			break;
		};
	};

	return (
		<Frame className={U.String.toCamelCase(`frame-${screen}`)}>
			{content}
		</Frame>
	);

});

export default PageAuthMigrate;
