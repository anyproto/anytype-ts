import React, { forwardRef, useEffect } from 'react';
import { observer } from 'mobx-react';
import { PieChart } from 'react-minimal-pie-chart';
import { Frame, Title, Label, Button } from 'Component';
import { I, C, S, U, Action, Survey, analytics, translate } from 'Lib';
import CanvasWorkerBridge from './animation/canvasWorkerBridge';
import { OnboardStage } from './animation/constants';

const DAYS = 30;

const PageAuthDeleted = observer(forwardRef<{}, I.PageComponent>(() => {

	const { account } = S.Auth;

	const onRemove = () => {
		S.Popup.open('confirm', {
			data: {
				title: translate('authDeleteRemovePopupTitle'),
				text: translate('authDeleteRemovePopupText'),
				textConfirm: translate('authDeleteRemovePopupConfirm'),
				onConfirm: () => { 
					S.Auth.logout(true, true);
					U.Router.go('/', { replace: true });
				},
			},
		});
	};

	const onExport = () => {
		Action.export('', [], I.ExportType.Markdown, { 
			zip: true, 
			nested: true, 
			files: true, 
			archived: true, 
			json: false, 
			route: analytics.route.deleted,
		});
	};

	const onCancel = () => {
		C.AccountRevertDeletion((message) => {
			S.Auth.accountSetStatus(message.status);	
			U.Space.openDashboard();
			analytics.event('CancelDeletion');
		});
	};

	const onLogout = () => {
		U.Router.go('/', { 
			replace: true, 
			animate: true,
			onFadeIn: () => {
				S.Auth.logout(true, false);
			},
		});
	};

	// UI Elements
	let showPie = false;
	let title = '';
	let description = '';
	let cancelButton = null;
	let days = 0;

	if (account) {
		const duration = Math.max(0, account.status.date - U.Date.now());
		
		days = Math.max(1, Math.floor(duration / 86400));
		const dt = `${days} ${U.Common.plural(days, translate('pluralDay'))}`;

		// Deletion Status
		let status: I.AccountStatusType = account.status.type;
		if ((status == I.AccountStatusType.PendingDeletion) && !duration) {
			status = I.AccountStatusType.Deleted;
		};

		switch (status) {
			case I.AccountStatusType.PendingDeletion: {
				showPie = true;
				title = U.Common.sprintf(translate('pageAuthDeletedAccountDeletionTitle'), dt);
				description = translate('authDeleteDescription');
				cancelButton = <Button type="input" text={translate('authDeleteCancelButton')} onClick={onCancel} />;
				break;
			};

			case I.AccountStatusType.StartedDeletion:
			case I.AccountStatusType.Deleted: {
				title = translate('authDeleteTitleDeleted');
				description = translate('authDeleteDescriptionDeleted');
				break;
			};
		};
	};

	useEffect(() => {
		window.setTimeout(() => Survey.check(I.SurveyType.Delete), S.Popup.getTimeout());
	}, []);

	return account ? (
		<>
			<CanvasWorkerBridge state={OnboardStage.Void} />
			
			<Frame>
				{showPie ? (
					<div className="animation pie">
						<div className="inner">
							<PieChart
								totalValue={DAYS}
								startAngle={270}
								lengthAngle={-360}
								data={[ { title: '', value: days, color: '#d4d4d4' } ]}
							/>
						</div>
					</div>
				) : null}

				<Title className="animation" text={title} />
				<Label className="animation" text={description} />
							
				<div className="animation buttons">
					{cancelButton}
					<Button color="blank" text={translate('authDeleteExportButton')} onClick={onExport} />
					<div className="remove" onClick={onRemove}>{translate('authDeleteRemoveButton')}</div>
				</div>
			</Frame>

			<div className="animation small bottom" onClick={onLogout}>
				{translate('commonLogout')}
			</div>
		</>
	) : null;

}));

export default PageAuthDeleted;
