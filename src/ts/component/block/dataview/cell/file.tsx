import * as React from 'react';
import { IconObject } from 'ts/component';
import { I, DataUtil, Util } from 'ts/lib';
import { observer } from 'mobx-react';
import { detailStore } from 'ts/store';

interface Props extends I.Cell {};
interface State { 
	editing: boolean; 
};

const $ = require('jquery');

@observer
class CellFile extends React.Component<Props, State> {

	state = {
		editing: false,
	};

	constructor (props: any) {
		super(props);

		this.onClick = this.onClick.bind(this);
	};

	render () {
		const { rootId, block, readOnly, index, getRecord, canEdit, iconSize } = this.props;
		const record = getRecord(index);
		if (!record) {
			return null;
		};

		let value = this.getValue();
		value = value.map((it: string) => { return detailStore.get(rootId, it, [ 'fileExt' ]); });
		value = value.filter((it: any) => { return !it._objectEmpty_; });

		if (!value.length) {
			return <div className="empty">Add a file</div>;
		};

		const Item = (item: any) => (
			<div className="element" onClick={(e: any) => { this.onClick(e, item); }}>
				<div className="flex">
					<IconObject object={item} size={iconSize} />
					<div className="name">{item.name + (item.fileExt ? `.${item.fileExt}` : '')}</div>
				</div>
			</div>
		);

		return (
			<div className="wrap">
				{value.map((item: any, i: number) => (
					<Item key={i} {...item} />
				))}
			</div>
		);
	};

	componentDidUpdate () {
		const { editing } = this.state;
		const { id } = this.props;
		const cell = $('#' + id);

		if (editing) {
			cell.addClass('isEditing');
		} else {
			cell.removeClass('isEditing');
		};
	};

	setEditing (v: boolean) {
		const { canEdit } = this.props;
		const { editing } = this.state;

		if (canEdit && (v != editing)) {
			this.setState({ editing: v });
		};
	};

	getValue () {
		const { relation, index, getRecord } = this.props;
		const record = getRecord(index);

		let value = record[relation.relationKey];
		if (!value || ('object' != typeof(value))) {
			value = [];
		};
		return Util.objectCopy(value);
	};

	onClick (e: any, item: any) {
		const { canOpen, canEdit } = this.props;

		if (canOpen && !canEdit) {
			e.stopPropagation();
			DataUtil.objectOpenPopup(item);
		};
	};

};

export default CellFile;