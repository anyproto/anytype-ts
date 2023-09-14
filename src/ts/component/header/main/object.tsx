import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon, IconObject, Sync, ObjectName, Label } from 'Component';
import { I, UtilObject, UtilData, keyboard, sidebar, translate, Action } from 'Lib';
import { blockStore, detailStore, popupStore, dbStore } from 'Store';
import HeaderBanner from 'Component/page/head/banner';
import Constant from 'json/constant.json';

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
		const { rootId, onSearch, onTooltipShow, onTooltipHide } = this.props;
		const { templatesCnt } = this.state;
		const root = blockStore.getLeaf(rootId, rootId);
		const object = detailStore.get(rootId, rootId, [ 'templateIsBundled', 'type', 'targetObjectType', 'internalFlags' ]);
		const isLocked = root ? root.isLocked() : false;
		const showMenu = !UtilObject.isTypeOrRelationLayout(object.layout);
		const canSync = showMenu && !object.templateIsBundled;
		const cmd = keyboard.cmdSymbol();
		const allowedTemplateSelect = (object.internalFlags || []).includes(I.ObjectFlag.SelectTemplate);

		let center = null;

		if (object.isArchived) {
			center = <HeaderBanner type={I.BannerType.IsArchived} object={object} />;
		} else
		if (UtilObject.isTemplate(object.type)) {
			center = <HeaderBanner type={I.BannerType.IsTemplate} object={object} />;
		} else
		if (allowedTemplateSelect && templatesCnt) {
			center = <HeaderBanner type={I.BannerType.TemplateSelect} object={object} count={templatesCnt} />;
		} else {
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
		};

		return (
			<React.Fragment>
				<div className="side left">
					<Icon
						className="toggle big"
						tooltip={translate('sidebarToggle')}
						tooltipCaption={`${cmd} + \\, ${cmd} + .`}
						tooltipY={I.MenuDirection.Bottom}
						onClick={() => sidebar.toggleExpandCollapse()}
					/>
					<Icon className="expand big" tooltip={translate('commonOpenObject')} onClick={this.onOpen} />
					{canSync ? <Sync id="button-header-sync" rootId={rootId} onClick={this.onSync} /> : ''}
				</div>

				<div className="side center">
					{center}
				</div>

				<div className="side right">
					{showMenu ? <Icon id="button-header-relation" tooltip="Relations" className="relation big" onClick={this.onRelation} /> : ''}
					{showMenu ? <Icon id="button-header-more" tooltip="Menu" className="more big" onClick={this.onMore} /> : ''}
				</div>
			</React.Fragment>
		);
	};

	componentDidMount () {
		keyboard.setWindowTitle();
		this.updateTemplatesCnt();
	};

	componentDidUpdate () {
		keyboard.setWindowTitle();
		this.updateTemplatesCnt();
	};

	onOpen () {
		const { rootId } = this.props;
		const object = detailStore.get(rootId, rootId, []);

		keyboard.disableClose(true);
		popupStore.closeAll(null, () => { UtilObject.openRoute(object); });
	};
	
	onMore () {
		const { isPopup, match, rootId, menuOpen } = this.props;

		menuOpen('blockMore', '#button-header-more', {
			horizontal: I.MenuDirection.Right,
			subIds: Constant.menuIds.more,
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

		if (!allowedTemplateSelect) {
			return;
		};

		if (object.type) {
			UtilData.getTemplatesByTypeId(object.type, (message: any) => {
				if (message.error.code) {
					return;
				};

				if (message.records.length != templatesCnt) {
					this.setState({ templatesCnt: message.records.length });
				};
			});
		};
	};
});

export default HeaderMainObject;
