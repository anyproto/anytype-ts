import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, ObjectName, Icon } from 'Component';
import { I, UtilObject } from 'Lib';
import { blockStore } from 'Store';

interface Props {
	cellId: string;
	iconSize: number;
	relation?: any;
	canEdit?: boolean;
	getObject: () => any;
	elementMapper?: (relation: any, item: any) => any;
	onClick?: (e: any, item: any) => void;
	onRemove?: (e: any, id: string) => void;
};

const ItemObject = observer(class ItemObject extends React.Component<Props> {

	constructor (props: Props) {
		super(props);

		this.onClick = this.onClick.bind(this);
		this.onRemove = this.onRemove.bind(this);
		this.onSelect = this.onSelect.bind(this);
		this.onUpload = this.onUpload.bind(this);
		this.onCheckbox = this.onCheckbox.bind(this);
	};

	render () {
		const { cellId, iconSize, relation, canEdit } = this.props;
		const cn = [ 'element' ];
		const object = this.getObject();
		const { done, isReadonly, isArchived } = object;
		const allowedDetails = blockStore.isAllowed(object.restrictions, [ I.RestrictionObject.Details ]);

		let iconObject = null;
		let iconRemove = null;
		
		if (object.isHidden) {
			cn.push('isHidden');
		};
		if (canEdit) {
			cn.push('canEdit');
			iconRemove = <Icon className="objectRemove" onClick={this.onRemove} />;
		};
		if (relation.relationKey != 'type') {
			iconObject = (
				<IconObject 
					id={`${cellId}-icon`}
					object={object} 
					size={iconSize} 
					canEdit={!isReadonly && !isArchived && allowedDetails} 
					onSelect={this.onSelect} 
					onUpload={this.onUpload} 
					onCheckbox={this.onCheckbox} 
				/>
			);
		};

		return (
			<div className={cn.join(' ')}>
				<div className="flex">
					{iconObject}
					<ObjectName object={object} onClick={this.onClick} />
					{iconRemove}
				</div>
			</div>
		);
	};

	onClick (e: any) {
		const { onClick, canEdit } = this.props;
		const object = this.getObject();

		if (onClick) {
			onClick(e, object);
		};
	};

	onSelect (icon: string) {
		const object = this.getObject();

		UtilObject.setIcon(object.id, icon, '');
	};

	onUpload (objectId: string) {
		const object = this.getObject();

		UtilObject.setIcon(object.id, '', objectId);
	};

	onCheckbox () {
		const object = this.getObject();

		UtilObject.setDone(object.id, !object.done);
	};

	onRemove (e: any) {
		e.stopPropagation();

		const { canEdit, onRemove } = this.props;
		const object = this.getObject();

		if (canEdit && onRemove) {
			onRemove(e, object.id);
		};
	};

	getObject () {
		const { relation, elementMapper, getObject } = this.props;

		let object = getObject();
		if (elementMapper) {
			object = elementMapper(relation, object);
		};
		return object;
	};

});

export default ItemObject;