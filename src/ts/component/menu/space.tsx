import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, ObjectName } from 'Component';
import { I, C, UtilData, UtilObject, UtilCommon } from 'Lib';
import { authStore, dbStore, detailStore, blockStore } from 'Store';
import Constant from 'json/constant.json';

const MenuSpace = observer(class MenuSpace extends React.Component<I.Menu> {

	node: any = null;
	n = 0;

	constructor (props: I.Menu) {
		super(props);
		
		this.onClick = this.onClick.bind(this)
	};
	
	render () {
		const items = this.getItems();
		const space = UtilObject.getSpace();

		const Item = (item) => (
			<div className={[ 'item', (item.spaceId == space.spaceId ? 'active' : '') ].join(' ')} onClick={e => this.onClick(e, item)}>
				<div className="iconWrap">
					<IconObject object={item} size={96} />
				</div>
				<ObjectName object={item} />
			</div>
		);

		return (
			<div 
				ref={node => this.node = node}
			>
				<div className="head">
				</div>
				<div className="items">
					{items.map((item) => (
						<Item key={`item-space-${item.id}`} {...item} />
					))}
				</div>
			</div>
		);
	};

	getItems () {
		const subId = Constant.subId.space;
		return dbStore.getRecords(subId, '').map(id => detailStore.get(subId, id, UtilData.spaceRelationKeys()));
	};

	onClick (e: any, item: any) {
		const space = UtilObject.getSpace();
		const { close } = this.props;

		if (space.spaceId == item.spaceId) {
			return;
		};

		C.WalletSetSessionSpaceID(item.spaceId, () => {
			C.WorkspaceInfo((message: any) => {
				UtilCommon.route('/main/empty', { animate: true });

				window.setTimeout(() => {
					blockStore.clear(blockStore.widgets);
				}, Constant.delay.route);

				window.setTimeout(() => {
					UtilData.onAuth(authStore.account, message.info);
				}, Constant.delay.route * 2);
			});
		});

		close();
	};

	resize () {
	};
	
});

export default MenuSpace;