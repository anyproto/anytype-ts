import React, { forwardRef, useEffect } from 'react';
import { observer } from 'mobx-react';
import { ObjectName, ObjectDescription, Label, IconObject, EmptySearch } from 'Component';
import { I, U, translate } from 'Lib';

const MenuParticipant = observer(forwardRef<I.MenuRef, I.Menu>((props: I.Menu, ref: any) => {
	useEffect(() => load(), []);

	const { param } = props;
	const { data } = param;
	const { object } = data;

	const load = () => {
		U.Object.getById(object.id, { keys: U.Data.participantRelationKeys() }, (object: any) => {
			if (object) {
				props.param.data.object = object;
			};
		});
	};

	return object ? (
		<>
			<IconObject object={object} size={96} />
			<ObjectName object={object} />
			<Label text={U.Common.shorten(object.resolvedName, 150)} />
			<ObjectDescription object={object} />
		</>
	) : <EmptySearch text={translate('commonNotFound')} />;

}));

export default MenuParticipant;