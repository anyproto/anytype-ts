import * as React from 'react';
import { Icon } from 'Component';
import { I } from 'Lib';
import { observer } from 'mobx-react';

const CellCheckbox = observer(class CellCheckbox extends React.Component<I.Cell> {

	constructor (props: I.Cell) {
		super(props);

		this.onClick = this.onClick.bind(this);
	};

	render () {
		const { index, recordId, getRecord, withLabel, relation } = this.props;
		const record = getRecord(index, recordId);
		
		if (!record) {
			return null;
		};

		const value = this.getValue();
		const cn = [];

		if (value) {
			cn.push('active');
		};

		let label = null;
		if (withLabel) {
			label = <span className="label">{relation.name} is {value ? 'checked' : 'unchecked'}</span>;
		};

		return (
			<React.Fragment>
				<Icon className={cn.join(' ')} />
				{label}
			</React.Fragment>
		);
	};

	getValue () {
		const { relation, index, getRecord, recordId } = this.props;
		const record = getRecord(index, recordId);

		return Boolean(record[relation.relationKey]);
	};

	onClick () {
		const { onChange } = this.props;
		const value = this.getValue();

		onChange(!value);
	};
	
});

export default CellCheckbox;