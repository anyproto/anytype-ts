import React, { forwardRef, useState, useEffect, useRef, } from 'react';
import { Filter, Icon, Select, Label, } from 'Component';
import * as I from 'Interface';
import Storage from 'Lib/storage';

const PopupShortcut = forwardRef<{}, I.Popup>((props, ref) => {

	const { getId, close } = props;
	const [ page, setPage ] = useState('');
	const [ filter, setFilter ] = useState('');
	const [ dummy, setDummy ] = useState(0);
	const [ editingId, setEditingId ] = useState('');
	const [ errorId, setErrorId ] = useState('');
	const [ editingKeys, setEditingKeys ] = useState([]);
	const filterRef = useRef(null);
	const bodyRef = useRef(null);
	const sections = J.Shortcut.getSections();
	const current = page || sections[0].id;
	const section = U.Common.objectCopy(sections.find(it => it.id == current));
	const timeout = useRef(0);
	const keydownHandler = useRef<any>(null);
	const keyupHandler = useRef<any>(null);
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
			element: `#${getId()} #item-${U.Common.esc(item.id)}`,
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
							Renderer.send('initMenu');
							setDummy(dummy + 1);
							break;
						};

						case 'remove': {
							Storage.removeShortcut(item.id);
							Renderer.send('initMenu');
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
				alert = <Icon name="common/alert" color="red" />;
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
		window.setTimeout(() => {
			filterRef.current?.setRange({ from: 0, to: 0 });
		}, 50);

		return () => {
			clear();
			if (keyupHandler.current) {
				U.Dom.removeEvent(window, 'keyup', keyupHandler.current);
			};
			if (keydownHandler.current) {
				U.Dom.removeEvent(window, 'keydown', keydownHandler.current);
			};
		};
	}, []);

	useEffect(() => {
		const codeChecks = [ 'key', 'digit' ];
		const codes = new Set();
		const skip: string[] = [ Key.meta, Key.ctrl, Key.alt, Key.shift ];
		const setTimeout = (delay = 1500) => {
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

					let menuLabel = U.String.sprintf(translate('popupShortcutConflict'), conflict.symbols.join(''), conflict.name);
					let options: any[] = [
						{ id: 'override', name: translate('popupShortcutOverride') },
						{ id: 'reset', name: translate('commonRemove') },
					];

					if (!conflict.id || conflict.noEdit) {
						menuLabel = U.String.sprintf(translate('popupShortcutRestricted'), conflict.symbols.join(''));
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

					options.unshift({ name: menuLabel, isSection: true });

					S.Menu.open('select', {
						element: `#${getId()} #item-${U.Common.esc(editingId)}`,
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
			}, delay);
		};

		let pressed = [];

		if (keydownHandler.current) {
			U.Dom.removeEvent(window, 'keydown', keydownHandler.current);
		};
		if (keyupHandler.current) {
			U.Dom.removeEvent(window, 'keyup', keyupHandler.current);
		};
		keyboard.setShortcutEditing(!!editingId);

		if (!editingId) {
			return;
		};

		keydownHandler.current = (e: any) => {
			e.preventDefault();
			e.stopPropagation();

			const metaKeys = keyboard.metaKeys(e);
			const key = keyboard.eventKey(e);
			const which = e.which;
			const code = String(e.code || '').toLowerCase();
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

				if (!parsedCode && key) {
					pressed.push(key);
				};
			};

			pressed = U.Common.arrayUnique(pressed);

			setEditingKeys(pressed);

			// Save quickly once a non-modifier key completes the chord; otherwise wait
			// to give the user time to add the final key while only modifiers are held.
			const hasNonModifier = pressed.some((k: string) => !skip.includes(k));
			setTimeout(hasNonModifier ? 200 : 1500);
		};
		U.Dom.addEvent(window, 'keydown', keydownHandler.current);

	}, [ editingId ]);

	useEffect(() => {
		if (bodyRef.current) {
			bodyRef.current.scrollTop = 0;
		};
	}, [ page ]);

	if (filter) {
		const reg = new RegExp(U.String.regexEscape(filter), 'gi');

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
								analytics.event(U.String.toUpperCamelCase(`ScreenShortcut-${id}`));
							}}
						/>
						<Label text={translate('popupShortcutDescription')} />
					</div>
					<div className="side right">
						<Icon id="icon-more" name="common/more" className="more" withBackground={true} onClick={onMenu} />
						<Icon name="common/close" withBackground={true} tooltipParam={{ text: translate('commonClose') }} onClick={() => close()} />
					</div>
				</div>
				<div className="filterWrap">
					<Filter 
						ref={filterRef}
						className="outlined" 
						onChange={onFilterChange} 
						focusOnMount={true}
					/>
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