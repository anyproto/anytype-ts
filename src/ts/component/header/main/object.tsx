import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon, IconObject, Sync, ObjectName } from 'Component';
import { I, DataUtil, ObjectUtil, keyboard, sidebar } from 'Lib';
import { blockStore, detailStore, popupStore } from 'Store';
import Constant from 'json/constant.json';

const HeaderMainObject = observer(class HeaderMainObject extends React.Component<I.HeaderComponent> {

	constructor (props: I.HeaderComponent) {
		super(props);
		
		this.onMore = this.onMore.bind(this);
		this.onSync = this.onSync.bind(this);
		this.onOpen = this.onOpen.bind(this);
	};

	render () {
		const { rootId, onForward, onBack, onGraph, onSearch, onTooltipShow, onTooltipHide } = this.props;
		const root = blockStore.getLeaf(rootId, rootId);
		const object = detailStore.get(rootId, rootId, [ 'templateIsBundled' ]);
		const isLocked = root ? root.isLocked() : false;
		const showGraph = !ObjectUtil.isSystemType(object.type);
		const showMenu = !ObjectUtil.isStoreType(object.type);
		const canSync = showMenu && !object.templateIsBundled;

		return (
			<React.Fragment>
				<div className="side left">
					<Icon className="expand big" tooltip="Open as object" onClick={this.onOpen} />
					<Icon className="toggleSidebar big" tooltip="Sidebar" onClick={() => sidebar.expand()} />
					<Icon className={[ 'back', 'big', (!keyboard.checkBack() ? 'disabled' : '') ].join(' ')} tooltip="Back" onClick={onBack} />
					<Icon className={[ 'forward', 'big', (!keyboard.checkForward() ? 'disabled' : '') ].join(' ')} tooltip="Forward" onClick={onForward} />
					
					{showGraph ? <Icon className="graph big" tooltip="Open as graph" onClick={onGraph} /> : ''}
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
					{canSync ? <Sync id="button-header-sync" rootId={rootId} onClick={this.onSync} /> : ''}
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
		popupStore.closeAll(null, () => { ObjectUtil.openRoute(object); });
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
			horizontal: I.MenuDirection.Right,
			data: {
				rootId,
			}
		});
	};

	setTitle () {
		const { rootId, isPopup } = this.props;

		if (!isPopup) {
			DataUtil.setWindowTitle(rootId, rootId);
		};
	};
	
});

export default HeaderMainObject;