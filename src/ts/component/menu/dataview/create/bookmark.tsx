import React, { forwardRef, useRef, useState, useEffect } from 'react';
import { Input, Button, Loader, Icon, Error } from 'Component';
import { I, C, S, U, translate, analytics } from 'Lib';

const MenuDataviewCreateBookmark = forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, close } = props;
	const inputRef = useRef(null);
	const buttonRef = useRef(null);
	const [ isLoading, setIsLoading ] = useState(false);
	const [ preview, setPreview ] = useState(null);
	const [ error, setError ] = useState('');
	const { data } = param;
	const { value } = data;
	const cn = [ 'form' ];

	if (preview) {
		cn.push('withPreview');
	};

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

		C.ObjectCreateFromUrl(details, S.Common.space, bookmark?.uniqueKey, value, true, bookmark?.defaultTemplateId, (message: any) => {
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
		if (isLoading) {
			return;
		};

		$(buttonRef.current.getNode()).toggleClass('hide', !v);

		const url = U.Common.matchUrl(v);

		if (url) {
			if (preview && (url == preview.originalUrl)) {
				return;
			};

			setIsLoading(true);

			C.LinkPreview(url, (message: any) => {
				setIsLoading(false);

				if (message.error.code) {
					setError(message.error.description);
				} else {
					setPreview({ ...message.previewLink, originalUrl: url });
				};
			});
		} else {
			setPreview(null);
		};
	};

	useEffect(() => {
		rebind();
		$(buttonRef.current.getNode()).addClass('hide');

		return () => unbind();
	}, []);

	return (
		<form onSubmit={onSubmit} className={cn.join(' ')}>
			{isLoading ? <Loader /> : ''}

			<div className="inputWrap">
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
			</div>

			<Error text={error} />

			{preview ? (
				<div className="previewWrap">
					<div className="pic" style={{ backgroundImage: `url("${preview.imageUrl}")` }} />
					<div className="info">
						<div className="name">{preview.title}</div>
						<div className="descr">{preview.description}</div>
					</div>
				</div>
			) : ''}
		</form>
	);

});

export default MenuDataviewCreateBookmark;