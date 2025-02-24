import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Title, Button, Error, IconObject, Loader } from 'Component';
import { I, C, S, U, translate, analytics, sidebar } from 'Lib';

const PopupInviteConfirm = observer(forwardRef<{}, I.Popup>((props, ref) => {

	const [ error, setError ] = useState('');
	const [ isLoading, setIsLoading ] = useState(false);
	const { param, close } = props;
	const { data } = param;
	const { icon, identity, route, spaceId } = data;
	const { membership } = S.Auth;
	const readerLimt = useRef(0);
	const writerLimit = useRef(0);

	const onMembership = (type: string) => {
		S.Popup.closeAll(null, () => {
			U.Object.openAuto({ id: 'membership', layout: I.ObjectLayout.Settings });
		});

		analytics.event('ClickUpgradePlanTooltip', { type, route: analytics.route.inviteConfirm });
	};

	const onConfirm = (permissions: I.ParticipantPermissions) => {
		setIsLoading(true);

		C.SpaceRequestApprove(spaceId, identity, permissions, (message: any) => {
			if (message.error.code) {
				setError(message.error.description);
				return;
			};

			analytics.event('ApproveInviteRequest', { type: permissions });
			setIsLoading(false);
			close();
		});
	};

	const onReject = () => {
		setIsLoading(true);

		C.SpaceRequestDecline(spaceId, identity, (message: any) => {
			if (message.error.code) {
				setError(message.error.description);
				return;
			};

			analytics.event('RejectInviteRequest');
			setIsLoading(false);
			close();
		});
	};

	const space = U.Space.getSpaceviewBySpaceId(spaceId) || {};

	const load = () => {
		setIsLoading(true);

		U.Data.search({
			spaceId,
			keys: U.Data.participantRelationKeys(),
			filters: [
				{ relationKey: 'resolvedLayout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Participant },
			],
			ignoreHidden: false,
			ignoreDeleted: true,
			noDeps: true,
		}, (message: any) => {
			const records = (message.records || []).filter(it => it.isActive);

			readerLimt.current = space.readersLimit - records.length;
			writerLimit.current = space.writersLimit - records.filter(it => it.isWriter || it.isOwner).length;

			setIsLoading(false);
		});
	};

	const name = U.Common.shorten(String(data.name || translate('defaultNamePage')), 32);

	let buttons = [];
	if (!readerLimt.current && membership.isExplorer) {
		buttons.push({ id: 'reader', text: translate('popupInviteConfirmButtonReaderLimit'), onClick: () => onMembership('members') });
	} else 
	if (!writerLimit.current) {
		buttons = buttons.concat([
			{ id: 'reader', text: translate('popupInviteConfirmButtonReader'), onClick: () => onConfirm(I.ParticipantPermissions.Reader) },
			{ id: 'writer', text: translate('popupInviteConfirmButtonWriterLimit'), onClick: () => onMembership('editors') },
		]);
	} else {
		buttons = buttons.concat([
			{ id: 'reader', text: translate('popupInviteConfirmButtonReader'), onClick: () => onConfirm(I.ParticipantPermissions.Reader) },
			{ id: 'writer', text: translate('popupInviteConfirmButtonWriter'), onClick: () => onConfirm(I.ParticipantPermissions.Writer) },
		]);
	};

	useEffect(() => {
		analytics.event('ScreenInviteConfirm', { route });
		load();
	}, []);

	return (
		<>
			{isLoading ? <Loader id="loader" /> : ''}

			<div className="iconWrapper">
				<IconObject object={{ name, iconImage: icon, layout: I.ObjectLayout.Participant }} size={48} />
			</div>

			<Title text={U.Common.sprintf(translate('popupInviteConfirmTitle'), name, U.Common.shorten(space.name, 32))} />

			<div className="buttons">
				<div className="sides">
					{buttons.map((item: any, i: number) => <Button key={i} {...item} className="c36" />)}
				</div>

				<Button onClick={onReject} text={translate('popupInviteConfirmButtonReject')} className="c36" color="red" />
			</div>

			<Error text={error} />
		</>
	);

}));

export default PopupInviteConfirm;
