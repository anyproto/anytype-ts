import React, { FC, useEffect, useRef } from 'react';
import $ from 'jquery';
import { IconObject, Label, ObjectName } from 'Component';
import { I, C, S, U, J, Action, translate, analytics, Onboarding } from 'Lib';

interface Props {
	type: I.BannerType;
	object: any;
	count?: number;
	isPopup?: boolean;
};

const HeaderBanner: FC<Props> = ({ 
	type, 
	object, 
	count = 0, 
	isPopup,
}) => {

	const nodeRef = useRef(null);
	const cn = [ 'headerBanner' ];
	const canWrite = U.Space.canMyParticipantWrite();

	const onTemplateMenu = () => {
		const { sourceObject } = object;
		const type = S.Record.getTypeById(object.type);
		const node = $(nodeRef.current);

		if (!type || S.Menu.isOpen('dataviewTemplateList')) {
			return;
		};

		let menuContext = null;

		S.Menu.open('dataviewTemplateList', {
			element: node,
			className: 'fromBanner',
			offsetY: isPopup ? 10 : 0,
			subIds: J.Menu.dataviewTemplate.concat([ 'dataviewTemplateContext' ]),
			horizontal: I.MenuDirection.Center,
			onOpen: (context) => {
				menuContext = context;
				node.addClass('active');
			},
			onClose: () => node.removeClass('active'),
			data: {
				fromBanner: true,
				withTypeSelect: false,
				noAdd: true,
				noTitle: true,
				typeId: type.id,
				activeId: sourceObject,
				templateId: type.defaultTemplateId,
				previewSize: I.PreviewSize.Medium,
				onSetDefault: id => {
					S.Menu.updateData('dataviewTemplateList', { templateId: id });
					U.Object.setDefaultTemplateId(type.id, id);
				},
				onSelect: item => {
					C.ObjectApplyTemplate(object.id, item.id);

					analytics.event('SelectTemplate', { route: analytics.route.banner });
					menuContext.close();
				},
			},
		});

		analytics.event('ScreenTemplateSelector');
	};

	let label = '';
	let target = null;
	let action = null;
	let onClick = null;

	switch (type) {
		case I.BannerType.IsArchived: {
			label = translate('deletedBanner');
			if (canWrite) {
				action = (
					<div 
						className="action" 
						onClick={() => Action.restore([ object.id ], analytics.route.banner)}
					>
						{translate('deletedBannerRestore')}
					</div>
				);
			};
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

			onClick = onTemplateMenu;
			break;
		};
	};

	useEffect(() => {
		if (type == I.BannerType.TemplateSelect) {
			Onboarding.start('templateSelect', isPopup);
		};
	}, []);

	return (
		<div
			ref={nodeRef}
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

export default HeaderBanner;