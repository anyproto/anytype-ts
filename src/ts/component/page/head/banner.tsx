import * as React from 'react';
import $ from 'jquery';
import { IconObject, Label, ObjectName } from 'Component';
import { I, Action, translate, UtilObject, UtilCommon, C } from 'Lib';
import { commonStore, dbStore, menuStore } from 'Store';
import Constant from 'json/constant.json';

interface Props {
	type: I.BannerType;
	object: any;
	count?: number;
	isPopup?: boolean;
};

class HeaderBanner extends React.Component<Props> {

	node: any = null;

	constructor (props: Props) {
		super(props);

		this.onTemplateMenu = this.onTemplateMenu.bind(this);
	};

	render () {
		const { type, object, count } = this.props;
		const menuOpened = menuStore.isOpen('dataviewTemplateList');
		const cn = [ 'headerBanner', menuOpened ? 'menuOpened' : '' ];

		let label = '';
		let target = null;
		let action = null;
		let onClick = null;

		switch (type) {
			case I.BannerType.IsArchived: {
				label = translate('deletedBanner');
				action = <div className="action" onClick={e => Action.restore([ object.id ])}>{translate('deletedBannerRestore')}</div>;
				break;
			};

			case I.BannerType.IsTemplate: {
				const targetObjectType = dbStore.getTypeById(object.targetObjectType);

				label = translate('templateBannner');
				if (targetObjectType) {
					target = (
						<div className="typeName" onClick={() => UtilObject.openAuto(targetObjectType)}>
							{translate('commonOf')}
							<IconObject size={18} object={targetObjectType} />
							<ObjectName object={targetObjectType} />
						</div>
					);
				};
				break;
			};

			case I.BannerType.TemplateSelect: {
				cn.push('withMenu');

				if (count) {
					label = UtilCommon.sprintf(translate('selectTemplateBannerWithNumber'), count, UtilCommon.plural(count, translate('pluralTemplate')));
				} else {
					label = translate('selectTemplateBanner');
				};

				onClick = this.onTemplateMenu;
				break;
			};
		};

		return (
			<div
				ref={node => this.node = node}
				id="headerBanner"
				className={cn.join(' ')}
				onClick={onClick}
			>
				<div className="content">
					<Label text={label} />
					{target}
				</div>

				{action}
			</div>
		);
	};

	onTemplateMenu () {
		const { object, isPopup } = this.props;
		const { sourceObject } = object;
		const menuOpened = menuStore.isOpen('dataviewTemplateList');
		const type = dbStore.getTypeById(object.type);
		const templateId = sourceObject || Constant.templateId.blank;

		if (!menuOpened) {
			menuStore.open('dataviewTemplateList', {
				element: $(this.node),
				className: 'fromBanner',
				offsetY: isPopup ? 10 : 0,
				subIds: Constant.menuIds.dataviewTemplate.concat([ 'dataviewTemplateContext' ]),
				vertical: I.MenuDirection.Bottom,
				horizontal: I.MenuDirection.Center,
				data: {
					fromBanner: true,
					withTypeSelect: false,
					noAdd: true,
					noTitle: true,
					typeId: type.id,
					templateId,
					previewSize: I.PreviewSize.Medium,
					onSelect: (item: any) => {
						C.ObjectApplyTemplate(object.id, item.id);
					}
				}
			});
		};
	};
};

export default HeaderBanner;
