import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, Util } from 'ts/lib';
import { commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';
import { IconObject } from 'ts/component';

interface Props extends I.Cell {};
interface State { 
	editing: boolean; 
};

const $ = require('jquery');

@observer
class CellObject extends React.Component<Props, State> {

	_isMounted: boolean = false;
	state = {
		editing: false,
	};

	constructor (props: any) {
		super(props);
	
	};

	render () {
		const { config } = commonStore;
		const { rootId, block, readOnly, getRecord, index, canEdit, relation } = this.props;
		const record = getRecord(index);

		if (!relation || !record) {
			return null;
		};

		let value = this.getValue();
		value = value.map((it: string) => { return blockStore.getDetails(rootId, it); });
		value = value.filter((it: any) => { return !it._objectEmpty_; });

		if (!config.debug.ho) {
			value = value.filter((it: any) => { return !it.isHidden; });
		};

		const Item = (item: any) => {
			return (
				<div className={[ 'element', (item.isHidden ? 'isHidden' : '') ].join(' ')}>
					<div className="flex">
						<IconObject object={item} />
						<div className="name">{item.name}</div>
					</div>
				</div>
			);
		};

		return (
			<div className="wrap">
				{value.length ? (
					<React.Fragment>
						{value.map((item: any, i: number) => {
							return <Item key={i} {...item} />;
						})}
					</React.Fragment>
				) : (
					<div className="empty">Select objects</div>
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

	onChange (value: string[]) {
		const node = $(ReactDOM.findDOMNode(this));
		const filter = node.find('#filter');

		filter.text('');
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
		return Util.objectCopy(value);
	};

};

export default CellObject;