import React, { forwardRef, useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { Frame, Error, ProgressBar } from 'Component';
import { I, C, S, U, Animation, Storage } from 'Lib';

const PageAuthMigrate = observer(forwardRef<{}, I.PageComponent>((props, ref) => {

	const { dataPath } = S.Common;
	const accountId = Storage.get('accountId');
	const spaceId = Storage.get('spaceId');
	const [ error, setError ] = useState('');
	const { networkConfig } = S.Auth;
	const { mode, path } = networkConfig;
	const types = [ I.ProgressType.Migrate ];
	const list = S.Progress.getList(it => types.includes(it.type));
	const progress = list.length ? list[0] : null;
	const segments = [];

	if (progress) {
		segments.push({ name: 'migrate', caption: 'Migrate', percent: progress.current / progress.total, isActive: true });
	};

	useEffect(() => {
		S.Auth.clearAll();

		Animation.to(() => {
			C.AccountMigrate(accountId, dataPath, (message: any) => {
				if (message.error.code) {
					setError(message.error.description);
					return;
				};

				C.AccountSelect(accountId, dataPath, mode, path, (message: any) => {
					const { account } = message;

					if (!account) {
						return;
					};

					S.Auth.accountSet(account);
					S.Common.configSet(account.config, false);

					const routeParam = { replace: true };

					if (spaceId) {
						U.Router.switchSpace(spaceId, '', false, routeParam);
					} else {
						U.Data.onAuthWithoutSpace(routeParam);
					};

					U.Data.onInfo(account.info);
					U.Data.onAuthOnce(false);
				});

			});
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