import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, IconObject, ObjectName, Icon } from 'Component';
import { I, S, U, J, C, translate, Action } from 'Lib';
import Head from '../head';

interface State {
	list: I.PublishState[];
};

const SUB_ID = 'dataPublish';

const PopupSettingsPageDataPublish = observer(class PopupSettingsPageDataPublish extends React.Component<I.PopupSettings, State> {

	state = {
		list: [],
	};

	render () {
		const { dateFormat } = S.Common;
		const { list } = this.state;

		const Row = (item: any) => {
			const object = S.Detail.get(SUB_ID, item.objectId);

			return (
				<div className="row">
					<div className="col colObject" onClick={() => this.onClick(item)}>
						<IconObject object={object} />
						<ObjectName object={object} />
					</div>
					<div className="col colDate">{U.Date.dateWithFormat(dateFormat, item.timestamp)}</div>
					<div className="col">{U.File.size(item.size)}</div>
					<div className="col colMore">
						<Icon id={`icon-more-${item.id}`} className="more withBackground" onClick={() => this.onMore(item)} />
					</div>
				</div>
			);
		};

		return (
			<>
				<Head {...this.props} returnTo="dataIndex" name={translate('commonBack')} />
				<Title text={translate('popupSettingsDataManagementDataPublishTitle')} />

				<div className="items">
					<div className="row isHead">
						<div className="col colSpace">{translate('commonObject')}</div>
						<div className="col">{translate('popupSettingsDataManagementDataPublishTitle')}</div>
						<div className="col">{translate('commonSize')}</div>
						<div className="col colMore" />
					</div>
					{list.map((item: any, i: number) => <Row key={i} {...item} />)}
				</div>
			</>
		);
	};

	componentDidMount(): void {
		C.PublishingList(S.Common.space, (message: any) => {
			if (!message.error.code) {
				const list = message.list;
				const ids = list.map(item => item.objectId);

				U.Data.subscribeIds({
					subId: SUB_ID,
					ids,
					noDeps: true,
				}, () => {
					this.setState({ list });
				});
			};
		});
	};

	componentWillUnmount(): void {
		C.ObjectSearchUnsubscribe([ SUB_ID ]);
	};

	onClick (item: any) {
		Action.openUrl(U.Space.getPublishUrl(item.uri));
	};

	onMore (item: any) {
		console.log('onMore', item);
	};

});

export default PopupSettingsPageDataPublish;