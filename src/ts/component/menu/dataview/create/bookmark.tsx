import React, { forwardRef, useRef, useState, useEffect } from 'react';
import { Input, Button, Loader, Icon } from 'Component';
import { I, C, S, U, translate, analytics } from 'Lib';

const MenuDataviewCreateBookmark = forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, close } = props;
	const inputRef = useRef(null);
	const buttonRef = useRef(null);
	const [ isLoading, setIsLoading ] = useState(false);
	const { data } = param;
	const { value } = data;

	const rebind = () => {
		unbind();
		$(window).on('keydown.menu', e => {});
	};

	const unbind = () => {
		$(window).off('keydown.menu');
	};

	const onSubmit = (e: any) => {
		e.preventDefault();

		const { data } = param;
		const { onSubmit, route } = data;
		const value = inputRef.current.getValue();
		const details = data.details || {};
		const bookmark = S.Record.getBookmarkType();

		if (!value) {
			return;
		};

		setIsLoading(true);

		C.ObjectCreateBookmark({ ...details, source: value }, S.Common.space, bookmark?.defaultTemplateId, (message: any) => {
			setIsLoading(false);

			if (message.error.code) {
				S.Popup.open('confirm', {
					data: {
						title: translate('menuDataviewCreateSomethingWentWrong'),
						text: translate('menuObjectContextTryAgain'),
						textConfirm: translate('commonOk'),
						canCancel: false,
					},
				});
			} else {
				const object = message.details;

				if (onSubmit) {
					onSubmit(object);
				};

				analytics.createObject(object.type, object.layout, route, message.middleTime);
				close();
			};
		});
	};

	const onChange = (e: any, v: string) => {
		$(buttonRef.current.getNode()).toggleClass('hide', !v);
	};

	useEffect(() => {
		rebind();
		$(buttonRef.current.getNode()).addClass('hide');

		return () => unbind();
	}, []);

	return (
		<form onSubmit={onSubmit} className="form">
			{isLoading ? <Loader /> : ''}

			<Icon className="link" />

			<Input 
				ref={inputRef} 
				value={value} 
				placeholder={translate('commonPasteLink')} 
				focusOnMount={true}
				onKeyDown={onChange}
				onKeyUp={onChange}
			/>

			<div className="buttons">
				<Button ref={buttonRef} type="input" color="blank" text={translate('commonCreate')} onClick={onSubmit} />
			</div>
		</form>
	);

});

export default MenuDataviewCreateBookmark;