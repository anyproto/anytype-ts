import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Icon, Smile, DropTarget } from 'ts/component';
import { I, C, Util, DataUtil } from 'ts/lib';
import { authStore, commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props {
	rootId: string;
	block: I.Block;
	index: number;
	onPath (e: any, block: I.Block, index: number): void;
	onDrop (e: any, type: string, targetId: string, position: I.BlockPosition): void;
};

@observer
class HeaderItemPath extends React.Component<Props, {}> {

	render () {
		const { rootId, block, index, onPath, onDrop } = this.props;
		const { id, content } = block;
		const { fields } = content || {};
		const { icon, name } = fields;
		
		return (
			<DropTarget className="item" id={id} rootId={rootId} dropType={I.DragItem.Menu} onClick={(e: any) => { onPath(e, block, index); }} onDrop={onDrop}>
				<Smile icon={icon} />
				<div className="name">{name}</div>
				<Icon className="arrow" />
			</DropTarget>
		);
	};
	
};

export default HeaderItemPath;