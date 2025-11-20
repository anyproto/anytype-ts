import React, { forwardRef, useEffect } from 'react';
import { observer } from 'mobx-react';
import { ObjectName, ObjectDescription, Label, IconObject, Icon, EmptySearch } from 'Component';
import { S, I, U, translate, Action, analytics } from 'Lib';

const MenuParticipant = observer(forwardRef<I.MenuRef, I.Menu>((props: I.Menu, ref: any) => {
	useEffect(() => load(), []);

	const { param } = props;
	const { data } = param;
	const { object } = data;

	const load = () => {
		U.Object.getById(object.id, { keys: U.Subscription.participantRelationKeys() }, (object: any) => {
			if (object) {
				props.param.data.object = object;
			};
		});
	};

	return object ? (
		<>
			<IconObject object={object} size={96} />
			<div className="nameWrapper">
				<ObjectName object={object} withBadge={true} />
			</div>
			<Label 
				text={U.Common.shorten(object.resolvedName, 150)} 
				onClick={() => {
					U.Common.copyToast(translate('blockFeaturedIdentity'), object.identity);
				}} 
			/>
			<ObjectDescription object={object} />
		</>
	) : <EmptySearch text={translate('commonNotFound')} />;

}));

export default MenuParticipant;
