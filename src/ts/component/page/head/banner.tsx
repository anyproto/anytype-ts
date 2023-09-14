import * as React from 'react';
import $ from 'jquery';
import { IconObject, Icon, Label, ObjectName } from 'Component';
import { I, Action, translate, UtilObject, UtilCommon, UtilFile, analytics, C, UtilData } from 'Lib';
import { dbStore, detailStore, menuStore } from 'Store';
import Constant from 'json/constant.json';

interface Props {
	type: I.BannerType;
	object: any;
	count?: number;
};

interface State {
	menuOpened: boolean;
};

class HeaderBanner extends React.Component<Props, State> {

	_isMounted = false;
	node: any = null;

	state = {
		menuOpened: false
	};

	constructor (props: Props) {
		super(props);

		this.onTemplateMenu = this.onTemplateMenu.bind(this);
	};

	render () {
		const { type, object, count } = this.props;
		const { menuOpened } = this.state;
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

				label = translate('selectTemplateBanner');
				if (count) {
					label = UtilCommon.sprintf(translate('selectTemplateBannerWithNumber'), count, UtilCommon.plural(count, translate('pluralTemplate')));
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

	componentDidMount () {
		this._isMounted = true;
	};

	componentDidUpdate () {
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	onTemplateMenu () {
		const { object } = this.props;
		const { menuOpened } = this.state;
		const type = dbStore.getTypeById(object.type);

		if (menuOpened) {
			this.setState({ menuOpened: false });
		} else {
			this.setState({ menuOpened: true });

			menuStore.open('dataviewTemplateList', {
				element: $(this.node),
				offsetY: 10,
				noAnimation: true,
				subIds: Constant.menuIds.dataviewTemplate.concat([ 'dataviewTemplateContext' ]),
				vertical: I.MenuDirection.Bottom,
				horizontal: I.MenuDirection.Center,
				onClose: () => this.setState({ menuOpened: false }),
				data: {
					withTypeSelect: false,
					noAdd: true,
					typeId: type.id,
					templateId: type.defaultTemplateId || Constant.templateId.blank,
					onSelect: (item: any) => {
						C.ObjectApplyTemplate(object.id, item.id);
						menuStore.close('dataviewTemplateList');
					}
				}
			});
		};
	};
};

export default HeaderBanner;
