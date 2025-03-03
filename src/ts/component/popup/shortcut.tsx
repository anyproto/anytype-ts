import React, { forwardRef, useState, useEffect, useRef } from 'react';
import $ from 'jquery';
import { Filter, Icon, Select, Label, Error } from 'Component';
import { I, U, J, S, translate, keyboard, Key, Storage, Renderer, Action } from 'Lib';

const PopupShortcut = forwardRef<{}, I.Popup>((props, ref) => {

	const { getId, close } = props;
	const { config } = S.Common;
	const [ page, setPage ] = useState('');
	const [ filter, setFilter ] = useState('');
	const [ dummy, setDummy ] = useState(0);
	const [ editingId, setEditingId ] = useState('');
	const [ editingKeys, setEditingKeys ] = useState([]);
	const bodyRef = useRef(null);
	const sections = J.Shortcut.getSections();
	const current = page || sections[0].id;
	const section = U.Common.objectCopy(sections.find(it => it.id == current));
	const timeout = useRef(0);
	const error = useRef({});
	const id = getId();

	const onClick = (item: any) => {
		setEditingId(item.id);
	};

	const onMenu = () => {
		const options = [
			{ id: 'export', name: translate('popupShortcutExport') },
			{ id: 'import', name: translate('popupShortcutImport') },
			{ id: 'reset', name: translate('popupShortcutReset') },
		];

		S.Menu.open('select', {
			element: `#${getId()} #icon-more`,
			horizontal: I.MenuDirection.Center,
			data: {
				options,
				onSelect: (e: any, item: any) => {
					switch (item.id) {
						case 'export': {
							Action.openDirectoryDialog({}, paths => {
								if (paths.length) {
									Renderer.send('shortcutExport', paths[0], Storage.getShortcuts());
								};
							});
							break;
						};

						case 'import': {
							Action.openFileDialog({ extensions: [ 'json' ] }, paths => {
								if (paths.length) {
									Renderer.send('shortcutImport', paths[0]).then((data: any) => {
										Storage.setShortcuts(data || {});
										setDummy(dummy + 1);
									});
								};
							});
							break;
						};

						case 'reset': {
							Storage.resetShortcuts();
							setDummy(dummy + 1);
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
		const canEdit = item.id && !item.noEdit && config.experimental;

		let symbols = item.symbols || [];
		let onClickHandler = () => {};

		if (canEdit) {
			cn.push('canEdit');

			if (editingId == item.id) {
				cn.push('isEditing');
				symbols = keyboard.getSymbolsFromKeys(editingKeys);
			};

			if (error.current[item.id]) {
				cn.push('hasError');
			};

			onClickHandler = () => onClick(item);
		};

		return (
			<div className={cn.join(' ')} onClick={onClickHandler}>
				<div className="flex">
					<div className="name">{item.name}</div>
					{symbols.length ? (
						<div className="symbols">
							{symbols.map((item: any, i: number) => <Symbol key={i} text={item} />)}
						</div>
					) : ''}
					{item.text ? <Label className="text" text={item.text} /> : ''}
				</div>
				{error.current[item.id] ? <Error text={error.current[item.id]} /> : ''}
			</div>
		);
	};

	const onFilterChange = (value: string) => {
		setFilter(value);
	}; 

	const checkConflicts = (id: string, pressed: string[]) => {
		const items = J.Shortcut.getItems();

		for (const i in items) {
			const item = items[i];

			if (!item.keys) {
				continue;
			};

			const isEqual = U.Common.objectCompare(item.keys, pressed);
			if (isEqual) {
				error.current[id] = U.Common.sprintf(item.id ? translate('popupShortcutResetKey') : translate('popupShortcutConflict'), item.name);
				if (item.id) {
					Storage.updateShortcuts(item.id, []);
				};

				setDummy(dummy + 1);
			};
		};
	};

	useEffect(() => {

		return () => {
			window.clearTimeout(timeout.current);
			keyboard.setShortcutEditing(false);
		};

	}, []);

	useEffect(() => {
		const win = $(window);
		const setTimeout = () => {
			window.clearTimeout(timeout.current);
			timeout.current = window.setTimeout(() => {
				keyboard.initShortcuts();
				setEditingId('');
			}, 2000);
		};

		win.off('keyup.shortcut keydown.shortcut');
		keyboard.setShortcutEditing(!!editingId);

		if (editingId) {
			let pressed = [];

			win.on('keydown.shortcut', (e: any) => {
				e.preventDefault();
				e.stopPropagation();

				const metaKeys = keyboard.metaKeys(e);
				const key = keyboard.eventKey(e);
				const code = String(e.code || '').toLowerCase();
				const skip = [ Key.meta, Key.ctrl ];

				if (key == Key.escape) {
					setEditingId('');
					window.clearTimeout(timeout.current);
					return;
				};

				if (metaKeys.length) {
					pressed = pressed.concat(metaKeys);
				};

				if (!skip.includes(key)) {
					if (code.startsWith('key')) {
						pressed.push(code.replace('key', ''));
					} else 
					if (code.startsWith('digit')) {
						pressed.push(code.replace('digit', ''));
					} else {
						pressed.push(key);
					};
				};

				pressed = U.Common.arrayUnique(pressed);

				checkConflicts(editingId, pressed);

				Storage.updateShortcuts(editingId, pressed);
				setEditingKeys(pressed);
				setTimeout();
			});
		};

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
						<Select id={`${id}-section`} options={sections} value={page} onChange={id => setPage(id)} />
					</div>
					<div className="side right">
						{config.experimental ? <Icon id="icon-more" className="more withBackground" onClick={onMenu} /> : ''}
						<Icon className="close withBackground" tooltip={translate('commonClose')} onClick={() => close()} />
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