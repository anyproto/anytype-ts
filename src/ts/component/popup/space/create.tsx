import React, { forwardRef, useRef, useState, useEffect, useCallback, useImperativeHandle } from 'react';
import { AutoSizer, List } from 'react-virtualized';
import { IconObject, ObjectName, Button, Loader, Error, Input, Filter, Icon, Label } from 'Component';
import { I, C, S, U, J, translate, keyboard, analytics, Action } from 'Lib';
import raf from 'raf';

const SUB_ID = 'popupSpaceCreateParticipants';
const ROW_HEIGHT = 48;
const LABEL_HEIGHT = 28;
const SAFE_AREA = 120;
const GRAD_HEIGHT = 32;

const PopupSpaceCreate = forwardRef<{}, I.Popup>(({ param = {}, getId, close, position }, ref) => {

	const nameRef = useRef(null);
	const iconRef = useRef(null);
	const filterRef = useRef(null);
	const joinInputRef = useRef(null);
	const fileInputRef = useRef(null);
	const listRef = useRef(null);
	const selectedListRef = useRef(null);
	const [ error, setError ] = useState('');
	const [ canSave, setCanSave ] = useState(false);
	const [ isLoading, setIsLoading ] = useState(false);
	const [ iconOption, setIconOption ] = useState(U.Common.rand(1, J.Constant.count.icon));
	const iconImagePathRef = useRef('');
	const [ iconPreviewUrl, setIconPreviewUrl ] = useState('');
	const { data } = param;
	const { type } = data;
	const isGroup = type == I.SpaceCreateType.Group;
	const isJoin = type == I.SpaceCreateType.Join;
	const [ step, setStep ] = useState(isGroup ? 0 : 1);
	const [ ready, setReady ] = useState(!isGroup);
	const [ search, setSearch ] = useState('');
	const [ name, setName ] = useState('');
	const [ selectedMembers, setSelectedMembers ] = useState<string[]>([]);
	const [ isScrolledTop, setIsScrolledTop ] = useState(false);
	const { name: limit } = J.Constant.limit.space;

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

	const getSeatCounters = () => {
		const { writersLimit, readersLimit } = U.Space.getTierLimits();
		const writersCount = Math.min(selectedCount, writersLimit);
		const readersCount = Math.min(Math.max(selectedCount - writersLimit, 0), readersLimit);

		return { writersLimit, readersLimit, writersCount, readersCount };
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
		}, () => {
			if (!S.Record.getRecords(SUB_ID).length) {
				setStep(1);
			};
			setReady(true);
			position();
		});
	}, []);

	const getMembers = () => {
		const list = S.Record.getRecords(SUB_ID);

		// Count spaces per identity for sorting
		const spaceCounts = new Map<string, number>();
		list.forEach(it => {
			if (it.identity) {
				spaceCounts.set(it.identity, (spaceCounts.get(it.identity) || 0) + 1);
			};
		});

		// Deduplicate by identity since the same user can be a participant in multiple spaces
		const seen = new Set<string>();
		const unique = list.filter(it => {
			if (!it.identity || seen.has(it.identity)) {
				return false;
			};

			seen.add(it.identity);
			return true;
		});

		// Sort by: shared spaces count (desc), has name (desc), then name (asc)
		unique.sort((a, b) => {
			const ca = spaceCounts.get(a.identity) || 0;
			const cb = spaceCounts.get(b.identity) || 0;

			if (ca != cb) {
				return cb - ca;
			};

			const na = a.name ? 1 : 0;
			const nb = b.name ? 1 : 0;

			if (na != nb) {
				return nb - na;
			};

			return U.Data.sortByName(a, b);
		});

		if (search) {
			const s = search.toLowerCase();

			return unique.filter(it => {
				return it.name?.toLowerCase().includes(s) || it.globalName?.toLowerCase().includes(s);
			});
		};

		return unique;
	};

	const onScroll = ({ scrollTop, scrollHeight, clientHeight }) => {
		setIsScrolledTop(scrollTop > 0);
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

		const isShared = identities.length > 0;
		const analyticsType = isShared ? I.SpaceCreateType.Group : I.SpaceCreateType.Personal;

		if (isShared) {
			const mySharedSpaces = U.Space.getMySharedSpacesList();
			const { sharedSpacesLimit } = U.Space.getProfile();

			if (sharedSpacesLimit && (mySharedSpaces.length >= sharedSpacesLimit)) {
				S.Popup.open('confirm', {
					data: {
						iconParam: { name: 'popup/header/warning', color: 'grey' },
						title: translate('popupConfirmSharedSpaceLimitTitle'),
						text: U.String.sprintf(translate('popupConfirmSharedSpaceLimitText'), sharedSpacesLimit),
						textConfirm: translate('popupConfirmSharedSpaceLimitButton'),
						canCancel: false,
						onConfirm: () => Action.openSettings('membership', ''),
					},
				});
				analytics.event('ScreenHitShareSpaceLimit');
				return;
			};
		};

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

			const spaceId = message.objectId;

			const afterUpload = () => {
				C.WorkspaceSetInfo(spaceId, details, (infoMessage: any) => {
					if (infoMessage.error.code) {
						setError(infoMessage.error.description);
						return;
					};

					const openPicker = () => {
						close(() => {
							S.Popup.open('spaceHome', {
								data: { spaceId },
								preventCloseByClick: true,
								preventCloseByEscape: true,
								preventResize: true,
							});
						});
					};

					if (isShared) {
						const { writersLimit } = U.Space.getTierLimits();

						if (!S.Common.isOnline) {
							Action.savePendingMembers(spaceId, identities);
							openPicker();
						} else {
							C.SpaceMakeShareable(spaceId, (message: any) => {
								if (message.error.code) {
									if (message.error.code == 104) {
										const { sharedSpacesLimit } = U.Space.getProfile();

										S.Popup.open('confirm', {
											data: {
												iconParam: { name: 'popup/header/warning', color: 'grey' },
												title: translate('popupConfirmSharedSpaceLimitTitle'),
												text: U.String.sprintf(translate('popupConfirmSharedSpaceLimitText'), sharedSpacesLimit),
												textConfirm: translate('popupConfirmSharedSpaceLimitButton'),
												canCancel: false,
												onConfirm: () => Action.openSettings('membership', ''),
											},
										});
										analytics.event('ScreenHitShareSpaceLimit');
									};
									openPicker();
									return;
								};

								C.SpaceInviteGenerate(spaceId, I.InviteType.WithoutApprove, I.ParticipantPermissions.Writer, (message) => {
									if (message.error.code) {
										openPicker();
										return;
									};

									analytics.event('ShareSpace');
									analytics.event('ClickShareSpaceNewLink', { type: I.InviteLinkType.Editor });

									const writerIdentities = identities.slice(0, writersLimit);
									const readerIdentities = identities.slice(writersLimit);

									if (writerIdentities.length) {
										C.SpaceParticipantsAddList(spaceId, writerIdentities, I.ParticipantPermissions.Writer);
									};

									if (readerIdentities.length) {
										C.SpaceParticipantsAddList(spaceId, readerIdentities, I.ParticipantPermissions.Reader);
									};

									analytics.event('AddMember', { count: identities.length });
									openPicker();
								});
							});
						};
					} else {
						openPicker();
					};

					onCreate?.(spaceId);

					analytics.event('CreateSpace', { usecase, middleTime: message.middleTime, route, type: analyticsType });
					analytics.event('SelectUsecase', { type: usecase });
				});
			};

			if (iconImagePathRef.current) {
				C.FileUpload(spaceId, '', iconImagePathRef.current, I.FileType.Image, {}, false, '', I.ImageKind.Icon, '', '', (msg: any) => {
					if (!msg.error.code) {
						details.iconImage = msg.objectId;
						details.iconOption = 0;
					};

					afterUpload();
				});
			} else {
				afterUpload();
			};
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
		fileInputRef.current?.click();
	};

	const onFileInputChange = (e: any) => {
		const file = e.target.files?.[0];

		if (!file) {
			return;
		};

		const electron = U.Common.getElectron();
		const path = electron.webFilePath(file);

		iconImagePathRef.current = path;

		U.File.loadPreviewBase64(file, { type: 'image/png', quality: 0.95, maxWidth: 256 }, (image: string) => {
			setIconPreviewUrl(image);
		});

		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		};
	};

	const object = getObject();

	useEffect(() => {
		if (isGroup) {
			loadMembers();
		};

		analytics.event('ScreenSettingsSpaceCreate', { status: S.Common.isOnline ? 'Online' : 'Offline' });
		position();

		return () => {
			U.Subscription.destroyList([ SUB_ID ]);
		};
	}, []);

	const getMaxListHeight = (listEl: HTMLElement): number => {
		const popup = listEl?.closest('.innerWrap') as HTMLElement;
		if (!popup) {
			return 400;
		};

		const maxPopupHeight = window.innerHeight - SAFE_AREA;
		const stepEl = listEl.closest('.step') as HTMLElement;
		if (!stepEl) {
			return maxPopupHeight;
		};

		let siblingsHeight = 0;
		for (const child of Array.from(stepEl.children)) {
			if (!child.contains(listEl)) {
				siblingsHeight += (child as HTMLElement).offsetHeight;
			};
		};

		return Math.max(maxPopupHeight - siblingsHeight, 80);
	};

	const beforePosition = () => {
		raf(() => {
			let totalHeight = 0;
			let element = null;

			if ((step == 0) && listRef.current) {
				const members = getMembers();

				totalHeight = members.length * ROW_HEIGHT + GRAD_HEIGHT;
				element = listRef.current;
			};

			if ((step == 1) && selectedListRef.current) {
				totalHeight = LABEL_HEIGHT + ROW_HEIGHT + selectedObjectsCount * ROW_HEIGHT + GRAD_HEIGHT;
				element = selectedListRef.current;
			};

			if (element) {
				const maxListHeight = getMaxListHeight(element);
				const listHeight = Math.min(totalHeight, maxListHeight);

				U.Dom.css(element, { height: `${listHeight}px` });
			};
		});
	};

	useEffect(() => {
		iconRef.current?.setObject(getObject());
	}, [ iconOption ]);

	useEffect(() => {
		setIsScrolledTop(false);

		if (step == 0) {
			setSearch('');
			filterRef.current?.setValue('');

			if (isGroup) {
				analytics.event('ScreenAddMember');
			};
		};

		position();
	}, [ step ]);

	useEffect(() => {
		position();
	}, [ search ]);

	const members = getMembers();
	const selectedMemberObjects = S.Record.getRecords(SUB_ID).filter(it => selectedMembers.includes(it.id));
	const selectedCount = selectedMembers.length;
	const selectedObjectsCount = selectedMemberObjects.length;
	const hasMembers = isGroup && ((members.length > 0) || (selectedObjectsCount > 0));

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
				<div className="info">
					<ObjectName object={item} withBadge={true} />
					{item.globalName ? <Label text={item.globalName} /> : ''}
				</div>
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
	if (!ready) {
		stepContent = null;
	} else
	if (isGroup && (step == 0)) {
		const { writersLimit, readersLimit, writersCount, readersCount } = getSeatCounters();
		const showSeatCounters = (writersLimit > 0) && (selectedCount >= writersLimit);

		stepContent = (
			<div className="step step0">
				<div className="wrapper">
					<div className="head">
						<div className="stepTitle">{translate('popupSpaceCreateStep1Title')}</div>
						{showSeatCounters ? (
							<div className="seatCounters">
								{U.String.sprintf(translate('popupSpaceCreateSeatCounters'), writersCount, writersLimit, readersCount, readersLimit)}
							</div>
						) : ''}
					</div>

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
							{isScrolledTop ? <div className="grad top" /> : ''}
							<div ref={listRef} className="memberList">
								<AutoSizer className="scrollArea">
									{({ width, height }) => (
										<List
											width={width}
											height={height}
											rowCount={members.length}
											rowHeight={ROW_HEIGHT}
											rowRenderer={rowRenderer}
											overscanRowCount={10}
											onScroll={onScroll}
										/>
									)}
								</AutoSizer>
							</div>
							<div className="grad bottom" />
						</>
					) : (
						<div className="emptyState">{search ? translate('commonFilterEmpty') : translate('commonEmpty')}</div>
					)}
				</div>

				<div className="wrapper buttons">
					<Button
						text={translate(selectedCount ? 'popupSpaceCreateNext' : 'popupSpaceCreateContinueWithoutMembers')}
						color="accent"
						onClick={onNext}
					/>
				</div>
			</div>
		);
	} else {
		const showOfflinePill = isGroup && (selectedCount > 0) && !S.Common.isOnline;

		stepContent = (
			<div className="step step1">
				<div className="wrapper">
					<div className="stepTitle">{title}</div>
					{showOfflinePill ? (
						<div className="offlinePill">
							<Icon name="common/offline" />
							{translate('popupSpaceCreateOffline')}
						</div>
					) : ''}


					<div className="iconWrapper" onClick={onIcon}>
						{iconPreviewUrl ? (
							<img src={iconPreviewUrl} className="iconPreview" />
						) : (
							<IconObject
								ref={iconRef}
								size={96}
								object={object}
								canEdit={false}
								menuParam={{ horizontal: I.MenuDirection.Center }}
							/>
						)}
						<div className="iconEdit">
							<Icon name="common/edit" />
						</div>
					</div>

					<Input
						ref={nameRef}
						className={[ 'spaceName', (hasMembers ? '' : 'withMargin') ].join(' ')}
						value={name}
						placeholder={translate('popupSpaceCreateNamePlaceholder')}
						onKeyDown={onKeyDown}
						onChange={onNameChange}
						maxLength={limit}
						focusOnMount={true}
						size={52}
					/>
				</div>

				{hasMembers ? (
					<div className="memberListWrapper">
						{isScrolledTop ? <div className="grad top" /> : ''}
						<div ref={selectedListRef} className="memberList">
							<AutoSizer className="scrollArea">
								{({ width, height }) => {
									const rows = [
										{ id: '_label', type: 'label' },
										{ id: '_add', type: 'add' },
										...selectedMemberObjects.map(it => ({ ...it, type: 'member' })),
									];

									return (
										<List
											width={width}
											height={height}
											rowCount={rows.length}
											rowHeight={({ index }) => (rows[index].type == 'label') ? LABEL_HEIGHT : ROW_HEIGHT}
											rowRenderer={({ index, key, style }) => {
												const row = rows[index];

												let content = null;

												switch (row.type) {
													case 'label': {
														content = (
															<div key={key} style={style} className="sectionLabel">
																{translate('popupSpaceCreateMembersLabel')}
															</div>
														);
														break;
													};

													case 'add': {
														content = (
															<div key={key} style={style} className="item add" onClick={() => setStep(0)}>
																<Icon name="menu/spaceCreate/group" />
																<div className="name">{translate('popupSpaceCreateAddMembers')}</div>
															</div>
														);
														break;
													};

													default: {
														content = (
															<div key={key} style={style} id={`member-${row.id}`} className="item" onContextMenu={e => onMemberContext(e, row.id)}>
																<IconObject size={32} object={row} />
																<div className="info">
																	<ObjectName object={row} withBadge={true} />
																	{row.globalName ? <Label text={row.globalName} /> : ''}
																</div>
															</div>
														);
														break;
													};
												};

												return content;
											}}
											overscanRowCount={10}
											onScroll={onScroll}
										/>
									);
								}}
							</AutoSizer>
						</div>
						<div className="grad bottom" />
					</div>
				) : ''}

				<div className="wrapper buttons">
					<Button className={!canSave ? 'disabled' : ''} text={translate('popupSpaceCreateStep2Create')} color="accent" onClick={onSubmit} />
				</div>
			</div>
		);
	};

	useEffect(() => {
		position();
	});

	useImperativeHandle(ref, () => ({
		beforePosition,
	}));

	return (
		<>
			{isLoading ? <Loader id="loader" /> : ''}
			<Icon name="common/close" className="close" onClick={() => close()} />
			{stepContent}
			<Error text={error} />
			<input ref={fileInputRef} type="file" accept="image/*" className="dn" onChange={onFileInputChange} />
		</>
	);

});

export default PopupSpaceCreate;