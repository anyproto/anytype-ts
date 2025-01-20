import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, IconObject, ObjectName, Icon } from 'Component';
import { I, S, U, C, translate, Action, analytics } from 'Lib';
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
						<Icon id={`icon-more-${item.objectId}`} className="more withBackground" onClick={() => this.onMore(item)} />
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
		this.load();
	};

	componentWillUnmount(): void {
		C.ObjectSearchUnsubscribe([ SUB_ID ]);
	};

	load () {
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

	onClick (item: any) {
		Action.openUrl(U.Space.getPublishUrl(item.uri));
	};

	onMore (item: any) {
		const { getId } = this.props;
		const element = $(`#${getId()} #icon-more-${item.objectId}`);
		const options: any[] = [
			{ id: 'update', name: translate('menuPublishButtonUpdate') },
			{ id: 'unpublish', name: translate('menuPublishButtonUnpublish'), color: 'red' },
		];

		S.Menu.open('select', {
			element,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Right,
			offsetY: 4,
			onOpen: () => element.addClass('active'),
			onClose: () => element.removeClass('active'),
			data: {
				options,
				onSelect: (e: any, element: any) => {
					switch (element.id) {
						case 'update': {
							this.onUpdate(item);
							break;
						};

						case 'unpublish': {
							this.onUnpublish(item);
							break;
						};
					};
				},
			},
		});
	};

	onUpdate (item: any) {
		const object = S.Detail.get(SUB_ID, item.objectId);

		C.PublishingCreate(S.Common.space, item.objectId, item.uri, false, (message: any) => {
			if (message.error.code) {
				return;
			};

			if (message.url) {
				Action.openUrl(message.url);
				analytics.event('ShareObjectPublish', { objectType: object.type });
			};
		});

		analytics.event('ClickShareObjectPublish', { objectType: object.type });
	};

	onUnpublish (item: any) {
		const object = S.Detail.get(SUB_ID, item.objectId);

		C.PublishingRemove(S.Common.space, item.objectId, (message: any) => {
			if (!message.error.code) {
				this.load();

				analytics.event('ShareObjectUnpublish', { objectType: object.type });
			};
		});

		analytics.event('ClickShareObjectUnpublish', { objectType: object.type });
	};

});

export default PopupSettingsPageDataPublish;