import React, { forwardRef, useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { Frame, Error, ProgressBar, Button, Icon, Title, Label } from 'Component';
import { I, C, S, U, Storage, translate } from 'Lib';

const PageAuthMigrate = observer(forwardRef<{}, I.PageComponent>((props, ref) => {

	const { dataPath } = S.Common;
	const accountId = Storage.get('accountId');
	const [ errorCode, setErrorCode ] = useState('');
	const types = [ I.ProgressType.Migrate ];
	const list = S.Progress.getList(it => types.includes(it.type));
	const progress = list.length ? list[0] : null;

	let segments = [];
	let title = translate('pageAuthMigrateTitle');
	let text = translate('pageAuthMigrateText');

	if (progress) {
		segments.push({ name: '', caption: '', percent: progress.current / progress.total, isActive: true });
	};

	if (errorCode) {
		// TODO: change title and text accordingly to error code
		title = translate('pageAuthMigrateErrorTitle');
		text = translate('pageAuthMigrateErrorText');
	};

	const onMigrate = () => {
		S.Auth.clearAll();
		segments = [];

		C.AccountMigrate(accountId, dataPath, (message: any) => {
			if (message.error.code) {
				setErrorCode(message.error.description);
				return;
			};

			U.Router.go('/auth/setup/init', { replace: true });
		});
	};

	const onCancel = () => {
		C.AccountMigrateCancel(accountId, (message: any) => {
			if (message.error.code) {
				setErrorCode(message.error.code);
			};
		});
	};

	useEffect(() => {
		onMigrate();
	}, []);

	return (
		<Frame>
			<Icon className={errorCode ? 'error' : ''} />
			<Title text={title} />
			<Label text={text} />
			{!errorCode ? (
				<ProgressBar segments={segments} />
			) : (
				<Button text={translate('pageAuthMigrateTryAgain')} className="c36" color="none" />
			)}
		</Frame>
	);

}));

export default PageAuthMigrate;
