import React, { forwardRef, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Title, Icon, PreviewObject, EmptySearch } from 'Component';
import { I, J, U, S, C, translate, analytics } from 'Lib';

const SidebarSectionTypeTemplate = observer(forwardRef<{}, I.SidebarSectionComponent>((props, ref) => {

	const { rootId, object, readonly } = props;
	const subId = [ J.Constant.subId.template, rootId ].join('-');
	const items = S.Record.getRecords(subId);
	const templateId = object?.defaultTemplateId;

	const onAdd = () => {
		const details: any = {
			targetObjectType: rootId,
			layout: object.recommendedLayout,
		};

		C.ObjectCreate(details, [], '', J.Constant.typeKey.template, S.Common.space, (message) => {
			if (message.error.code) {
				return;
			};

			const object = message.details;

			analytics.event('CreateTemplate', { objectType: rootId });
			U.Object.openConfig(object);
		});
	};

	const onMore = (e: any, template: any) => {
		const item = U.Common.objectCopy(template);
		const node = $(`#sidebarRight #preview-${item.id}`);

		e.preventDefault();
		e.stopPropagation();

		if (!item.targetObjectType) {
			item.targetObjectType = rootId;
		};

		if (S.Menu.isOpen('dataviewTemplateContext', item.id)) {
			S.Menu.close('dataviewTemplateContext');
			return;
		};

		S.Menu.closeAll(J.Menu.dataviewTemplate, () => {
			S.Menu.open('dataviewTemplateContext', {
				menuKey: item.id,
				element: `#sidebarRight #item-more-${item.id}`,
				vertical: I.MenuDirection.Bottom,
				horizontal: I.MenuDirection.Right,
				subIds: J.Menu.dataviewTemplate,
				className: 'fixed',
				classNameWrap: 'fromSidebar',
				onOpen: () => node.addClass('active'),
				onClose: () => node.removeClass('active'),
				data: {
					template: item,
					isView: false,
					typeId: rootId,
					templateId: '',
					route: '',
					onDuplicate: object => U.Object.openConfig(object, {}),
					onSetDefault: id => {
						S.Menu.updateData('dataviewTemplateList', { templateId: id });
						U.Object.setDefaultTemplateId(rootId, id);
					},
				},
			});
		});
	};

	const Item = (item: any) => {
		const onMoreHandler = !readonly ? e => onMore(e, item) : null;
		const cn = [];

		if ((item.id == templateId) && templateId) {
			cn.push('isDefault');
		};

		return (
			<PreviewObject
				id={`preview-${item.id}`}
				key={`preview-${item.id}`}
				rootId={item.id}
				className={cn.join(' ')}
				size={I.PreviewSize.Small}
				onMore={onMoreHandler}
				onContextMenu={onMoreHandler}
			/>
		);
	};

	const load = () => {
		const filters: I.Filter[] = [
			{ relationKey: 'type.uniqueKey', condition: I.FilterCondition.Equal, value: J.Constant.typeKey.template },
			{ relationKey: 'targetObjectType', condition: I.FilterCondition.In, value: rootId },
		];
		const sorts = [
			{ relationKey: 'name', type: I.SortType.Asc },
		];
		const keys = J.Relation.default.concat([ 'targetObjectType' ]);

		U.Subscription.subscribe({
			subId,
			filters,
			sorts,
			keys,
			limit: 2,
			ignoreHidden: true,
			ignoreDeleted: true,
		});
	};

	useEffect(() => {
		load();
	}, []);

	return (
		<div 
			className="wrap"
		>
			<div className="titleWrap">
				<Title text={translate('commonTemplates')} />
				{!readonly ? (
					<Icon 
						id="section-relation-plus" 
						className="plus withBackground" 
						tooltipParam={{ text: translate('commonAddTemplate') }}
						onClick={e => onAdd()} 
					/>
				) : ''}
			</div>

			{items.length ? (
				<div className="items">
					{items.map((item: any, i: number) => (
						<Item key={i} {...item} />
					))}
				</div>
			) : <EmptySearch className="noItems" text={translate('sidebarTemplateEmpty')} />}
		</div>
	);

}));

export default SidebarSectionTypeTemplate;