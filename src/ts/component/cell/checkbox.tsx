import * as React from 'react';
import { Icon, Label } from 'Component';
import { I, U, translate } from 'Lib';
import { observer } from 'mobx-react';

const CellCheckbox = observer(class CellCheckbox extends React.Component<I.Cell> {

	constructor (props: I.Cell) {
		super(props);

		this.onClick = this.onClick.bind(this);
	};

	render () {
		const { withLabel, withName, relation, recordId, getRecord } = this.props;
		const record = getRecord(recordId);
		
		if (!record) {
			return null;
		};

		const value = this.getValue();
		const cn = [];

		if (value) {
			cn.push('active');
		};

		let label = '';
		if (withLabel) {
			label = U.Common.sprintf(translate(`relationCheckboxLabel${Number(value)}`), relation.name);
		} else
		if (withName) {
			label = relation.name;
		};

		return (
			<React.Fragment>
				<Icon className={cn.join(' ')} />
				{label ? <Label text={label} /> : ''}
			</React.Fragment>
		);
	};

	getValue () {
		const { relation, recordId, getRecord } = this.props;
		const record = getRecord(recordId);

		return Boolean(record[relation.relationKey]);
	};

	onClick () {
		const { onChange } = this.props;
		const value = this.getValue();

		onChange(!value);
	};
	
});

export default CellCheckbox;
