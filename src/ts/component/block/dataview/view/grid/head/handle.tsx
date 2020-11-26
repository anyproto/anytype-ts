import * as React from 'react';
import { I, DataUtil } from 'ts/lib';
import { Icon } from 'ts/component';
import { SortableHandle } from 'react-sortable-hoc';
import { observer } from 'mobx-react';

interface Props extends I.Relation {};

@observer
class HeadHandle extends React.Component<Props, {}> {

	render () {
		const { format, name } = this.props;

		const Handle = SortableHandle(() => (
			<div>
				<Icon className={'relation c-' + DataUtil.relationClass(format)} />
				<div className="name">{name}</div>
			</div>
		));

		return <Handle />;
	};

};

export default HeadHandle;