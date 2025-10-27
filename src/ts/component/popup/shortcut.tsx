import React, { forwardRef, useState, useEffect, useRef, useImperativeHandle } from 'react';
import $ from 'jquery';
import { Filter, Icon, Select, Label, Error } from 'Component';
import { I, U, J, S, translate, keyboard, Key, Storage, Renderer, Action, Preview, analytics } from 'Lib';

const PopupShortcut = forwardRef<{}, I.Popup>((props, ref) => {

	const { getId, close } = props;
	const [ page, setPage ] = useState('');
	const [ filter, setFilter ] = useState('');
	const [ dummy, setDummy ] = useState(0);
	const [ editingId, setEditingId ] = useState('');
	const [ errorId, setErrorId ] = useState('');
	const [ editingKeys, setEditingKeys ] = useState([]);
	const bodyRef = useRef(null);
	const sections = J.Shortcut.getSections();
	const current = page || sections[0].id;
	const section = U.Common.objectCopy(sections.find(it => it.id == current));
	const timeout = useRef(0);
	const id = getId();

	const onClick = (item: any) => {
		setEditingId(item.id);

		analytics.event('ClickShortcut', { name: item.id });
	};

	const onContext = (item: any) => {
		const options = [
			{ id: 'edit', name: translate('popupShortcutReassign') },
			{ id: 'reset', name: translate('popupShortcutReset') },
			{ id: 'remove', name: translate('popupShortcutRemove') },
		];

		S.Menu.open('select', {
			element: `#${getId()} #item-${item.id}`,
			horizontal: I.MenuDirection.Right,
			data: {
				options,
				onSelect: (e: any, el: any) => {
					switch (el.id) {
						case 'edit': {
							setEditingId(item.id);
							break;
						};

						case 'reset': {
							Storage.resetShortcut(item.id);
							setDummy(dummy + 1);
							break;
						};

						case 'remove': {
							Storage.removeShortcut(item.id);
							setDummy(dummy + 1);
							break;
						};
					};
				},
			},
		});
	};

	const onMenu = () => {
		const options = [
			{ id: 'export', name: translate('popupShortcutExport') },
			{ id: 'import', name: translate('popupShortcutImport') },
			{ id: 'reset', name: translate('popupShortcutResetAll') },
		];

		S.Menu.open('select', {
			element: `#${getId()} #icon-more`,
			horizontal: I.MenuDirection.Center,
			data: {
				options,
				onSelect: (e: any, item: any) => {
					switch (item.id) {
						case 'export': {
							const ret = {};
							const items = J.Shortcut.getItems();

							for (const k in items) {
								const item = items[k];

								if (item.id) {
									ret[item.id] = item.keys;
								};
							};

							Action.openDirectoryDialog({ buttonLabel: translate('commonExport') }, paths => {
								if (paths.length) {
									Renderer.send('shortcutExport', paths[0], ret);

									Preview.toastShow({ text: translate('popupShortcutToastExported') });
									analytics.event('ExportShortcutMapping');
								};
							});

							analytics.event('ClickExportShortcutMapping');
							break;
						};

						case 'import': {
							S.Popup.open('confirm', {
								data: {
									title: translate('commonAreYouSure'),
									text: translate('popupShortcutImportText'),
									textConfirm: translate('commonConfirm'),
									onConfirm: () => {
										Action.openFileDialog({ extensions: [ 'json' ], buttonLabel: translate('commonImport') }, paths => {
											if (paths.length) {
												Renderer.send('shortcutImport', paths[0]).then((data: any) => {
													Storage.setShortcuts(data || {});
													setDummy(dummy + 1);

													Renderer.send('initMenu');
													Preview.toastShow({ text: translate('popupShortcutToastUpdated') });
													analytics.event('ImportShortcutMapping');
												});
											};
										});
									},
								},
							});

							analytics.event('ClickImportShortcutMapping');
							break;
						};

						case 'reset': {
							setErrorId('');

							S.Popup.open('confirm', {
								data: {
									title: translate('commonAreYouSure'),
									text: translate('popupShortcutResetAllText'),
									textConfirm: translate('commonConfirm'),
									onConfirm: () => {
										Storage.resetShortcuts();
										setDummy(dummy + 1);

										Renderer.send('initMenu');
										Preview.toastShow({ text: translate('popupShortcutToastUpdated') });
										analytics.event('ResetShortcutMapping');
									},
								},
							});

							analytics.event('ClickResetShortcutMapping');
							break;
						};
					};
				},
			}
		});
	};

	const Section = (item: any) => {
		const cn = [ 'section' ];

		return (
			<div className={cn.join(' ')}>
				{item.name ? <div className="name">{item.name}</div> : ''}
				{item.description ? <div className="descr">{item.description}</div> : ''}

				<div className="items">
					{item.children.map((item: any, i: number) => (
						<Item key={i} {...item} />
					))}
				</div>
			</div>
		);
	};

	const Symbol = (item: any) => {
		if (item.text == '[,]') {
			return <>,</>;
		} else {
			return <Label text={item.text} />;
		};
	};

	const Item = (item: any) => {
		const cn = [ 'item' ];
		const canEdit = item.id && !item.noEdit;
		const isEditing = editingId && (editingId == item.id);

		let symbols = item.symbols || [];
		let onClickHandler = () => {};
		let onContextHandler = () => {};
		let buttons = null;
		let alert = null;

		if (canEdit) {
			cn.push('canEdit');

			if (isEditing) {
				cn.push('isEditing');
				symbols = keyboard.getSymbolsFromKeys(editingKeys);
			};

			if (errorId == item.id) {
				cn.push('hasError');
				alert = <Icon className="alert" />;
			};

			onClickHandler = () => onClick(item);
			onContextHandler = () => onContext(item);
		};

		if (isEditing && !symbols.length) {
			buttons = <Label className="text" text={translate('popupShortcutPress')} />;
		} else
		if (symbols.length) {
			buttons = (
				<div className="symbols">
					{symbols.map((item: any, i: number) => <Symbol key={i} text={item} />)}
				</div>
			);
		} else 
		if (canEdit) {
			buttons = <Label className="text grey" text={translate('commonAdd')} />;
		} else 
		if (item.text) {
			buttons = <Label className="text" text={item.text} />;
		};

		return (
			<div 
				id={`item-${item.id}`}
				className={cn.join(' ')} 
				onClick={onClickHandler}
				onContextMenu={onContextHandler}
			>
				<div className="flex">
					{alert}
					<div className="name">{item.name}</div>
					{buttons}
				</div>
			</div>
		);
	};

	const onFilterChange = (value: string) => {
		setFilter(value);
	}; 

	const checkConflicts = (id: string, pressed: string[], callBack: (conflict: any) => void) => {
		const items = J.Shortcut.getItems();

		let conflict = null;

		for (const i in items) {
			const item = items[i];

			if (!item.keys || (item.id == id)) {
				continue;
			};

			if (U.Common.objectCompare(item.keys, pressed)) {
				setErrorId(id);
				conflict = item;
			};
		};

		callBack(conflict);
	};

	const clear = () => {
		setErrorId('');
		setEditingId('');
		setEditingKeys([]);

		window.clearTimeout(timeout.current);
		keyboard.setShortcutEditing(false);
		Renderer.send('initMenu');
	};

	useEffect(() => {
		return () => {
			clear();
			$(window).off('keyup.shortcut keydown.shortcut');
		};
	}, []);

	useEffect(() => {
		const win = $(window);
		const codeChecks = [ 'key', 'digit' ];
		const codes = new Set();
		const setTimeout = () => {
			window.clearTimeout(timeout.current);
			timeout.current = window.setTimeout(() => {
				checkConflicts(editingId, pressed, (conflict) => {
					if (!conflict) {
						Storage.updateShortcuts(editingId, pressed);
						clear();

						Preview.toastShow({ text: translate('popupShortcutToastSaved') });
						analytics.event('UpdateShortcut', { name: editingId });
						return;
					};

					const item = J.Shortcut.getItems()[editingId];

					let menuLabel = U.Common.sprintf(translate('popupShortcutConflict'), conflict.symbols.join(''), conflict.name);
					let options = [
						{ id: 'override', name: translate('popupShortcutOverride') },
						{ id: 'reset', name: translate('commonRemove') },
					];

					if (!conflict.id || conflict.noEdit) {
						menuLabel = U.Common.sprintf(translate('popupShortcutRestricted'), conflict.symbols.join(''));
						options = [ 
							{ id: 'reset', name: translate('commonOkay') },
						];
					};

					const reset = () => {
						Storage.updateShortcuts(editingId, item.keys || []);
						clear();
					};

					let updated = false;

					keyboard.setShortcutEditing(false);
					window.clearTimeout(timeout.current);

					S.Menu.open('select', {
						element: `#${getId()} #item-${editingId}`,
						horizontal: I.MenuDirection.Center,
						className: 'shortcutConflict',
						offsetY: -4,
						onClose: () => {
							if (!updated) {
								reset();
							};
						},
						data: {
							options,
							menuLabel,
							noVirtualisation: true,
							onSelect: (e, item) => {
								updated = true;

								switch (item.id) {
									case 'override': {
										Storage.updateShortcuts(editingId, pressed);
										Storage.updateShortcuts(conflict.id, []);
										clear();
										break;
									};

									case 'reset': {
										reset();
										break;
									};
								};
							}
						}
					});
				});
			}, 500);
		};

		let pressed = [];

		win.off('keyup.shortcut keydown.shortcut');
		keyboard.setShortcutEditing(!!editingId);

		if (!editingId) {
			return;
		};

		win.on('keydown.shortcut', (e: any) => {
			e.preventDefault();
			e.stopPropagation();

			const metaKeys = keyboard.metaKeys(e);
			const key = keyboard.eventKey(e);
			const which = e.which;
			const code = String(e.code || '').toLowerCase();
			const skip = [ Key.meta, Key.ctrl ];
			const special = [ 'comma' ];

			if (key == Key.escape) {
				clear();
				return;
			};

			if (metaKeys.length) {
				pressed = pressed.concat(metaKeys);
			};

			if (!skip.includes(key)) {
				let parsedCode = false;

				codeChecks.forEach(c => {
					if (codes.has(c)) {
						parsedCode = true;
						return;
					};

					if (code.startsWith(c)) {
						pressed.push(code.replace(c, ''));
						codes.add(c);
						parsedCode = true;
					};
				});

				for (const s of special) {
					if (which == J.Key[s]) {
						pressed.push(s);
						parsedCode = true;
					};
				};

				if (!parsedCode) {
					pressed.push(key);
				};
			};

			pressed = U.Common.arrayUnique(pressed);

			setEditingKeys(pressed);
			setTimeout();
		});

	}, [ editingId ]);

	useEffect(() => {
		$(bodyRef.current).scrollTop(0);
	}, [ page ]);

	if (filter) {
		const reg = new RegExp(U.Common.regexEscape(filter), 'gi');

		section.children = section.children.filter((s: any) => {
			s.children = s.children.filter((c: any) => {
				if (c.name && c.name.match(reg)) {
					return true;
				};

				for (const symbol of c.symbols || []) {
					if (symbol.match(reg)) {
						return true;
					};
				};

				for (const key of c.keys || []) {
					if (key.match(reg)) {
						return true;
					};
				};

				return false;
			});
			return s.children.length > 0;
		});
	};

	return (
		<>
			<div className="head">
				<div className="sides">
					<div className="side left">
						<Select 
							id={`${id}-section`} 
							options={sections} 
							value={page} 
							onChange={id => {
								setPage(id);
								analytics.event(U.Common.toUpperCamelCase(`ScreenShortcut-${id}`));
							}}
						/>
						<Label text={translate('popupShortcutDescription')} />
					</div>
					<div className="side right">
						<Icon id="icon-more" className="more withBackground" onClick={onMenu} />
						<Icon className="close withBackground" tooltipParam={{ text: translate('commonClose') }} onClick={() => close()} />
					</div>
				</div>
				<div className="filterWrap">
					<Filter className="outlined" onChange={onFilterChange} />
				</div>
			</div>

			<div ref={bodyRef} className="body customScrollbar">
				{(section.children || []).map((item: any, i: number) => (
					<Section key={i} {...item} />
				))}
			</div>
		</>
	);

});

export default PopupShortcut;
