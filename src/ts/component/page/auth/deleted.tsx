import * as React from 'react';
import { observer } from 'mobx-react';
import { PieChart } from 'react-minimal-pie-chart';
import { Frame, Title, Label, Error, Button } from 'Component';
import { I, C, S, U, Action, Survey, analytics, translate } from 'Lib';
import CanvasWorkerBridge from './animation/canvasWorkerBridge';
import { OnboardStage } from './animation/constants';

interface State {
	error: string;
};

const DAYS = 30;

const PageAuthDeleted = observer(class PageAuthDeleted extends React.Component<I.PageComponent, State> {

	state = {
		error: ''
	};

	constructor (props: I.PageComponent) {
        super(props);

		this.onRemove = this.onRemove.bind(this);
		this.onExport = this.onExport.bind(this);
		this.onCancel = this.onCancel.bind(this);
		this.onLogout = this.onLogout.bind(this);
	};
	
	render () {
		const { account } = S.Auth;
		if (!account) {
			return null;
		};

		const { error } = this.state;
		const duration = Math.max(0, account.status.date - U.Date.now());
		const days = Math.max(1, Math.floor(duration / 86400));
		const dt = `${days} ${U.Common.plural(days, translate('pluralDay'))}`;

		// Deletion Status
		let status: I.AccountStatusType = account.status.type;
		if ((status == I.AccountStatusType.PendingDeletion) && !duration) {
			status = I.AccountStatusType.Deleted;
		};

		// UI Elements
		let showPie = false;
		let title = '';
		let description = '';
		let cancelButton = null;

		switch (status) {
			case I.AccountStatusType.PendingDeletion: {
				showPie = true;
				title = U.Common.sprintf(translate('pageAuthDeletedAccountDeletionTitle'), dt);
				description = translate('authDeleteDescription');
				cancelButton = <Button type="input" text={translate('authDeleteCancelButton')} onClick={this.onCancel} />;
				break;
			};

			case I.AccountStatusType.StartedDeletion:
			case I.AccountStatusType.Deleted: {
				title = translate('authDeleteTitleDeleted');
				description = translate('authDeleteDescriptionDeleted');
				break;
			};
		};

        return (
			<div>
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
					<Error className="animation" text={error} />
								
					<div className="animation buttons">
						{cancelButton}
						<Button color="blank" text={translate('authDeleteExportButton')} onClick={this.onExport} />
						<div className="remove" onClick={this.onRemove}>{translate('authDeleteRemoveButton')}</div>
					</div>
				</Frame>

				<div className="animation small bottom" onClick={this.onLogout}>
					Log out
				</div>
			</div>
		);
	};

	componentDidMount() {
		window.setTimeout(() => Survey.check(I.SurveyType.Delete), S.Popup.getTimeout());
	};

	onRemove () {
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

	onExport () {
		Action.export('', [], I.ExportType.Markdown, { 
			zip: true, 
			nested: true, 
			files: true, 
			archived: true, 
			json: false, 
			route: analytics.route.deleted,
		});
	};

	onCancel () {
		C.AccountRevertDeletion((message) => {
			S.Auth.accountSetStatus(message.status);	
			U.Space.openDashboard('route');
			analytics.event('CancelDeletion');
		});
	};

	onLogout () {
		U.Router.go('/', { 
			replace: true, 
			animate: true,
			onFadeIn: () => {
				S.Auth.logout(true, false);
			},
		});
	};
	
});

export default PageAuthDeleted;
