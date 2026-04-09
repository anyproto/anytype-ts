import React, { forwardRef, useRef, useState, useEffect, useCallback, useImperativeHandle } from 'react';
import { AutoSizer, List } from 'react-virtualized';
import { IconObject, ObjectName, Button, Loader, Error, Input, Filter, Icon } from 'Component';
import { I, C, S, U, J, translate, keyboard, analytics, Action } from 'Lib';
import raf from 'raf';

const SUB_ID = 'popupSpaceCreateParticipants';

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
	const [ step, setStep ] = useState(0);
	const [ search, setSearch ] = useState('');
	const [ name, setName ] = useState('');
	const [ selectedMembers, setSelectedMembers ] = useState<string[]>([]);
	const [ isScrolledTop, setIsScrolledTop ] = useState(false);
	const [ isScrolledBottom, setIsScrolledBottom ] = useState(false);
	const [ isSelectedScrolledTop, setIsSelectedScrolledTop ] = useState(false);
	const [ isSelectedScrolledBottom, setIsSelectedScrolledBottom ] = useState(false);
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
		}, () => {
			if (!S.Record.getRecords(SUB_ID).length) {
				setStep(1);
			};
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
			return unique.filter(it => it.name.toLowerCase().includes(search.toLowerCase()));
		};

		return unique;
	};

	const onMemberListScroll = ({ scrollTop, scrollHeight, clientHeight }) => {
		setIsScrolledTop(scrollTop > 0);
		setIsScrolledBottom((scrollTop + clientHeight) < (scrollHeight - 1));
	};

	const onSelectedListScroll = ({ scrollTop, scrollHeight, clientHeight }) => {
		setIsSelectedScrolledTop(scrollTop > 0);
		setIsSelectedScrolledBottom((scrollTop + clientHeight) < (scrollHeight - 1));
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

			const spaceId = message.objectId;

			const afterUpload = () => {
				C.WorkspaceSetInfo(spaceId, details, (infoMessage: any) => {
				if (infoMessage.error.code) {
					setError(infoMessage.error.description);
					return;
				};

				U.Router.switchSpace(spaceId, '', true, {
					onRouteChange: () => {
						if (isGroup) {
							C.SpaceMakeShareable(S.Common.space, (message: any) => {
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
		const popup = listEl.closest('.innerWrap') as HTMLElement;
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
			if ((step == 0) && listRef.current) {
				const members = getMembers();
				const totalHeight = members.length * ROW_HEIGHT;
				const maxListHeight = getMaxListHeight(listRef.current);
				const listHeight = Math.min(totalHeight, maxListHeight) + 16;

				U.Dom.css(listRef.current, { height: `${listHeight}px` });
				setIsScrolledBottom(totalHeight > maxListHeight);
			};

			if ((step == 1) && selectedListRef.current) {
				const rowCount = selectedMemberObjects.length + 2;
				const totalHeight = LABEL_HEIGHT + (rowCount - 1) * ROW_HEIGHT;
				const maxListHeight = getMaxListHeight(selectedListRef.current);
				const listHeight = Math.min(totalHeight, maxListHeight) + 16;

				U.Dom.css(selectedListRef.current, { height: `${listHeight}px` });
				setIsSelectedScrolledBottom(totalHeight > maxListHeight);
			};
		});
	};

	useEffect(() => {
		iconRef.current?.setObject(getObject());
	}, [ iconOption ]);

	useEffect(() => {
		if (step == 0) {
			setSearch('');
			filterRef.current?.setValue('');
			setIsScrolledTop(false);
			setIsScrolledBottom(false);
			setIsSelectedScrolledTop(false);
			setIsSelectedScrolledBottom(false);

			if (isGroup) {
				analytics.event('ScreenAddMember');
			};
		};

		position();
	}, [ step ]);

	const ROW_HEIGHT = 48;
	const LABEL_HEIGHT = 28;
	const SAFE_AREA = 120;

	const members = getMembers();
	const selectedMemberObjects = S.Record.getRecords(SUB_ID).filter(it => selectedMembers.includes(it.id));
	const hasMembers = isGroup && (members.length || selectedMemberObjects.length);

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
				<ObjectName object={item} withBadge={true} />
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
											onScroll={onMemberListScroll}
										/>
									)}
								</AutoSizer>
							</div>
							{isScrolledBottom ? <div className="grad bottom" /> : ''}
						</>
					) : (
						<div className="emptyState">{search ? translate('commonFilterEmpty') : translate('commonEmpty')}</div>
					)}
				</div>

				<div className="wrapper buttons">
					<Button
						text={translate(selectedMembers.length ? 'popupSpaceCreateNext' : 'popupSpaceCreateContinueWithoutMembers')}
						color="accent"
						onClick={onNext}
					/>
				</div>
			</div>
		);
	} else {
		stepContent = (
			<div className="step step1">
				<div className="wrapper">
					<div className="stepTitle">{title}</div>

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
						{isSelectedScrolledTop ? <div className="grad top" /> : ''}
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

												if (row.type == 'label') {
													return (
														<div key={key} style={style} className="sectionLabel">
															{translate('popupSpaceCreateMembersLabel')}
														</div>
													);
												};

												if (row.type == 'add') {
													return (
														<div key={key} style={style} className="item add" onClick={() => setStep(0)}>
															<Icon name="menu/spaceCreate/group" />
															<div className="name">{translate('popupSpaceCreateAddMembers')}</div>
														</div>
													);
												};

												return (
													<div key={key} style={style} id={`member-${row.id}`} className="item" onContextMenu={e => onMemberContext(e, row.id)}>
														<IconObject size={32} object={row} />
														<ObjectName object={row} withBadge={true} />
													</div>
												);
											}}
											overscanRowCount={10}
											onScroll={onSelectedListScroll}
										/>
									);
								}}
							</AutoSizer>
						</div>
						{isSelectedScrolledBottom ? <div className="grad bottom" /> : ''}
					</div>
				) : ''}

				<div className="wrapper buttons">
					<Button className={!canSave ? 'disabled' : ''} text={translate('popupSpaceCreateStep2Create')} color="accent" onClick={onSubmit} />
				</div>
			</div>
		);
	};

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