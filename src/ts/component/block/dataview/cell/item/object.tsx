import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, ObjectName, Icon } from 'Component';

interface Props {
	object: any;
	iconSize: number;
	relation?: any;
	canEdit?: boolean;
	elementMapper?: (relation: any, item: any) => any;
	onClick?: (e: any, item: any) => void;
	onRemove?: (e: any, id: string) => void;
};

const ItemObject = observer(class ItemObject extends React.Component<Props> {

	constructor (props: Props) {
		super(props);

		this.onClick = this.onClick.bind(this);
		this.onRemove = this.onRemove.bind(this);
	};

	render () {
		let { object, iconSize, relation, elementMapper, canEdit } = this.props;
		let cn = [ 'element' ];
		let iconObject = null;
		let iconRemove = null;
		
		if (elementMapper) {
			object = elementMapper(relation, object);
		};
		if (object.isHidden) {
			cn.push('isHidden');
		};
		if (canEdit) {
			cn.push('canEdit');
			iconRemove = <Icon className="objectRemove" onClick={this.onRemove} />;
		};
		if (relation.relationKey != 'type') {
			iconObject = <IconObject object={object} size={iconSize} />;
		};

		return (
			<div className={cn.join(' ')} onClick={this.onClick}>
				<div className="flex">
					{iconObject}
					<ObjectName object={object} />
					{iconRemove}
				</div>
			</div>
		);
	};

	onClick (e: any) {
		let { object, relation, elementMapper, onClick, canEdit } = this.props;

		if (elementMapper) {
			object = elementMapper(relation, object);
		};

		if (!canEdit && onClick) {
			onClick(e, object);
		};
	};

	onRemove (e: any) {
		e.stopPropagation();

		const { object, canEdit, onRemove } = this.props;

		if (canEdit && onRemove) {
			onRemove(e, object.id);
		};
	};

});

export default ItemObject;