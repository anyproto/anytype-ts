import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon, IconObject, Sync, ObjectName, Label } from 'Component';
import { I, S, U, J, keyboard, translate, sidebar } from 'Lib';
import HeaderBanner from 'Component/page/elements/head/banner';

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
		const root = S.Block.getLeaf(rootId, rootId);

		if (!root) {
			return null;
		};

		const object = S.Detail.get(rootId, rootId, J.Relation.template);
		const isLocked = root ? root.isLocked() : false;
		const isTypeOrRelation = U.Object.isTypeOrRelationLayout(object.layout);
		const isDate = U.Object.isDateLayout(object.layout);
		const showRelations = !isTypeOrRelation && !isDate;
		const showMenu = true; //!isTypeOrRelation;
		const canSync = showMenu && !object.templateIsBundled && !U.Object.isParticipantLayout(object.layout);
		const cmd = keyboard.cmdSymbol();
		const allowedTemplateSelect = (object.internalFlags || []).includes(I.ObjectFlag.SelectTemplate);
		const bannerProps: any = {};

		let center = null;
		let banner = I.BannerType.None;
		let locked = '';

		if (object.isArchived && U.Space.canMyParticipantWrite()) {
			banner = I.BannerType.IsArchived;
		} else
		if (U.Object.isTemplate(object.type)) {
			banner = I.BannerType.IsTemplate;
		} else
		if (allowedTemplateSelect && templatesCnt) {
			banner = I.BannerType.TemplateSelect;
			bannerProps.count = templatesCnt + 1;
		};

		if (isLocked) {
			locked = translate('headerObjectLocked');
		} else
		if (U.Object.isTypeOrRelationLayout(object.layout) && !S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Delete ])) {
			locked = translate('commonSystem');
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
						{locked ? <Label text={locked} className="lock" /> : ''}
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
					{canSync ? <Sync id="button-header-sync" onClick={this.onSync} /> : ''}
				</div>

				<div className="side center">
					{center}
				</div>

				<div className="side right">
					{showRelations ? <Icon id="button-header-relation" tooltip="Relations" tooltipCaption={`${cmd} + Shift + R`} className="relation withBackground" onClick={this.onRelation} /> : ''}
					{showMenu ? <Icon id="button-header-more" tooltip="Menu" className="more withBackground" onClick={this.onMore} /> : ''}
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
		this.updateTemplatesCnt();
	};

	onOpen () {
		const { rootId } = this.props;
		const object = S.Detail.get(rootId, rootId, []);

		keyboard.disableClose(true);
		S.Popup.closeAll(null, () => U.Object.openRoute(object));
	};
	
	onMore () {
		const { isPopup, match, rootId, menuOpen } = this.props;

		menuOpen('object', '#button-header-more', {
			horizontal: I.MenuDirection.Right,
			subIds: J.Menu.object,
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

		menuOpen('syncStatus', '#button-header-sync', {
			subIds: [ 'syncStatusInfo' ],
			data: {
				rootId,
			}
		});
	};

	onRelation () {
		const { rootId } = this.props;
		const object = S.Detail.get(rootId, rootId, [ 'isArchived' ]);

		sidebar.rightPanelToggle(!S.Common.showSidebarRight, 'object/relation', { rootId });

		//this.props.onRelation({}, { readonly: object.isArchived });
	};

	updateTemplatesCnt () {
		const { rootId } = this.props;
		const { templatesCnt } = this.state;
		const object = S.Detail.get(rootId, rootId, [ 'internalFlags' ]);
		const allowedTemplateSelect = (object.internalFlags || []).includes(I.ObjectFlag.SelectTemplate);

		if (!allowedTemplateSelect || !object.type) {
			return;
		};

		U.Data.getTemplatesByTypeId(object.type, (message: any) => {
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
