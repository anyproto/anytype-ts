import * as React from 'react';
import { I, Util, DataUtil, translate } from 'ts/lib';
import { observer } from 'mobx-react';

import ItemObject from './item/object';

interface Props extends I.Cell {}
interface State { 
	isEditing: boolean; 
}

const $ = require('jquery');

const CellObject = observer(class CellObject extends React.Component<Props, State> {

	state = {
		isEditing: false,
	};

	constructor (props: any) {
		super(props);
	
		this.onClick = this.onClick.bind(this);
	};

	render () {
		const { rootId, getRecord, index, relation, iconSize, placeholder, elementMapper } = this.props;
		const record = getRecord(index);

		if (!relation || !record) {
			return null;
		};

		const value = this.getValue();

		return (
			<div className="wrap">
				{value.length ? (
					<React.Fragment>
						{value.map((id: string) => (
							<ItemObject key={id} rootId={rootId} id={id} iconSize={iconSize} onClick={this.onClick} relation={relation} elementMapper={elementMapper} />
						))}
					</React.Fragment>
				) : (
					<div className="empty">{placeholder || translate(`placeholderCell${relation.format}`)}</div>
				)}
			</div>
		);
	};

	componentDidUpdate () {
		const { isEditing } = this.state;
		const { id } = this.props;
		const cell = $('#' + id);

		if (isEditing) {
			cell.addClass('isEditing');
		} else {
			cell.removeClass('isEditing');
		};
	};

	setEditing (v: boolean) {
		const { canEdit } = this.props;
		const { isEditing } = this.state;

		if (canEdit && (v != isEditing)) {
			this.setState({ isEditing: v });
		};
	};

	onClick (e: any, item: any) {
		const { canEdit, canOpen } = this.props;

		if (canOpen && !canEdit) {
			e.stopPropagation();
			DataUtil.objectOpenPopup(item);
		};
	};

	onSort (value: any[]) {
		const { onChange } = this.props;
		onChange(value.map((it: any) => { return it.id; }));
	};

	getValue () {
		const { relation, index, getRecord } = this.props;
		const record = getRecord(index);

		let value = record[relation.relationKey] || [];
		if ('object' != typeof(value)) {
			value = value ? [ value ] : [];
		};
		return Util.objectCopy(Util.arrayUnique(value));
	};

});

export default CellObject;