import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, ObjectName, Icon } from 'ts/component';

interface Props {
	object: any;
	iconSize: number;
	relation?: any;
	canEdit?: boolean;
	elementMapper?: (relation: any, item: any) => any;
	onClick?: (e: any, item: any) => void;
	onRemove?: (e: any, id: string) => void;
};

const ItemObject = observer(class ItemObject extends React.Component<Props, {}> {

	render () {
		let { object, iconSize, relation, elementMapper, onClick, canEdit, onRemove } = this.props;
		let cn = [ 'element' ];
		let icon = null;
		
		if (elementMapper) {
			object = elementMapper(relation, object);
		};
		if (object.isHidden) {
			cn.push('isHidden');
		};
		if (canEdit) {
			cn.push('canEdit');
			icon = <Icon className="objectRemove" onClick={(e: any) => { onRemove(e, object.id); }} />;
		};

		return (
			<div 
				className={cn.join(' ')} 
				onClick={(e: any) => { onClick(e, object); }}
			>
				<div className="flex">
					<IconObject object={object} size={iconSize} />
					<ObjectName object={object} />
					{icon}
				</div>
			</div>
		);
	};

});

export default ItemObject;