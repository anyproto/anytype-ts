import * as React from 'react';
import { observer } from 'mobx-react';
import { ObjectName, ObjectDescription, Label, IconObject } from 'Component';
import { I, U } from 'Lib';

const MenuParticipant = observer(class MenuParticipant extends React.Component<I.Menu> {

	render () {
		const object = this.getObject();
		const relationKey = object.globalName ? 'globalName': 'identity';

		return (
			<React.Fragment>
				<IconObject object={object} size={96} />
				<ObjectName object={object} />
				<Label text={U.Common.shorten(object[relationKey], 150)} />
				<ObjectDescription object={object} />
			</React.Fragment>
		);
	};

	componentDidMount () {
		this.load();
	};

	getObject () {
		return this.props.param.data.object;
	};

	load () {
		const object = this.getObject();

		U.Object.getById(object.id, { keys: U.Data.participantRelationKeys() }, (object: any) => {
			this.props.param.data.object = object;
		});
	};

});

export default MenuParticipant;