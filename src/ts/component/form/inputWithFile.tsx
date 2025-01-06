import React, { FC, useRef, useState, useEffect } from 'react';
import $ from 'jquery';
import raf from 'raf';
import { Icon, Input, Button } from 'Component';
import { I, J, keyboard, focus, translate, Action } from 'Lib';

interface Props {
	icon?: string;
	textUrl?: string;
	textFile?: string;
	withFile?: boolean;
	accept?: string[];
	block?: I.Block;
	readonly?: boolean;
	canResize?: boolean;
	onChangeUrl? (e: any, url: string): void;
	onChangeFile? (e: any, path: string): void;
};

const SMALL_WIDTH = 248;
const ICON_WIDTH = 60;

enum Size { Icon = 0, Small = 1, Full = 2 };

const InputWithFile: FC<Props> = ({
	icon = '',
	textUrl = translate('inputWithFileTextUrl'),
	textFile = '',
	withFile = true,
	accept,
	block,
	readonly = false,
	canResize = true,
	onChangeUrl,
	onChangeFile,
}) => {

	const [ isFocused, setIsFocused ] = useState(false);
	const [ size, setSize ] = useState(Size.Full);
	const nodeRef = useRef(null);
	const urlRef = useRef(null);
	const timeout = useRef(0);
	const cn = [ 'inputWithFile', 'resizable' ];
	const or = ` ${translate('commonOr')} `;
	const isSmall = size == Size.Small;
	const isIcon = size == Size.Icon;

	let placeholder = textUrl;
	let onClick = null;
	
	if (!withFile) {
		cn.push('noFile');
	};
	
	if (isSmall) {
		cn.push('isSmall');
	};

	if (readonly) {
		cn.push('isReadonly');
	};
	
	if (isIcon) {
		cn.push('isIcon');
		onClick = e => onClickFile(e);
	};
	
	if (isFocused) {
		cn.push('isFocused');
	};
	
	if (withFile && isFocused) {
		placeholder += or + (!isSmall ? textFile : '');
	};

	const rebind = () => {
		if (canResize) {
			$(nodeRef.current).off('resizeMove').on('resizeMove', () => resize());
		};
	};
	
	const unbind = () => {
		if (canResize) {
			$(nodeRef.current).off('resizeMove');
		};
	};
	
	const resize = () => {
		if (!canResize) {
			return;
		};

		raf(() => {
			const node = $(nodeRef.current);
			if (!node.length) {
				return;
			};

			const rect = (node.get(0) as HTMLInputElement).getBoundingClientRect();

			let s = Size.Full;
			if (rect.width <= SMALL_WIDTH) {
				s = Size.Small;
			};
			if (rect.width <= ICON_WIDTH) {
				s = Size.Icon;
			};

			if (s != size) {
				setSize(s);
			};
		});
	};
	
	const onFocusHandler = (e: any) => {
		e.stopPropagation();

		if (!readonly) {
			setIsFocused(true);
		};
	};
	
	const onBlurHandler = (e: any) => {
		e.stopPropagation();
		setIsFocused(false);
	};
	
	const onChangeUrlHandler = (e: any, force: boolean) => {
		if (readonly) {
			return;
		};
		
		window.clearTimeout(timeout.current);
		timeout.current = window.setTimeout(() => {
			if (!urlRef.current) {
				return;
			};
			
			const url = String(urlRef.current.getValue() || '');
			if (!url) {
				return;
			};
			
			if (onChangeUrl) {
				onChangeUrl(e, url);
			};
		}, force ? 50 : J.Constant.delay.keyboard);
	};
	
	const onClickFile = (e: any) => {
		e.preventDefault();
		e.stopPropagation();

		if (readonly) {
			return;
		};

		Action.openFileDialog({ extensions: accept }, paths => {
			if (onChangeFile) {
				onChangeFile(e, paths[0]);	
			};
		});
	};
	
	const onSubmit = (e: any) => {
		e.preventDefault();
		onChangeUrlHandler(e, true);
	};

	const onBlur = isFocused ? onBlurHandler : null;
	const onFocus = !isFocused ? onFocusHandler : null;

	useEffect(() => {
		resize();
		rebind();

		return () => {
			const { focused } = focus.state;

			unbind();

			if (focused == block.id) {
				keyboard.setFocus(false);
			};
		};
	}, []);

	useEffect(() => {
		resize();
		rebind();

		if (isFocused) {
			keyboard.setFocus(true);
			urlRef.current?.focus();
			focus.set(block.id, { from: 0, to: 0 });
		};

	}, [ isFocused, size ]);
	
	return (
		<div 
			ref={nodeRef}
			className={cn.join(' ')}
			onClick={onClick}
		>
			{icon ? <Icon className={icon} /> : ''}
		
			<div className="inputWithFile-inner">
				<form className="form" onSubmit={onSubmit}>
					{isFocused ? (
						<>
							<Input 
								ref={urlRef}
								placeholder={placeholder}
								onPaste={e => onChangeUrlHandler(e, true)} 
								onKeyDown={e => e.stopPropagation()}
								onFocus={onFocus} 
								onBlur={onBlur} 
							/>
							<Button type="input" className="dn" />
						</>
					) : (
						<span className="urlToggle" onClick={onFocusHandler}>{textUrl + (withFile && isSmall ? or : '')}</span>
					)}
				</form>

				{withFile ? (
					<span className="fileWrap" onMouseDown={onClickFile}>
						{!isSmall ? <span>&nbsp;{translate('commonOr')}&nbsp;</span> : ''}
						<span className="border">{textFile}</span>
					</span>
				) : ''}
			</div>
		</div>
	);
};

export default InputWithFile;