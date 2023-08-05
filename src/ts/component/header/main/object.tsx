import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon, IconObject, Sync, ObjectName, Label } from 'Component';
import { I, UtilData, UtilObject, keyboard, sidebar, translate } from 'Lib';
import { blockStore, detailStore, popupStore, dbStore } from 'Store';
import Constant from 'json/constant.json';

const HeaderMainObject = observer(class HeaderMainObject extends React.Component<I.HeaderComponent> {

	constructor (props: I.HeaderComponent) {
		super(props);
		
		this.onRelation = this.onRelation.bind(this);
		this.onMore = this.onMore.bind(this);
		this.onSync = this.onSync.bind(this);
		this.onOpen = this.onOpen.bind(this);
	};

	render () {
		const { rootId, onSearch, onTooltipShow, onTooltipHide } = this.props;
		const root = blockStore.getLeaf(rootId, rootId);
		const object = detailStore.get(rootId, rootId, [ 'templateIsBundled', 'type', 'targetObjectType' ]);
		const isLocked = root ? root.isLocked() : false;
		const showMenu = !UtilObject.isStoreType(object.type);
		const canSync = showMenu && !object.templateIsBundled;
		const cmd = keyboard.cmdSymbol();

		let center = null;

		if (UtilObject.isTemplate(object.type)) {
			const type = dbStore.getType(object.targetObjectType);
			center = (
				<div className="templateBanner">
					<Label text={translate('templateBannner')} />
					{type ? (
						<div className="typeName" onClick={() => UtilObject.openAuto(type)}>
							{translate('commonOf')}
							<IconObject size={18} object={type} />
							<ObjectName object={type} />
						</div>
					) : ''}
				</div>
			);
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
					<Icon id="button-header-relation" tooltip="Relations" className="relation big" onClick={this.onRelation} />
					{showMenu ? <Icon id="button-header-more" tooltip="Menu" className="more big" onClick={this.onMore} /> : ''}
				</div>
			</React.Fragment>
		);
	};

	componentDidMount () {
		this.setTitle();
	};

	componentDidUpdate () {
		this.setTitle();
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
			},
		});
	};

	setTitle () {
		const { rootId } = this.props;

		UtilData.setWindowTitle(rootId, rootId);
	};
	
});

export default HeaderMainObject;