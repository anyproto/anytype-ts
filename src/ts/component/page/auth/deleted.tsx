import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Frame, Cover, Title, Label, Error, HeaderAuth as Header, FooterAuth as Footer } from 'ts/component';
import { I, Util, C, Action, analytics } from 'ts/lib';
import { commonStore, authStore, popupStore } from 'ts/store';
import { observer } from 'mobx-react';
import { PieChart } from 'react-minimal-pie-chart';

interface Props extends RouteComponentProps<any> {}
interface State {
	error: string;
};

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
		const { cover } = commonStore;
		const { error } = this.state;
		const duration = Math.max(0, account.status.date - Util.time());

		let title = '';
		let description = '';
		let showPie = false;
		let rows: any[] = [];
		
		switch (account.status.type) {
			case I.AccountStatusType.PendingDeletion:
				title = `This account is planned for deletion in ${Util.duration(duration)}...`;
				description = `We're sorry to see you go. Once you request your account to be deleted, you have 30 days to cancel this request. After 30 days, your encrypted account data is permanently removed from the backup node, you won't be able to sign into Anytype on new devices.`;

				rows = rows.concat([
					{ name: 'Cancel deletion', className: 'red', onClick: this.onCancel },
				]);

				showPie = true;
				break;

			case I.AccountStatusType.StartedDeletion:
			case I.AccountStatusType.Deleted:
				title = `This account has been deleted`;
				description = `This device stores your data locally. You can export it, however, you are not able to use this account anymore.`;

				rows = rows.concat([
					{ name: 'Reset account data from this device', className: 'red', onClick: this.onReset },
					{ name: 'Export data to markdown', className: '', onClick: this.onExport },
				]);
				break;
		};

        return (
			<div>
				<Cover {...cover} className="main" />
				<Header />
				<Footer />
				
				<Frame>
					{showPie ? (
						<div className="pie">
							<div className="inner">
								<PieChart
									totalValue={30}
									startAngle={270}
									data={[ { title: '', value: Math.ceil(duration / 86400), color: '#f55522' } ]}
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

	onReset (e: any) {
		popupStore.open('confirm', {
			data: {
				title: `Are you sure you want to delete your local account data?`,
				text: 'These objects will be deleted irrevocably. You can’t undo this action.',
				textConfirm: 'Delete',
				onConfirm: () => { 
					C.AccountStop(false);
					authStore.logout();
					Util.route('/');
				},
			},
		});
	};

	onExport (e: any) {
		Action.export([], I.ExportFormat.Markdown, true, true, true, () => {}, (message: any) => {
			analytics.event('ExportMarkdown', { middleTime: message.middleTime });
		});
	};

	onCancel (e: any) {
		C.AccountDelete(true, (message: any) => {
			Util.route('/main/index');
		});
	};
	
});

export default PageAuthDeleted;