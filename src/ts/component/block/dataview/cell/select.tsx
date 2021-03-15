import * as React from 'react';
import { Tag, Icon } from 'ts/component';
import { I, Util, DataUtil } from 'ts/lib';
import { menuStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Cell {};
interface State { 
	editing: boolean; 
};

const $ = require('jquery');

@observer
class CellSelect extends React.Component<Props, State> {

	_isMounted: boolean = false;
	state = {
		editing: false,
	};

	constructor (props: any) {
		super(props);

		this.onClear = this.onClear.bind(this);
	};

	render () {
		const { rootId, block, relation, getRecord, index } = this.props;
		const record = getRecord(index);

		if (!relation || !record) {
			return null;
		};

		const value = this.getValue();
		const canClear = relation.format == I.RelationType.Status;
		const placeHolder = relation.format == I.RelationType.Status ? 'Select status' : 'Select tags';

		return (
			<div className="wrap">
				{value.length ? (
					<React.Fragment>
						{value.map((item: any, i: number) => {
							return <Tag {...item} key={item.id} className={DataUtil.tagClass(relation.format)} />;
						})}
						{canClear ? <Icon className="clear" onClick={this.onClear} /> : ''}
					</React.Fragment>
				) : (
					<div className="empty">{placeHolder}</div>
				)}
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
	};

	componentWillUnmount () {
		this._isMounted = false;
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

		let value = record[relation.relationKey] || [];
		if ('object' != typeof(value)) {
			value = value ? [ value ] : [];
		};
		value = Util.objectCopy(value);
		value = value.map((id: string) => { 
			return (relation.selectDict || []).find((it: any) => { return it.id == id; });
		});
		value = value.filter((it: any) => { return it && it.id; });

		return value;
	};

	onClear (e: any) {
		e.preventDefault();
		e.stopPropagation();

		const { onChange } = this.props;
		
		this.setEditing(false);

		if (onChange) {
			onChange([]);
		};
	};

};

export default CellSelect;