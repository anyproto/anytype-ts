import * as React from 'react';
import { Icon } from 'ts/component';
import { I } from 'ts/lib';
import { observer } from 'mobx-react';

interface Props extends I.Cell {}

const CellCheckbox = observer(class CellCheckbox extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);

		this.onClick = this.onClick.bind(this);
	};

	render () {
		const { index, getRecord } = this.props;
		const record = getRecord(index);
		if (!record) {
			return null;
		};

		const value = this.getValue();
		return <Icon className={[ 'checkbox', (value ? 'active' : '') ].join(' ')} />;
	};

	getValue () {
		const { relation, index, getRecord } = this.props;
		const record = getRecord(index);

		return Boolean(record[relation.relationKey]);
	};

	onClick () {
		const { onChange } = this.props;
		const value = this.getValue();

		onChange(!value);
	};
	
});

export default CellCheckbox;