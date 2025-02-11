import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, IconObject, ObjectName, Icon } from 'Component';
import { I, S, U, C, translate, Action, analytics } from 'Lib';

interface State {
	list: I.PublishState[];
};

const SUB_ID = 'dataPublish';

const PageMainSettingsDataPublish = observer(class PageMainSettingsDataPublish extends React.Component<I.PageSettingsComponent, State> {

	state = {
		list: [],
	};

	render () {
		const { dateFormat } = S.Common;
		const { list } = this.state;

		const Row = (item: any) => {
			const object = S.Detail.mapper(item.details);

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
				<Title text={translate('popupSettingsDataManagementDataPublishTitle')} />

				<div className="items">
					<div className="row isHead">
						<div className="col colSpace">{translate('commonObject')}</div>
						<div className="col">{translate('popupSettingsDataManagementDataPublishDate')}</div>
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
		C.PublishingList('', (message: any) => {
			if (!message.error.code) {
				this.setState({ list: message.list });
			};
		});
	};

	onClick (item: any) {
		Action.openUrl(U.Space.getPublishUrl(item.uri));
	};

	onMore (item: any) {
		const { getId } = this.props;
		const element = $(`#${getId()} #icon-more-${item.objectId}`);
		const object = S.Detail.mapper(item.details);
		const options: any[] = [
			{ id: 'open', name: translate('menuPublishButtonOpen') },
			{ isDiv: true },
			{ id: 'view', name: translate('menuPublishButtonView') },
			{ id: 'copy', name: translate('menuPublishButtonCopy') },
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
						case 'open': {
							U.Object.openAuto(object);
							break;
						};

						case 'view': {
							this.onClick(item);
							break;
						};

						case 'copy': {
							U.Common.copyToast(translate('commonLink'), U.Space.getPublishUrl(item.uri));
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

	onUnpublish (item: any) {
		const object = S.Detail.mapper(item.details);

		C.PublishingRemove(item.spaceId, item.objectId, (message: any) => {
			if (!message.error.code) {
				this.load();

				analytics.event('ShareObjectUnpublish', { objectType: object.type });
			};
		});

		analytics.event('ClickShareObjectUnpublish', { objectType: object.type });
	};

});

export default PageMainSettingsDataPublish;
