import React, { forwardRef, useEffect } from 'react';
import { observer } from 'mobx-react';
import { ObjectName, ObjectDescription, Label, IconObject, EmptySearch } from 'Component';
import { I, U, translate } from 'Lib';

const MenuParticipant = observer(forwardRef<I.MenuRef, I.Menu>((props: I.Menu, ref: any) => {
	useEffect(() => load(), []);

	const getObject = () => {
		return props.param.data.object;
	};

	const setObject = (object: any) => {
		props.param.data.object = object;
	};

	const load = () => {
		const object = getObject();
		if (!object) {
			return;
		};

		U.Object.getById(object.id, { keys: U.Data.participantRelationKeys() }, (object: any) => {
			if (object) {
				setObject(object);
			};
		});
	};

	const object = getObject();
	const relationKey = object.globalName ? 'globalName': 'identity';

	return object ? (
		<>
			<IconObject object={object} size={96} />
			<ObjectName object={object} />
			<Label text={U.Common.shorten(object[relationKey], 150)} />
			<ObjectDescription object={object} />
		</>
	) : <EmptySearch text={translate('commonNotFound')} />;

}));

export default MenuParticipant;