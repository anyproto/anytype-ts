import React, { forwardRef, useEffect } from 'react';
import { observer } from 'mobx-react';
import { PieChart } from 'react-minimal-pie-chart';
import { Frame, Title, Label, Button, Header } from 'Component';
import { I, C, S, U, Action, Survey, analytics, translate, J } from 'Lib';

const DAYS = 30;

const PageAuthDeleted = observer(forwardRef<I.PageRef, I.PageComponent>(() => {

	const { account } = S.Auth;
	const theme = S.Common.getThemeClass();
	const color = J.Theme[theme].progress;
	const cn = [];

	const onRemove = () => {
		S.Popup.open('confirm', {
			data: {
				title: translate('authDeleteRemovePopupTitle'),
				text: translate('authDeleteRemovePopupText'),
				textConfirm: translate('authDeleteRemovePopupConfirm'),
				onConfirm: () => { 
					S.Auth.logout(true, true);
					U.Router.go('/auth/select', { replace: true });
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
			U.Space.openDashboardOrVoid();
			analytics.event('CancelDeletion');
		});
	};

	const onLogout = () => {
		U.Router.go('/auth/select', { 
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
	let percent = 0;

	if (account) {
		const duration = Math.max(0, account.status.date - U.Date.now());
		
		days = Math.max(1, Math.floor(duration / J.Constant.day));
		percent = Math.floor((DAYS - days) / DAYS * 100);
		const dt = U.String.sprintf(translate('commonCountDays'), days, U.Common.plural(days, translate('pluralDay')));

		// Deletion Status
		let status: I.AccountStatusType = account.status.type;
		if ((status == I.AccountStatusType.PendingDeletion) && !duration) {
			status = I.AccountStatusType.Deleted;
		};

		switch (status) {
			case I.AccountStatusType.PendingDeletion: {
				showPie = true;
				title = U.String.sprintf(translate('pageAuthDeletedAccountDeletionTitle'), dt);
				description = translate('authDeleteDescription');
				cancelButton = <Button type="input" color="accent" className="c48" text={translate('authDeleteCancelButton')} onClick={onCancel} />;
				cn.push('isPending');
				break;
			};

			case I.AccountStatusType.StartedDeletion:
			case I.AccountStatusType.Deleted: {
				title = translate('authDeleteTitleDeleted');
				cn.push('isDeleted');
				break;
			};
		};
	};

	useEffect(() => {
		window.setTimeout(() => Survey.check(I.SurveyType.Delete), S.Popup.getTimeout());
	}, []);

	return account ? (
		<div className={cn.join(' ')}>
			<Header component="authLogout" />
			<Frame>
				{showPie ? (
					<div className="animation pie">
						<PieChart
							totalValue={100}
							startAngle={180}
							lengthAngle={360}
							lineWidth={20}
							paddingAngle={0}
							rounded={true}
							data={[
								{ title: '', value: 100 - percent, color: color.bg },
								{ title: '', value: percent, color: color.fg },
							]}
						/>
					</div>
				) : null}

				<Title className="animation" text={title} />
				{description ? <Label className="animation" text={description} /> : ''}
							
				<div className="animation buttons">
					{cancelButton}
					<Button color="blank" className="c48" text={translate('authDeleteExportButton')} onClick={onExport} />
					<div className="remove" onClick={onRemove}>{translate('authDeleteRemoveButton')}</div>
				</div>
			</Frame>
		</div>
	) : null;

}));

export default PageAuthDeleted;
