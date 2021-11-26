import * as React from 'react';
import { detailStore, dbStore } from 'ts/store';
import { I } from 'ts/lib';
import { observer } from 'mobx-react';
import { IconObject, ObjectName } from 'ts/component';

interface Props {
	rootId: string;
	block: I.Block;
	id: string;
	iconSize: number;
	relation?: any;
	elementMapper?: (relation: any, item: any) => any;
	onClick?: (e: any, item: any) => void;
}

const ItemObject = observer(class ItemObject extends React.Component<Props, {}> {

	render () {
		const { rootId, block, id, iconSize, relation, elementMapper, onClick } = this.props;
		const subId = dbStore.getSubId(rootId, block.id);
		
		let object = detailStore.get(subId, id, []);
		if (object._empty_) {
			return null;
		};

		if (elementMapper) {
			object = elementMapper(relation, object);
		};

		return (
			<div 
				className={[ 'element', (object.isHidden ? 'isHidden' : '') ].join(' ')} 
				onClick={(e: any) => { onClick(e, object); }}
			>
				<div className="flex">
					<IconObject object={object} size={iconSize} />
					<ObjectName object={object} />
				</div>
			</div>
		);
	};

});

export default ItemObject;