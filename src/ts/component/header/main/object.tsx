import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon, IconObject, Sync, ObjectName } from 'Component';
import { I, UtilData, UtilObject, keyboard, sidebar } from 'Lib';
import { blockStore, detailStore, popupStore, menuStore } from 'Store';
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
		const object = detailStore.get(rootId, rootId, [ 'templateIsBundled' ]);
		const isLocked = root ? root.isLocked() : false;
		const showMenu = !UtilObject.isStoreType(object.type);
		const canSync = showMenu && !object.templateIsBundled;
		const cmd = keyboard.cmdSymbol();

		return (
			<React.Fragment>
				<div className="side left">
					<Icon
						className="toggle big"
						tooltip="Toggle sidebar fixed mode"
						tooltipCaption={`${cmd} + \\, ${cmd} + .`}
						tooltipY={I.MenuDirection.Bottom}
						onClick={() => sidebar.toggleExpandCollapse()}
					/>
					<Icon className="expand big" tooltip="Open as object" onClick={this.onOpen} />
					{canSync ? <Sync id="button-header-sync" rootId={rootId} onClick={this.onSync} /> : ''}
				</div>

				<div className="side center">
					<div 
						id="path" 
						className="path" 
						onClick={onSearch} 
						onMouseOver={e => onTooltipShow(e, 'Click to search')} 
						onMouseOut={onTooltipHide}
					>	
						<div className="inner">
							<IconObject object={object} size={18} />
							<ObjectName object={object} />
							{isLocked ? <Icon className="lock" /> : ''}
						</div>
					</div>
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
		const { isPopup, rootId } = this.props;
		const cnw = [ 'fixed' ];
		const root = blockStore.getLeaf(rootId, rootId);
		const isLocked = root ? root.isLocked() : false;

		if (!isPopup) {
			cnw.push('fromHeader');
		};

		const param: any = {
			element: '#button-header-relation',
			noFlipX: true,
			noFlipY: true,
			horizontal: I.MenuDirection.Right,
			subIds: Constant.menuIds.cell,
			classNameWrap: cnw.join(' '),
			data: {
				isPopup,
				rootId,
				readonly: isLocked,
			},
		};

		menuStore.closeAll(null, () => { menuStore.open('blockRelationView', param); });
	};

	setTitle () {
		const { rootId, isPopup } = this.props;

		if (!isPopup) {
			UtilData.setWindowTitle(rootId, rootId);
		};
	};
	
});

export default HeaderMainObject;