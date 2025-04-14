import React, { forwardRef, useState } from 'react';
import { observer } from 'mobx-react';
import { Frame, Error, ProgressBar, Button, Icon, Title, Label } from 'Component';
import { I, C, S, U, Storage, translate } from 'Lib';

const PageAuthMigrate = observer(forwardRef<{}, I.PageComponent>((props, ref) => {

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
				setErrorText(U.Common.sprintf(translate('pageAuthMigrateErrorNotEnoughSpaceText'), U.File.size(message.requiredSpace)));
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

	const onCancel = () => {
		C.AccountMigrateCancel(accountId, (message: any) => {
			if (message.error.code) {
				setErrorText(message.error.description);
			};
		});
	};

	let content = null;

	switch (screen) {
		case 'init': {
			content = (
				<>
					<div className="iconBg">
						<Icon />
					</div>
					<Title text={translate('pageAuthMigrateInitTitle')} />
					<Label text={translate('pageAuthMigrateInitText')} />
					<div className="buttons">
						<Button text={translate('pageAuthMigrateInitButtonStartUpdate')} className="c36" color="none" onClick={onMigrate} />
						<Button text={translate('pageAuthMigrateInitButtonReadMore')} className="c36" color="blank" onClick={() => setScreen('info')} />
					</div>
				</>
			);
			break;
		};

		case 'info': {
			content = (
				<>
					<div className="back" onClick={() => setScreen('init')}>
						<Icon />
						{translate('commonBack')}
					</div>

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
					<div className="iconBg">
						<Icon />
					</div>
					<Title text={errorTitle} />
					<Label text={errorText} />
					<Button text={translate('pageAuthMigrateTryAgain')} className="c36" color="none" onClick={onMigrate} />
				</>
			);
			break;
		};
	};

	return (
		<Frame className={screen}>
			{content}
		</Frame>
	);

}));

export default PageAuthMigrate;
