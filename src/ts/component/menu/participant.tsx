import React, { forwardRef, useEffect } from 'react';
import { observer } from 'mobx-react';
import { ObjectName, ObjectDescription, Label, IconObject, EmptySearch, Button } from 'Component';
import { I, U, C, S, translate } from 'Lib';

const MenuParticipant = observer(forwardRef<I.MenuRef, I.Menu>((props: I.Menu, ref: any) => {
	
	const { param } = props;
	const { data } = param;
	const { object } = data;
	const { config } = S.Common;

	const load = () => {
		U.Object.getById(object.id, { keys: U.Subscription.participantRelationKeys() }, (object: any) => {
			if (object) {
				props.param.data.object = object;
			};
		});
	};

	const onDmClick = () => {
		const usecase = I.Usecase.ChatSpace;
		const uxType = I.SpaceUxType.OneToOne;
		const details: any = {
			oneToOneIdentity: object.identity,
			spaceUxType: uxType,
			spaceAccessType: I.SpaceType.Shared,
			spaceDashboardId: I.HomePredefinedId.Chat,
		};

		C.WorkspaceCreate(details, usecase, (message: any) => {
			if (message.error.code) {
				console.error(message.error);
				return;
			};

			C.WorkspaceSetInfo(message.objectId, details, () => {
				if (message.error.code) {
					console.error(message.error);
					return;
				};

				U.Router.switchSpace(message.objectId, '', true, {
					onRouteChange: () => {
						U.Space.openDashboard({ replace: true });
					},
				}, false);
			});
		});
	};

	useEffect(() => load(), []);

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

			{config.sudo ? (
				<div className="buttonsWrapper">
					<Button color="pink" className="c32" text="Start DM" onClick={onDmClick} />
				</div>
			) : ''}
		</>
	) : <EmptySearch text={translate('commonNotFound')} />;

}));

export default MenuParticipant;