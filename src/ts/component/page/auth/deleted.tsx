import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Frame, Cover, Title, Label, Error, Header, Footer } from 'Component';
import { I, Util, C, Action, analytics, Survey } from 'Lib';
import { commonStore, authStore, popupStore } from 'Store';
import { observer } from 'mobx-react';
import { PieChart } from 'react-minimal-pie-chart';

const Constant = require('json/constant.json');

interface Props extends RouteComponentProps<any> {}
interface State {
	error: string;
};

const DAYS = 30;

const PageAuthDeleted = observer(class PageAuthDeleted extends React.Component<Props, State> {

	state = {
		error: ''
	};

	constructor (props: any) {
        super(props);

		this.onReset = this.onReset.bind(this);
		this.onExport = this.onExport.bind(this);
		this.onCancel = this.onCancel.bind(this);
	};
	
	render () {
		const { account } = authStore;
		if (!account) {
			return null;
		};

		const { cover } = commonStore;
		const { error } = this.state;
		const duration = Math.max(0, account.status.date - Util.time());
		const days = Math.max(1, Math.ceil(duration / 86400));
		const dt = `${days} ${Util.cntWord(days, 'day', 'days')}`;

		let title = '';
		let description = '';
		let showPie = false;
		let pieValue = 0;
		let rows: any[] = [];
		let status: I.AccountStatusType = account.status.type;

		if ((status == I.AccountStatusType.PendingDeletion) && !duration) {
			status = I.AccountStatusType.Deleted;
		};

		switch (status) {
			case I.AccountStatusType.PendingDeletion:
				title = `This account is planned for deletion in ${dt}...`;
				description = `We're sorry to see you go. You have ${dt} to cancel this request. After ${dt}, your encrypted account data is permanently removed from the backup node.`;

				rows = rows.concat([
					{ name: 'Cancel deletion', onClick: this.onCancel },
					{ name: 'Logout and clear data', className: 'red', onClick: this.onReset },
				]);

				showPie = true;
				pieValue = Math.min(DAYS - 1, Math.max(1, DAYS - days));
				break;

			case I.AccountStatusType.StartedDeletion:
			case I.AccountStatusType.Deleted:
				title = `This account has been deleted`;
				description = `This device stores your data locally. You can export it, however, you are not able to use this account anymore.`;

				rows = rows.concat([
					{ name: 'Logout and clear data', className: 'red', onClick: this.onReset },
					{ name: 'Export data to markdown', className: '', onClick: this.onExport },
				]);
				break;
		};

        return (
			<div>
				<Cover {...cover} className="main" />
				<Header {...this.props} component="authIndex" />
				<Footer {...this.props} component="authIndex" />
				
				<Frame>
					{showPie ? (
						<div className="pie">
							<div className="inner">
								<PieChart
									totalValue={DAYS}
									startAngle={270}
									data={[ { title: '', value: pieValue, color: '#f55522' } ]}
								/>
							</div>
						</div>
					) : ''}

					<Title text={title} />
					<Label text={description} />
					<Error text={error} />
								
					<div className="rows">
						{rows.map((item: any, i: number) => (
							<div key={i} className={[ 'row', item.className ].join(' ')} onClick={item.onClick}>
								{item.name}
							</div>
						))}
					</div>
				</Frame>
			</div>
		);
	};

	componentDidMount() {
		setTimeout(() => {
			Survey.deletion();
		}, Constant.delay.popup);
	};

	onReset (e: any) {
		popupStore.open('confirm', {
			data: {
				title: `Are you sure you want to delete your local account data?`,
				text: 'These objects will be deleted irrevocably. You can’t undo this action.',
				textConfirm: 'Delete',
				onConfirm: () => { 
					authStore.logout(true);
					Util.route('/');
				},
			},
		});
	};

	onExport (e: any) {
		Action.export([], I.ExportFormat.Markdown, true, true, true, () => {});
	};

	onCancel (e: any) {
		C.AccountDelete(true, (message: any) => {
			authStore.accountSet({ status: message.status });
			Util.route('/main/index');
		});
	};
	
});

export default PageAuthDeleted;