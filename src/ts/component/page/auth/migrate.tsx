import React, { forwardRef, useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { Frame, Error, ProgressBar } from 'Component';
import { I, C, S, U, Storage } from 'Lib';

const PageAuthMigrate = observer(forwardRef<{}, I.PageComponent>((props, ref) => {

	const { dataPath } = S.Common;
	const accountId = Storage.get('accountId');
	const [ error, setError ] = useState('');
	const types = [ I.ProgressType.Migrate ];
	const list = S.Progress.getList(it => types.includes(it.type));
	const progress = list.length ? list[0] : null;
	const segments = [];

	if (progress) {
		segments.push({ name: '', caption: '', percent: progress.current / progress.total, isActive: true });
	};

	useEffect(() => {
		S.Auth.clearAll();

		C.AccountMigrate(accountId, dataPath, (message: any) => {
			if (message.error.code) {
				setError(message.error.description);
				return;
			};

			U.Router.go('/auth/setup/init', { replace: true });
		});
	}, []);

	return (
		<Frame>
			<Error text={error} />
			<ProgressBar segments={segments} />
		</Frame>
	);

}));

export default PageAuthMigrate;