import React, { forwardRef, useState, useEffect } from 'react';
import { Title, IconObject, ObjectName, Icon, EmptyState } from 'Component';
import * as I from 'Interface';

const PageMainSettingsDataPublish = forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const { getId } = props;
	const [ list, setList ] = useState<I.PublishState[]>([]);
	const { dateFormat } = S.Common;

	const load = () => {
		C.PublishingList('', (message: any) => {
			if (!message.error.code) {
				setList(message.list);
			};
		});
	};

	const onClick = (item: any) => {
		Action.openUrl(U.Space.getPublishUrl(item.uri));
	};

	const onMore = (item: any) => {
		const elementSelector = `#${getId()} #icon-more-${item.objectId}`;
		const object = S.Detail.mapper(item.details);
		const options: any[] = [
			{ id: 'open', name: translate('menuPublishButtonOpen') },
			{ isDiv: true },
			{ id: 'view', name: translate('menuPublishButtonView') },
			{ id: 'copy', name: translate('menuPublishButtonCopy') },
			{ id: 'unpublish', name: translate('menuPublishButtonUnpublish'), color: 'destructive' },
		];

		S.Menu.open('select', {
			element: elementSelector,
			horizontal: I.MenuDirection.Right,
			offsetY: 4,
			onOpen: () => U.Dom.addClass(U.Dom.select(elementSelector), 'active'),
			onClose: () => U.Dom.removeClass(U.Dom.select(elementSelector), 'active'),
			data: {
				options,
				onSelect: (e: any, element: any) => {
					switch (element.id) {
						case 'open': {
							U.Object.openAuto(object);
							break;
						};

						case 'view': {
							onClick(item);
							break;
						};

						case 'copy': {
							U.Common.copyToast(translate('commonLink'), U.Space.getPublishUrl(item.uri));
							break;
						};

						case 'unpublish': {
							onUnpublish(item);
							break;
						};
					};
				},
			},
		});
	};

	const onUnpublish = (item: any) => {
		const object = S.Detail.mapper(item.details);

		C.PublishingRemove(item.spaceId, item.objectId, (message: any) => {
			if (!message.error.code) {
				load();
				analytics.event('ShareObjectUnpublish', { objectType: object.type });
			};
		});

		analytics.event('ClickShareObjectUnpublish', { objectType: object.type });
	};


	const Row = (item: any) => {
		const object = S.Detail.mapper(item.details);

		return (
			<div className="row">
				<div className="col colObject" onClick={() => onClick(item)}>
					<IconObject object={object} />
					<ObjectName object={object} />
				</div>
				<div className="col colDate">{U.Date.dateWithFormat(dateFormat, item.timestamp)}</div>
				<div className="col">{U.File.size(item.size)}</div>
				<div className="col colMore">
					<Icon id={`icon-more-${item.objectId}`} name="common/more" className="more" withBackground={true} onClick={() => onMore(item)} />
				</div>
			</div>
		);
	};

	useEffect(() => {
		load();
	}, []);

	return (
		<>
			<Title text={translate('popupSettingsDataManagementDataPublishTitle')} />

			{list.length ? (
				<div className="items">
					<div className="row isHead">
						<div className="col colSpace">{translate('commonObject')}</div>
						<div className="col">{translate('popupSettingsDataManagementDataPublishDate')}</div>
						<div className="col">{translate('commonSize')}</div>
						<div className="col colMore" />
					</div>
					{list.map((item: any, i: number) => <Row key={i} {...item} />)}
				</div>
			) : (
				<EmptyState text={translate('popupSettingsDataManagementDataPublishEmpty')} />
			)}
		</>
	);

});

export default PageMainSettingsDataPublish;