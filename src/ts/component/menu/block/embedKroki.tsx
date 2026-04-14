import React, { forwardRef, useRef, useEffect, useImperativeHandle } from 'react';
import { Editable, Select, Button } from 'Component';
import * as I from 'Interface';

let _pako: any = null;
let _pakoLoading: Promise<any> | null = null;

const getPako = async (): Promise<any> => {
	if (_pako) return _pako;
	if (!_pakoLoading) {
		_pakoLoading = import('pako').then(m => { _pako = m.default || m; return _pako; });
	};
	return _pakoLoading;
};

const KROKI_URL_REGEX = /^https:\/\/kroki\.io\/([^\/]+)\/svg\/(.+)$/;

const decodeKrokiUrl = async (url: string): Promise<{ type: string; code: string }> => {
	const m = String(url || '').match(KROKI_URL_REGEX);
	if (!m) {
		return { type: '', code: '' };
	};

	const [ , type, payload ] = m;

	try {
		const pako = await getPako();
		const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
		const binary = atob(b64);
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) {
			bytes[i] = binary.charCodeAt(i);
		};
		const code = new TextDecoder().decode(pako.inflate(bytes));
		return { type, code };
	} catch (e) {
		return { type, code: '' };
	};
};

const encodeKrokiUrl = async (type: string, code: string): Promise<string> => {
	const pako = await getPako();
	const compressed = pako.deflate(new TextEncoder().encode(code), { level: 9 });
	const result = btoa(U.Common.uint8ToString(compressed)).replace(/\+/g, '-').replace(/\//g, '_');
	return `https://kroki.io/${type}/svg/${result}`;
};

const MenuBlockEmbedKroki = forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, position, close } = props;
	const { data } = param;
	const { value, onChange } = data;

	const inputRef = useRef(null);
	const selectRef = useRef(null);
	const typeRef = useRef<string>(U.Embed.getKrokiOptions()[0].id);
	const initialCodeRef = useRef<string>('');
	const initialTypeRef = useRef<string>('');
	const readyRef = useRef<boolean>(false);
	const savedRef = useRef<boolean>(false);

	useEffect(() => {
		(async () => {
			if (value) {
				const decoded = await decodeKrokiUrl(value);
				if (decoded.type) {
					typeRef.current = decoded.type;
					initialTypeRef.current = decoded.type;
					selectRef.current?.setValue(decoded.type);
				};
				if (decoded.code) {
					initialCodeRef.current = decoded.code;
					inputRef.current?.setValue(U.String.htmlSpecialChars(decoded.code));
					inputRef.current?.placeholderCheck?.();
				};
			};
			readyRef.current = true;
			inputRef.current?.setFocus();
		})();

		return () => {
			save();
		};
	}, []);

	const getCode = (): string => {
		return String(inputRef.current?.getTextValue() || '');
	};

	const save = async () => {
		if (savedRef.current || !readyRef.current) {
			return;
		};
		savedRef.current = true;

		const code = getCode().trim();
		const typeUnchanged = (typeRef.current === initialTypeRef.current) || !initialTypeRef.current;

		if ((code === initialCodeRef.current.trim()) && typeUnchanged) {
			return;
		};

		if (!code) {
			onChange?.('');
			return;
		};

		const url = await encodeKrokiUrl(typeRef.current, code);
		onChange?.(url);
	};

	const onInput = () => {
		position();
	};

	const onPaste = (e: any) => {
		e.preventDefault();

		const text = String(e.clipboardData?.getData('text/plain') || '');
		if (!text) {
			return;
		};

		const detected = U.Embed.getKrokiType(text);
		if (detected && (detected != typeRef.current)) {
			typeRef.current = detected;
			selectRef.current?.setValue(detected);
		};

		const current = getCode();
		const range = inputRef.current?.getRange?.() || { from: current.length, to: current.length };
		const next = U.String.insert(current, text, range.from, range.to);
		const to = range.from + text.length;

		inputRef.current?.setValue(U.String.htmlSpecialChars(next));
		inputRef.current?.setRange({ from: to, to });
		inputRef.current?.placeholderCheck?.();

		position();
	};

	const onTypeChange = (v: string) => {
		typeRef.current = v;
		inputRef.current?.setFocus();
	};

	const onSave = async () => {
		await save();
		close();
	};

	useImperativeHandle(ref, () => ({
		getItems: () => [],
		getIndex: () => -1,
		setIndex: () => {},
	}), []);

	return (
		<div className="innerWrapper">
			<div className="selectWrap">
				<Select
					id="kroki-type"
					ref={selectRef}
					value={typeRef.current}
					options={U.Embed.getKrokiOptions()}
					arrowClassName="light"
					onChange={onTypeChange}
					showOn="mouseDown"
					noFilter={false}
					menuParam={{ classNameWrap: 'fromBlock' }}
				/>
			</div>
			<div className="inputWrapper">
				<Editable
					ref={inputRef}
					id="input"
					placeholder={U.String.sprintf(translate('blockEmbedPlaceholder'), 'Kroki')}
					onInput={onInput}
					onPaste={onPaste}
				/>
			</div>
			<div className="buttons">
				<Button text={translate('commonSave')} className="c28" onClick={onSave} />
			</div>
		</div>
	);

});

export default MenuBlockEmbedKroki;
