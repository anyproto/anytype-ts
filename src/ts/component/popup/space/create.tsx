import React, { forwardRef, useRef, useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import { AutoSizer, List } from 'react-virtualized';
import { IconObject, ObjectName, Button, Loader, Error, Input, Filter, Icon } from 'Component';
import { I, C, S, U, J, translate, keyboard, analytics, Action } from 'Lib';

const PopupSpaceCreate = observer(forwardRef<{}, I.Popup>(({ param = {}, close, position }, ref) => {

	const nameRef = useRef(null);
	const iconRef = useRef(null);
	const filterRef = useRef(null);
	const [ error, setError ] = useState('');
	const [ canSave, setCanSave ] = useState(false);
	const [ isLoading, setIsLoading ] = useState(false);
	const [ iconOption, setIconOption ] = useState(U.Common.rand(1, J.Constant.count.icon));
	const [ step, setStep ] = useState(0);
	const [ search, setSearch ] = useState('');
	const [ name, setName ] = useState('');
	const [ selectedMembers, setSelectedMembers ] = useState<string[]>([]);
	const { data } = param;
	const { spaceType } = data;
	const { name: limit } = J.Constant.limit.space;
	const isChatSpace = spaceType == I.SpaceType.Chat;

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
			spaceType,
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

	const getMembers = () => {
		const participant = U.Space.getParticipant();
		const list = U.Space.getParticipantsList([ I.ParticipantStatus.Active ]);

		return list.filter(it => {
			if (participant && (it.id == participant.id)) {
				return false;
			};

			if (search) {
				return it.name.toLowerCase().includes(search.toLowerCase());
			};

			return true;
		});
	};

	const onSubmit = () => {
		if (isLoading || !canSave) {
			return;
		};

		const { onCreate, route } = data;
		const submittedName = checkName(name);
		const usecase = I.Usecase.DataSpace;

		// Resolve identities before space switch since participant objects belong to the current space
		const identities = U.Space.getParticipantsList([ I.ParticipantStatus.Active ])
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
						if (isChatSpace) {
							C.SpaceMakeShareable(S.Common.space, (message: any) => {
								if (message.error.code) {
									return;
								};

								C.SpaceInviteGenerate(S.Common.space, I.InviteType.WithoutApprove, I.ParticipantPermissions.Writer, (message) => {
									if (message.error) {
										return;
									};

									analytics.event('ShareSpace');
									analytics.event('ClickShareSpaceNewLink', { type: I.InviteLinkType.Editor });
								});

								if (identities.length) {
									C.SpaceParticipantsAddList(S.Common.space, identities);
								};
							});
						};

						Action.openSettings('spaceHome', '');

						onCreate?.(message.objectId);
					}
				}, false);

				analytics.event('CreateSpace', { usecase, middleTime: message.middleTime, route, spaceType });
				analytics.event('SelectUsecase', { type: usecase });
			});
		});
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
		iconRef.current?.setObject(getObject());
	}, [ iconOption ]);

	useEffect(() => {
		if (step == 0) {
			setSearch('');
			filterRef.current?.setValue('');
		};
		position?.();
	}, [ step ]);

	const ROW_HEIGHT = 48;
	const LIST_HEIGHT = 280;

	const members = getMembers();
	const selectedMemberObjects = U.Space.getParticipantsList([ I.ParticipantStatus.Active ]).filter(it => selectedMembers.includes(it.id));
	const listHeight = Math.min(members.length * ROW_HEIGHT, LIST_HEIGHT);
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
				className="memberRow"
				onClick={() => onToggleMember(item.id)}
			>
				<IconObject size={32} object={item} />
				<ObjectName object={item} />
				<Icon name={selectedMembers.includes(item.id) ? 'marker/checkbox2' : 'marker/checkbox0'} className="checkbox" />
			</div>
		);
	};

	const title = translate(isChatSpace ? 'popupSpaceCreateTitleGroup' : 'popupSpaceCreateTitlePersonal');

	const renderCreateStep = () => (
		<div className="step step1">
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
			/>

			{isChatSpace ? (
				<div className="membersSection">
					<div className="sectionLabel">{translate('popupSpaceCreateMembersLabel')}</div>
					<div className="addMembers" onClick={() => setStep(0)}>
						<Icon name="menu/spaceCreate/group" className="addMember" />
						<div className="name">{translate('popupSpaceCreateAddMembers')}</div>
					</div>
					{selectedMemberObjects.map(item => (
						<div key={item.id} className="memberItem">
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
	);

	let stepContent = null;

	if (isChatSpace && (step == 0)) {
		stepContent = (
			<div className="step step0">
				<div className="stepTitle">{translate('popupSpaceCreateStep1Title')}</div>

				<Filter
					ref={filterRef}
					iconParam={{ name: 'common/search' }}
					placeholder={translate('popupSpaceCreateStep1Placeholder')}
					focusOnMount={false}
					size={36}
					onChange={v => setSearch(v)}
				/>

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

				<div className="buttons">
					<Button className={!selectedMembers.length ? 'disabled' : ''} text={translate('popupSpaceCreateNext')} color="accent" onClick={onNext} />
				</div>
			</div>
		);
	} else {
		stepContent = renderCreateStep();
	};

	return (
		<>
			{isLoading ? <Loader id="loader" /> : ''}
			<Icon name="common/close" className="close" onClick={() => close()} />
			{stepContent}
			<Error text={error} />
		</>
	);

}));

export default PopupSpaceCreate;
