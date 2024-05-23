import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon, IconObject, Sync, ObjectName } from 'Component';
import { I, UtilObject, UtilData, keyboard, translate } from 'Lib';
import { blockStore, detailStore, popupStore } from 'Store';
import HeaderBanner from 'Component/page/elements/head/banner';
const Constant = require('json/constant.json');

interface State {
	templatesCnt: number;
};

const HeaderMainObject = observer(class HeaderMainObject extends React.Component<I.HeaderComponent, State> {

	state = {
		templatesCnt: 0
	};

	constructor (props: I.HeaderComponent) {
		super(props);
		
		this.onRelation = this.onRelation.bind(this);
		this.onMore = this.onMore.bind(this);
		this.onSync = this.onSync.bind(this);
		this.onOpen = this.onOpen.bind(this);
		this.updateTemplatesCnt = this.updateTemplatesCnt.bind(this);
	};

	render () {
		const { rootId, onSearch, onTooltipShow, onTooltipHide, isPopup, renderLeftIcons } = this.props;
		const { templatesCnt } = this.state;
		const root = blockStore.getLeaf(rootId, rootId);

		if (!root) {
			return null;
		};

		const object = detailStore.get(rootId, rootId, Constant.templateRelationKeys);
		const isLocked = root ? root.isLocked() : false;
		const showMenu = !UtilObject.isTypeOrRelationLayout(object.layout);
		const canSync = showMenu && !object.templateIsBundled && !root.isObjectParticipant();
		const cmd = keyboard.cmdSymbol();
		const allowedTemplateSelect = (object.internalFlags || []).includes(I.ObjectFlag.SelectTemplate);
		const bannerProps: any = {};

		let center = null;
		let banner = I.BannerType.None;

		if (object.isArchived) {
			banner = I.BannerType.IsArchived;
		} else
		if (UtilObject.isTemplate(object.type)) {
			banner = I.BannerType.IsTemplate;
		} else
		if (allowedTemplateSelect && templatesCnt) {
			banner = I.BannerType.TemplateSelect;
			bannerProps.count = templatesCnt + 1;
		};

		if (banner == I.BannerType.None) {
			center = (
				<div
					id="path"
					className="path"
					onClick={onSearch}
					onMouseOver={e => onTooltipShow(e, translate('headerTooltipPath'))}
					onMouseOut={onTooltipHide}
				>
					<div className="inner">
						<IconObject object={object} size={18} />
						<ObjectName object={object} />
						{isLocked ? <Icon className="lock" /> : ''}
					</div>
				</div>
			);
		} else {
			center = <HeaderBanner type={banner} object={object} isPopup={isPopup} {...bannerProps} />;
		};

		return (
			<React.Fragment>
				<div className="side left">
					{renderLeftIcons(this.onOpen)}
					{canSync ? <Sync id="button-header-sync" rootId={rootId} onClick={this.onSync} /> : ''}
				</div>

				<div className="side center">
					{center}
				</div>

				<div className="side right">
					{showMenu ? <Icon id="button-header-relation" tooltip="Relations" tooltipCaption={`${cmd} + Shift + R`} className="relation" onClick={this.onRelation} /> : ''}
					{showMenu ? <Icon id="button-header-more" tooltip="Menu" className="more" onClick={this.onMore} /> : ''}
				</div>
			</React.Fragment>
		);
	};

	componentDidMount () {
		this.init();
	};

	componentDidUpdate () {
		this.init();
	};

	init () {
		keyboard.setWindowTitle();
		this.updateTemplatesCnt();
	};

	onOpen () {
		const { rootId } = this.props;
		const object = detailStore.get(rootId, rootId, []);

		keyboard.disableClose(true);
		popupStore.closeAll(null, () => UtilObject.openRoute(object));
	};
	
	onMore () {
		const { isPopup, match, rootId, menuOpen } = this.props;

		menuOpen('object', '#button-header-more', {
			horizontal: I.MenuDirection.Right,
			subIds: Constant.menuIds.object,
			data: {
				rootId,
				blockId: rootId,
				blockIds: [ rootId ],
				match,
				isPopup,
			}
		});
	};

	onSync () {
		const { rootId, menuOpen } = this.props;

		menuOpen('threadList', '#button-header-sync', {
			horizontal: I.MenuDirection.Left,
			data: {
				rootId,
			}
		});
	};

	onRelation () {
		const { isPopup, rootId, menuOpen } = this.props;
		const cnw = [ 'fixed' ];
		const object = detailStore.get(rootId, rootId, [ 'isArchived' ]);

		if (!isPopup) {
			cnw.push('fromHeader');
		};

		menuOpen('blockRelationView', '#button-header-relation', {
			noFlipX: true,
			noFlipY: true,
			horizontal: I.MenuDirection.Right,
			subIds: Constant.menuIds.cell,
			classNameWrap: cnw.join(' '),
			data: {
				isPopup,
				rootId,
				readonly: object.isArchived
			},
		});
	};

	updateTemplatesCnt () {
		const { rootId } = this.props;
		const { templatesCnt } = this.state;
		const object = detailStore.get(rootId, rootId, [ 'internalFlags' ]);
		const allowedTemplateSelect = (object.internalFlags || []).includes(I.ObjectFlag.SelectTemplate);

		if (!allowedTemplateSelect || !object.type) {
			return;
		};

		UtilData.getTemplatesByTypeId(object.type, (message: any) => {
			if (message.error.code) {
				return;
			};

			if (message.records.length != templatesCnt) {
				this.setState({ templatesCnt: message.records.length });
			};
		});
	};

});

export default HeaderMainObject;
