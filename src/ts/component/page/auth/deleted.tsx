import * as React from 'react';
import { Frame, Title, Label, Error, Header, Button } from 'Component';
import { I, Util, C, Action, Survey, ObjectUtil, analytics, translate } from 'Lib';
import { authStore, popupStore } from 'Store';
import { observer } from 'mobx-react';
import { PieChart } from 'react-minimal-pie-chart';
import CanvasWorkerBridge from "./animation/canvasWorkerBridge"
import { OnboardStage } from './animation/constants';
import Constant from 'json/constant.json';

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

		this.onRemoveLocalData = this.onRemoveLocalData.bind(this);
		this.onExport = this.onExport.bind(this);
		this.onCancel = this.onCancel.bind(this);
	};
	
	render () {
		const { account } = authStore;
		if (!account) {
			return null;
		};

		const { error } = this.state;

		// Time left until permanent deletion
		const SECS_PER_DAY = 86400;
		/*
			account.status.date is the date of deletion as a UNIX timestamp in seconds
			Util.time() is the current date as a UNIX timestamp in seconds
			Math.max(0, ...) is to prevent negative numbers
			Math.ceil(...) is to round up to the next day

			TODO fix the implementation and document what account.status.date means 
		*/
		console.log(account.status.date);
		const daysUntilDeletion = Math.ceil(Math.max(0, account.status.date - Util.time()) / SECS_PER_DAY);
		const dt = `${daysUntilDeletion} ${Util.cntWord(daysUntilDeletion, 'day', 'days')}`;
		const pieValue = Math.min(DAYS - 1, Math.max(1, DAYS - daysUntilDeletion));

		// Deletion Status
		let status: I.AccountStatusType = account.status.type;
		if ((status == I.AccountStatusType.PendingDeletion) && daysUntilDeletion === 0) {
			status = I.AccountStatusType.Deleted;
		};

		// UI Elements
		let showPie = false;
		let title = '';
		let description = '';
		let cancelButton = null;
		const exportButton = <Button className="outlined" text={translate("authDeleteExportButton")} onClick={this.onExport} />;
		const removeButton = <span className="remove" onClick={this.onRemoveLocalData}>{translate("authDeleteRemoveButton")}</span>

		switch (status) {
			case I.AccountStatusType.PendingDeletion:
				showPie = true;
				// TODO figure out how to make translate work with dynamic templating
				title = `This account is planned for deletion in ${dt}`;
				description = translate("authDeleteDescription");
				cancelButton = <Button type="input" text={translate("authDeleteCancelButton")} onClick={this.onCancel} />;
				break;
			case I.AccountStatusType.StartedDeletion:
			case I.AccountStatusType.Deleted:
				title = translate("authDeleteTitleDeleted");
				description = translate("authDeleteDescriptionDeleted");
				break;
		};

        return (
			<div>
				<Header {...this.props} component="authIndex" />
				<CanvasWorkerBridge state={OnboardStage.Void} />
				
				<Frame>
					{showPie ? (
						<div className="animation pie">
							<div className="inner">
								<PieChart
									totalValue={DAYS}
									startAngle={270}
									data={[ { title: '', value: pieValue, color: '#5C5A54' } ]}
								/>
							</div>
						</div>
					): null}

					<Title className="animation" text={title} />
					<Label className="animation" text={description} />
					<Error className="animation" text={error} />
								
					<div className="animation buttons">
						{cancelButton}
						{exportButton}
						{removeButton}
					</div>
				</Frame>
			</div>
		);
	};

	componentDidMount() {
		window.setTimeout(() => {
			Survey.check(I.SurveyType.Delete);
		}, Constant.delay.popup);
	};

	onRemoveLocalData () {
		popupStore.open('confirm', {
			data: {
				title: translate("authDeleteRemovePopupTitle"),
				text: translate("authDeleteRemovePopupText"),
				textConfirm: translate("authDeleteRemovePopupConfirm"),
				onConfirm: () => { 
					authStore.logout(true);
					Util.route('/');
				},
			},
		});
	};

	onExport () {
		Action.export([], I.ExportType.Markdown, true, true, true);
	};

	onCancel () {
		C.AccountDelete(true, (message) => {
			authStore.accountSet({ status: message.status });
			ObjectUtil.openHome('route');
			analytics.event('CancelDeletion');
		});
	};
	
});

export default PageAuthDeleted;