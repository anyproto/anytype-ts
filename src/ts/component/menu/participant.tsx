import React, { forwardRef, useEffect } from 'react';
import { observer } from 'mobx-react';
import { ObjectName, ObjectDescription, Label, IconObject, EmptySearch, Button } from 'Component';
import { I, U, C, S, translate } from 'Lib';

const MenuParticipant = observer(forwardRef<I.MenuRef, I.Menu>((props: I.Menu, ref: any) => {
	
	const { param, close } = props;
	const { data } = param;
	const { object } = data;
	const { space } = S.Common;
	const { account } = S.Auth;
	const oneToOne = U.Space.getList().filter(it => it.isOneToOne && (it.oneToOneIdentity == object.identity))[0];
	const text = oneToOne ? translate('menuParticipantMessage') : translate('menuParticipantConnect');
	const showButton = ((oneToOne && oneToOne.targetSpaceId != space) || !oneToOne) && (object.identity != account.id);
	const globalName = object.globalName || U.Common.shortMask(object.identity, 6);

	const load = () => {
		U.Object.getById(object.id, { keys: U.Subscription.participantRelationKeys() }, (object: any) => {
			if (object) {
				props.param.data.object = object;
			};
		});
	};

	const onClick = () => {
		if (oneToOne) {
			U.Router.switchSpace(oneToOne.targetSpaceId, '', true, {}, false);
			close();
			return;
		};

		const uxType = I.SpaceUxType.OneToOne;
		const details: any = {
			oneToOneIdentity: object.identity,
			spaceUxType: uxType,
			spaceAccessType: I.SpaceType.Shared,
			spaceDashboardId: I.HomePredefinedId.Chat,
		};

		C.WorkspaceCreate(details, I.Usecase.ChatSpace, (message: any) => {
			if (message.error.code) {
				return;
			};

			const objectId = message.objectId;

			C.WorkspaceSetInfo(objectId, details, (message: any) => {
				if (message.error.code) {
					return;
				};

				U.Router.switchSpace(objectId, '', true, {}, false);
			});
		});

		close();
	};

	useEffect(() => load(), []);

	return object ? (
		<>
			<div className="head">
				<Label
					text={globalName}
					onClick={() => {
						U.Common.copyToast(translate('blockFeaturedIdentity'), object.identity);
					}}
				/>
			</div>
			<IconObject object={object} size={128} />
			<div className="nameWrapper">
				<ObjectName object={object} withBadge={true} />
			</div>
			<ObjectDescription object={object} />

			{showButton ? (
				<div className="buttonsWrapper">
					<Button color="accent" text={text} onClick={onClick} />
				</div>
			) : ''}
		</>
	) : <EmptySearch text={translate('commonNotFound')} />;

}));

export default MenuParticipant;