import React, { forwardRef, useRef, useState, useEffect, useCallback } from 'react';
import { AutoSizer, List } from 'react-virtualized';
import { IconObject, ObjectName, Button, Loader, Error, Input, Filter, Icon } from 'Component';
import { I, C, S, U, J, translate, keyboard, analytics, Action } from 'Lib';

const SUB_ID = 'popupSpaceCreateParticipants';

const PopupSpaceCreate = forwardRef<{}, I.Popup>(({ param = {}, getId, close, position }, ref) => {

	const nameRef = useRef(null);
	const iconRef = useRef(null);
	const filterRef = useRef(null);
	const joinInputRef = useRef(null);
	const [ error, setError ] = useState('');
	const [ canSave, setCanSave ] = useState(false);
	const [ isLoading, setIsLoading ] = useState(false);
	const [ iconOption, setIconOption ] = useState(U.Common.rand(1, J.Constant.count.icon));
	const [ step, setStep ] = useState(0);
	const [ search, setSearch ] = useState('');
	const [ name, setName ] = useState('');
	const [ selectedMembers, setSelectedMembers ] = useState<string[]>([]);
	const { data } = param;
	const { type } = data;
	const { name: limit } = J.Constant.limit.space;
	const isGroup = type == I.SpaceCreateType.Group;
	const isJoin = type == I.SpaceCreateType.Join;

	const onKeyDown = (e: any) => {
		keyboard.shortcut('enter', e, () => {
			e.preventDefault();
			onSubmit();
		});
	};

	const onNameChange = (e: any, v: string) => {
		setName(v);
		setCanSave(v.trim().length > 0);

		const object = getObject();
		object.name = v.trim().length ? v : translate('defaultNamePage');
		iconRef.current?.setObject(object);
	};

	const getObject = () => {
		return {
			name,
			layout: I.ObjectLayout.SpaceView,
			iconOption,
		};
	};

	const checkName = (v: string): string => {
		if ([
			translate('defaultNameSpace'),
			translate('defaultNamePage'),
		].includes(v)) {
			v = '';
		};
		return v;
	};

	const onNext = () => {
		if (!selectedMembers.length) {
			return;
		};

		const next = step + 1;

		setStep(next);
		analytics.event('ScreenChannelCreateStep', { step: next });
	};

	const onToggleMember = (id: string) => {
		setSelectedMembers(prev => {
			if (prev.includes(id)) {
				return prev.filter(it => it != id);
			} else {
				return [ ...prev, id ];
			};
		});
	};

	const loadMembers = useCallback(() => {
		U.Subscription.subscribe({
			subId: SUB_ID,
			keys: U.Subscription.participantRelationKeys(),
			filters: [
				{ relationKey: 'resolvedLayout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Participant },
				{ relationKey: 'participantStatus', condition: I.FilterCondition.Equal, value: I.ParticipantStatus.Active },
				{ relationKey: 'identity', condition: I.FilterCondition.NotEqual, value: S.Auth.account?.id },
			],
			ignoreHidden: false,
			noDeps: true,
			crossSpace: true,
		});
	}, []);

	const getMembers = () => {
		const list = S.Record.getRecords(SUB_ID);

		// Deduplicate by identity since the same user can be a participant in multiple spaces
		const seen = new Set<string>();
		const unique = list.filter(it => {
			if (!it.identity || seen.has(it.identity)) {
				return false;
			};

			seen.add(it.identity);
			return true;
		});

		unique.sort(U.Data.sortByName);

		if (search) {
			return unique.filter(it => it.name.toLowerCase().includes(search.toLowerCase()));
		};

		return unique;
	};

	const onSubmit = () => {
		if (isLoading || !canSave) {
			return;
		};

		const { onCreate, route } = data;
		const submittedName = checkName(name);
		const usecase = I.Usecase.DataSpace;

		// Resolve identities from cross-space subscription before space switch
		const identities = S.Record.getRecords(SUB_ID)
			.filter(it => selectedMembers.includes(it.id))
			.map(it => it.identity)
			.filter(it => it);

		setIsLoading(true);

		const details: any = {
			name: submittedName,
			iconOption,
			spaceAccessType: I.SpaceAccessType.Private,
			homepage: I.HomePredefinedId.Widget,
		};

		C.WorkspaceCreate(details, usecase, (message: any) => {
			setIsLoading(false);

			if (message.error.code) {
				setError(message.error.description);
				return;
			};

			C.WorkspaceSetInfo(message.objectId, details, () => {
				if (message.error.code) {
					setError(message.error.description);
					return;
				};

				U.Router.switchSpace(message.objectId, '', true, {
					onRouteChange: () => {
						if (isGroup) {
							C.SpaceMakeShareable(S.Common.space, (message: any) => {
								if (message.error.code) {
									return;
								};

								C.SpaceInviteGenerate(S.Common.space, I.InviteType.WithoutApprove, I.ParticipantPermissions.Writer, (message) => {
									analytics.event('ShareSpace');
									analytics.event('ClickShareSpaceNewLink', { type: I.InviteLinkType.Editor });

									if (identities.length) {
										C.SpaceParticipantsAddList(S.Common.space, identities, I.ParticipantPermissions.Writer);
										analytics.event('AddMember', { count: identities.length });
									};
								});
							});
						};

						Action.openSettings('spaceHome', '');
						onCreate?.(message.objectId);
					}
				}, false);

				analytics.event('CreateSpace', { usecase, middleTime: message.middleTime, route, type });
				analytics.event('SelectUsecase', { type: usecase });
			});
		});
	};

	const onMemberContext = (e: React.MouseEvent, id: string) => {
		e.preventDefault();
		e.stopPropagation();

		S.Menu.open('select', {
			classNameWrap: 'fromPopup',
			className: 'fixed',
			horizontal: I.MenuDirection.Center,
			rect: { x: e.clientX, y: e.clientY, width: 0, height: 0 },
			data: {
				options: [
					{ id: 'remove', name: translate('commonRemove'), iconParam: { name: 'menu/action/remove' } },
				],
				onSelect: () => {
					onToggleMember(id);
				},
			},
		});
	};

	const onJoinSubmit = (e: any) => {
		e.preventDefault();

		const route = U.Common.getRouteFromUrl(joinInputRef.current?.getValue());

		if (route) {
			close(() => U.Router.go(route, {}));
		} else {
			setError(translate('popupSpaceJoinByLinkError'));
		};
	};

	const onJoinKeyUp = () => {
		const v = joinInputRef.current?.getValue();

		U.Dom.toggleClass(U.Dom.select(`#${getId()} .button`), 'disabled', !v?.length);
		setError('');
	};

	const onIcon = () => {
		let icon = iconOption;

		icon++;
		if (icon > J.Constant.count.icon) {
			icon = 1;
		};

		setIconOption(icon);
	};

	const object = getObject();

	useEffect(() => {
		if (isGroup) {
			loadMembers();
		};

		analytics.event('ScreenSettingsSpaceCreate', { status: S.Common.isOnline ? 'Online' : 'Offline' });

		return () => {
			U.Subscription.destroyList([ SUB_ID ]);
		};
	}, []);

	useEffect(() => {
		iconRef.current?.setObject(getObject());
	}, [ iconOption ]);

	useEffect(() => {
		if (step == 0) {
			setSearch('');
			filterRef.current?.setValue('');

			if (isGroup) {
				analytics.event('ScreenAddMember');
			};
		};
		position?.();
	}, [ step ]);

	const ROW_HEIGHT = 48;
	const LIST_HEIGHT = 340;

	const members = getMembers();
	const selectedMemberObjects = S.Record.getRecords(SUB_ID).filter(it => selectedMembers.includes(it.id));
	const listHeight = Math.min(members.length * ROW_HEIGHT, LIST_HEIGHT) + 16;
	const showGrad = (members.length * ROW_HEIGHT) > LIST_HEIGHT;

	const rowRenderer = ({ index, key, style }) => {
		const item = members[index];

		if (!item) {
			return null;
		};

		return (
			<div
				key={key}
				style={style}
				className="item"
				onClick={() => onToggleMember(item.id)}
			>
				<IconObject size={32} object={item} />
				<ObjectName object={item} />
				<Icon name={selectedMembers.includes(item.id) ? 'marker/checkbox2' : 'marker/checkbox0'} className="checkbox" />
			</div>
		);
	};

	const title = translate(isGroup ? 'popupSpaceCreateTitleGroup' : 'popupSpaceCreateTitlePersonal');

	let stepContent = null;

	if (isJoin) {
		stepContent = (
			<div className="step stepJoin">
				<div className="wrapper">
					<div className="stepTitle">{translate('popupSpaceJoinByLinkLabel')}</div>
					<form onSubmit={onJoinSubmit}>
						<Input
							type="text"
							ref={joinInputRef}
							size={40}
							onKeyUp={onJoinKeyUp}
							placeholder={translate('popupSpaceJoinByLinkInputPlaceholder')}
							focusOnMount={true}
						/>
						<Button className="disabled" color="accent" text={translate('popupInviteRequestRequestToJoin')} onClick={onJoinSubmit} />
					</form>
				</div>
			</div>
		);
	} else
	if (isGroup && (step == 0)) {
		stepContent = (
			<div className="step step0">
				<div className="wrapper">
					<div className="stepTitle">{translate('popupSpaceCreateStep1Title')}</div>

					<Filter
						ref={filterRef}
						iconParam={{ name: 'common/search' }}
						placeholder={translate('popupSpaceCreateStep1Placeholder')}
						focusOnMount={false}
						size={36}
						onChange={v => {
							setSearch(v);
							analytics.event('MemberSearchInput');
						}}
					/>
				</div>

				<div className="memberListWrapper">
					{members.length ? (
						<>
							<div className="memberList" style={{ height: listHeight }}>
								<AutoSizer className="scrollArea">
									{({ width, height }) => (
										<List
											width={width}
											height={height}
											rowCount={members.length}
											rowHeight={ROW_HEIGHT}
											rowRenderer={rowRenderer}
											overscanRowCount={10}
										/>
									)}
								</AutoSizer>
							</div>
							{showGrad ? <div className="grad" /> : ''}
						</>
					) : (
						<div className="emptyState">{search ? translate('commonFilterEmpty') : translate('commonEmpty')}</div>
					)}
				</div>

				<div className="wrapper">
					<div className="buttons">
						<Button 
							className={!selectedMembers.length ? 'disabled' : ''} 
							text={translate('popupSpaceCreateNext')} 
							color="accent" 
							onClick={onNext}
						/>
					</div>
				</div>
			</div>
		);
	} else {
		stepContent = (
			<div className="step step1">
				<div className="wrapper">
					<div className="stepTitle">{title}</div>

					<div className="iconWrapper">
						<IconObject
							ref={iconRef}
							size={96}
							object={object}
							canEdit={false}
							menuParam={{ horizontal: I.MenuDirection.Center }}
							onClick={onIcon}
						/>
					</div>

					<Input
						ref={nameRef}
						className="spaceName"
						value={name}
						placeholder={translate('popupSpaceCreateNamePlaceholder')}
						onKeyDown={onKeyDown}
						onChange={onNameChange}
						maxLength={limit}
						focusOnMount={true}
						size={52}
					/>

					{isGroup ? (
						<div className="membersSection">
							<div className="sectionLabel">{translate('popupSpaceCreateMembersLabel')}</div>
							<div className="item add" onClick={() => setStep(0)}>
								<Icon name="menu/spaceCreate/group" />
								<div className="name">{translate('popupSpaceCreateAddMembers')}</div>
							</div>

							{selectedMemberObjects.map(item => (
								<div key={item.id} id={`member-${item.id}`} className="item" onContextMenu={e => onMemberContext(e, item.id)}>
									<IconObject size={32} object={item} />
									<ObjectName object={item} />
								</div>
							))}
						</div>
					) : ''}

					<div className="buttons">
						<Button className={!canSave ? 'disabled' : ''} text={translate('popupSpaceCreateStep2Create')} color="accent" onClick={onSubmit} />
					</div>
				</div>
			</div>
		);
	};

	return (
		<>
			{isLoading ? <Loader id="loader" /> : ''}
			<Icon name="common/close" className="close" onClick={() => close()} />
			{stepContent}
			<Error text={error} />
		</>
	);

});

export default PopupSpaceCreate;