import * as React from 'react';
import { Label, Button } from 'Component';
import { I } from 'Lib';
import { observer } from 'mobx-react';

interface Props extends I.ViewComponent {};

const Empty = observer(class Empty extends React.Component<Props, {}> {

	render () {
		const { onRecordAdd } = this.props;

		return (
			<div className="dataviewEmpty">
				<div className="inner">
					<Label className="name" text="No objects of this type" />
					<Label className="descr" text="Create the first object of this type to start your set" />

					<Button color="blank" text="Add object" onClick={(e: any) => { onRecordAdd(e, 1); }} />
				</div>
			</div>
		);
	};

});

export default Empty;