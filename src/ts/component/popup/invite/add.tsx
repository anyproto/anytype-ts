import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { AutoSizer, List } from 'react-virtualized';
import { Title, Label, Icon, Button, Filter, IconObject, ObjectName, Error, EmptySearch } from 'Component';
import { useParticipantCandidates } from 'Hook';
import * as I from 'Interface';

const SUB_ID = 'popupInviteAddParticipants';
const ROW_HEIGHT = 48;

const PopupInviteAdd = forwardRef<{}, I.Popup>((props, ref) => {

	const [ error, setError ] = useState('');
	const [ isLoading, setIsLoading ] = useState(false);
	const [ search, setSearch ] = useState('');
	const [ selected, setSelected ] = useState<string[]>([]);
	const [ permissions, setPermissions ] = useState(I.ParticipantPermissions.Writer);
	const filterRef = useRef<any>(null);
	const { param, close } = props;
	const { data } = param;
	const { spaceId } = data;

	const members = useParticipantCandidates(SUB_ID, true, search);
	const isWriterLimit = U.Space.getWriterLimit() <= 0;

	const onToggle = (id: string) => {
		setSelected(selected.includes(id) ? selected.filter(it => it != id) : selected.concat(id));
	};

	const onPermissions = () => {
		const options = [
			{ id: String(I.ParticipantPermissions.Writer), name: translate('participantPermissions1'), disabled: isWriterLimit },
			{ id: String(I.ParticipantPermissions.Reader), name: translate('participantPermissions0') },
		];

		S.Menu.open('select', {
			element: '#inviteAddRoleSelect',
			horizontal: I.MenuDirection.Right,
			data: {
				value: String(permissions),
				options,
				onSelect: (e: any, item: any) => setPermissions(Number(item.id)),
			},
		});
	};

	const onSubmit = () => {
		if (isLoading || !selected.length) {
			return;
		};

		const identities = S.Record.getRecords(SUB_ID)
			.filter(it => selected.includes(it.id))
			.map(it => it.identity)
			.filter(it => it);

		if (!identities.length) {
			return;
		};

		setIsLoading(true);
		setError('');

		C.SpaceParticipantsAddList(spaceId, identities, permissions, (message: any) => {
			setIsLoading(false);

			if (message.error.code) {
				setError(message.error.description);
				return;
			};

			analytics.event('AddMember', { count: identities.length, type: permissions });
			close();
		});
	};

	const rowRenderer = ({ index, key, style }) => {
		const item = members[index];

		if (!item) {
			return null;
		};

		return (
			<div key={key} style={style} className="item" onClick={() => onToggle(item.id)}>
				<IconObject size={32} object={item} />
				<div className="info">
					<ObjectName object={item} withBadge={true} />
					{item.globalName ? <Label text={item.globalName} /> : ''}
				</div>
				<Icon name={selected.includes(item.id) ? 'marker/checkbox2' : 'marker/checkbox0'} className="checkbox" />
			</div>
		);
	};

	useEffect(() => {
		analytics.event('ScreenAddMember');
	}, []);

	// "Invite 0 members" is not a thing anyone wants to read.
	const buttonText = selected.length
		? U.String.sprintf(translate('popupInviteAddButton'), selected.length, U.Common.plural(selected.length, translate('pluralMember')))
		: translate('popupInviteAddTitle');

	return (
		<>
			<Title text={translate('popupInviteAddTitle')} />

			<Filter
				ref={filterRef}
				iconParam={{ name: 'common/search' }}
				placeholder={translate('popupSpaceCreateStep1Placeholder')}
				size={36}
				onChange={v => {
					setSearch(v);
					analytics.event('MemberSearchInput');
				}}
			/>

			<div className="items">
				{members.length ? (
					<AutoSizer disableHeight={true}>
						{({ width }) => (
							<List
								width={width}
								height={Math.min(members.length, 8) * ROW_HEIGHT}
								rowCount={members.length}
								rowHeight={ROW_HEIGHT}
								rowRenderer={rowRenderer}
								overscanRowCount={10}
							/>
						)}
					</AutoSizer>
				) : <EmptySearch text={translate('popupInviteAddEmpty')} />}
			</div>

			{members.length ? (
				<>
					<div className="role">
						<Label className="sectionName" text={translate('popupInviteAddSelectRole')} />

						<div id="inviteAddRoleSelect" className="select round size36" onClick={onPermissions}>
							<div className="item">
								<div className="name">{translate(`participantPermissions${permissions}`)}</div>
							</div>
							<Icon name="arrow/small" className="arrow dark" />
						</div>
					</div>

					<div className="buttons">
						<Button
							className={[ 'c36', selected.length ? '' : 'disabled' ].join(' ')}
							color="accent"
							text={buttonText}
							onClick={onSubmit}
						/>
					</div>
				</>
			) : ''}

			<Error text={error} />
		</>
	);

});

export default PopupInviteAdd;
