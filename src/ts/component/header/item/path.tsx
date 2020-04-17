import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Icon, Smile, DropTarget } from 'ts/component';
import { I, C, Util, DataUtil } from 'ts/lib';
import { authStore, commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props {
	dataset?: any;
	rootId: string;
	block: I.Block;
	index: number;
	onPath (e: any, block: I.Block, index: number): void;
	onDrop (e: any, type: string, rootId: string, targetId: string, position: I.BlockPosition): void;
};

@observer
class HeaderItemPath extends React.Component<Props, {}> {

	render () {
		const { rootId, block, index, onPath, onDrop } = this.props;
		const { breadcrumbs } = blockStore;
		const { id, content } = block;
		const details = blockStore.getDetail(breadcrumbs, content.targetBlockId);
		const { icon, name } = details;
		
		let element = null;
		if (false) {
			
		} else {
			element = <Smile icon={icon} />;
		};
		
		return (
			<DropTarget {...this.props} className="item" id={id} rootId={breadcrumbs} dropType={I.DragItem.Menu} onClick={(e: any) => { onPath(e, block, index); }} onDrop={onDrop}>
				{element}
				<div className="name">{Util.shorten(name, 16)}</div>
				<Icon className="arrow" />
			</DropTarget>
		);
	};


 	
};

export default HeaderItemPath;