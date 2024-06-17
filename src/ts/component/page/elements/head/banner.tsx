import * as React from 'react';
import $ from 'jquery';
import { IconObject, Label, ObjectName } from 'Component';
import { I, Action, translate, UtilObject, UtilCommon, C, analytics, Onboarding } from 'Lib';
import { dbStore, menuStore } from 'Store';
const Constant = require('json/constant.json');

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
		const cn = [ 'headerBanner' ];

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

	componentDidMount (): void {
		const { type, isPopup } = this.props;

		if (type == I.BannerType.TemplateSelect) {
			Onboarding.start('templateSelect', isPopup);
		};
	};

	onTemplateMenu () {
		const { object, isPopup } = this.props;
		const { sourceObject } = object;
		const type = dbStore.getTypeById(object.type);
		const templateId = sourceObject || Constant.templateId.blank;
		const node = $(this.node);

		if (!type || menuStore.isOpen('dataviewTemplateList')) {
			return;
		};

		let menuContext = null;

		menuStore.open('dataviewTemplateList', {
			element: node,
			className: 'fromBanner',
			offsetY: isPopup ? 10 : 0,
			subIds: Constant.menuIds.dataviewTemplate.concat([ 'dataviewTemplateContext' ]),
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Center,
			onOpen: (context) => {
				menuContext = context;
				node.addClass('active');
			},
			onClose: () => {
				node.removeClass('active');
			},
			data: {
				fromBanner: true,
				withTypeSelect: false,
				noAdd: true,
				noTitle: true,
				typeId: type.id,
				templateId,
				previewSize: I.PreviewSize.Medium,
				onSetDefault: item => {
					UtilObject.setDefaultTemplateId(type.id, item.id);
				},
				onSelect: (item: any) => {
					C.ObjectApplyTemplate(object.id, item.id);

					analytics.event('SelectTemplate', { route: analytics.route.banner });
					menuContext.close();
				},
			},
		});
	};

};

export default HeaderBanner;