import * as React from 'react';
import $ from 'jquery';
import { IconObject, Label, ObjectName } from 'Component';
import { I, C, S, U, J, Action, translate, analytics, Onboarding } from 'Lib';

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
				action = (
					<div 
						className="action" 
						onClick={() => Action.restore([ object.id ], analytics.route.banner)}
					>
						{translate('deletedBannerRestore')}
					</div>
				);
				break;
			};

			case I.BannerType.IsTemplate: {
				const targetObjectType = S.Record.getTypeById(object.targetObjectType);

				label = translate('templateBannner');
				if (targetObjectType) {
					target = (
						<div className="typeName" onClick={() => U.Object.openAuto(targetObjectType)}>
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
					label = U.Common.sprintf(translate('selectTemplateBannerWithNumber'), count, U.Common.plural(count, translate('pluralLCTemplate')));
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
		const type = S.Record.getTypeById(object.type);
		const templateId = sourceObject || J.Constant.templateId.blank;
		const node = $(this.node);

		if (!type || S.Menu.isOpen('dataviewTemplateList')) {
			return;
		};

		let menuContext = null;

		S.Menu.open('dataviewTemplateList', {
			element: node,
			className: 'fromBanner',
			offsetY: isPopup ? 10 : 0,
			subIds: J.Menu.dataviewTemplate.concat([ 'dataviewTemplateContext' ]),
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
					U.Object.setDefaultTemplateId(type.id, item.id);
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