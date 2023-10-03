import * as React from 'react';
import $ from 'jquery';
import { IconObject, Icon, Label, ObjectName } from 'Component';
import { I, Action, translate, UtilObject, UtilCommon, UtilFile, analytics, C, UtilData } from 'Lib';
import { commonStore, dbStore, detailStore, menuStore } from 'Store';
import Constant from 'json/constant.json';

interface Props {
	type: I.BannerType;
	object: any;
	count?: number;
	isPopup?: boolean;
};

interface State {
	menuOpened: boolean;
	currentTypeId: string;
	currentTemplateId: string;
};

const TEMPLATE_WIDTH = 236;
const PADDING = 16;

class HeaderBanner extends React.Component<Props, State> {

	_isMounted = false;
	node: any = null;
	menuContext: any = null;

	state = {
		menuOpened: false,
		currentTypeId: '',
		currentTemplateId: ''
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

	componentDidMount () {
		this._isMounted = true;
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	onTemplateMenu () {
		const { object, count, isPopup } = this.props;
		const { menuOpened, currentTypeId, currentTemplateId } = this.state;
		const type = dbStore.getTypeById(object.type);
		const winSize = UtilCommon.getWindowDimensions();
		const sidebar = $('#sidebar');

		let current = type.defaultTemplateId || Constant.templateId.blank;
		if (currentTemplateId && type.id == currentTypeId) {
			current = currentTemplateId;
		} else {
			this.setState({ currentTypeId: type.id, currentTemplateId: current });
		};

		let sw = 0;
		if (commonStore.isSidebarFixed && sidebar.hasClass('active')) {
			sw = sidebar.outerWidth();
		};

		const areaWidth = winSize.ww - sw;
		const maxRowLength = Math.floor(areaWidth / TEMPLATE_WIDTH);
		const width = Math.min(count, maxRowLength) * TEMPLATE_WIDTH + PADDING * 2;

		if (menuOpened) {
			this.setState({ menuOpened: false });
		} else {
			this.setState({ menuOpened: true });

			menuStore.open('dataviewTemplateList', {
				element: $(this.node),
				className: 'objectCreate',
				offsetY: isPopup ? 10 : 0,
				width,
				subIds: Constant.menuIds.dataviewTemplate.concat([ 'dataviewTemplateContext' ]),
				vertical: I.MenuDirection.Bottom,
				horizontal: I.MenuDirection.Center,
				onOpen: (context: any) => {
					this.menuContext = context;
					this.menuContext.ref.updateRowLength(maxRowLength);
				},
				onClose: () => this.setState({ menuOpened: false }),
				data: {
					withTypeSelect: false,
					noAdd: true,
					noTitle: true,
					typeId: type.id,
					templateId: current,
					selectedTemplate: current,
					previewSize: I.PreviewSize.Medium,
					onSelect: (item: any) => {
						C.ObjectApplyTemplate(object.id, item.id);
						menuStore.updateData('dataviewTemplateList', { selectedTemplate: item.id });
						this.setState({ currentTemplateId: item.id });
					}
				}
			});
		};
	};
};

export default HeaderBanner;
