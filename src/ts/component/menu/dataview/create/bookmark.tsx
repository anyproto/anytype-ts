import React, { forwardRef, useRef, useState, useEffect } from 'react';
import { Input, Button, Loader, Icon, Error, Switch, Label } from 'Component';
import { I, C, S, U, J, translate, analytics } from 'Lib';

const MenuDataviewCreateBookmark = forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, close } = props;
	const inputRef = useRef(null);
	const [ isLoading, setIsLoading ] = useState(false);
	const [ preview, setPreview ] = useState(null);
	const [ error, setError ] = useState('');
	const [ withContent, setWithContent ] = useState(true);
	const { data } = param;
	const { value } = data;
	const cn = [ 'form' ];
	const timeout = useRef(0);

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
		const value = inputRef.current.getValue().trim();
		const details = data.details || {};
		const bookmark = S.Record.getBookmarkType();

		console.log('onSubmit', value, details, bookmark);

		if (!value) {
			return;
		};

		setIsLoading(true);

		C.ObjectCreateFromUrl(details, S.Common.space, bookmark?.uniqueKey, value, withContent, bookmark?.defaultTemplateId, (message: any) => {
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
		v = String(v || '').trim();

		if (isLoading) {
			return;
		};

		window.clearTimeout(timeout.current);
		timeout.current = window.setTimeout(() => {
			const scheme = U.Common.getScheme(v);
			if (!scheme) {
				v = `http://${v}`;
			};

			const url = U.Common.matchUrl(v);

			if (url) {
				if (preview && (url == preview.originalUrl)) {
					return;
				};

				setIsLoading(true);

				C.LinkPreview(url, (message: any) => {
					setIsLoading(false);

					if (message.error.code) {
						setError(translate('menuDataviewCreateBookmarkError'));
					} else {
						setPreview({ ...message.previewLink, originalUrl: url });
						setError('');
					};
				});
			} else {
				setPreview(null);
				setError('');
			};
		}, J.Constant.delay.keyboard);
	};

	useEffect(() => {
		rebind();
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
			</div>

			<Error text={error} />

			{preview ? (
				<>
					<div className="previewWrap">
						{preview.imageUrl ?	<div className="pic" style={{ backgroundImage: `url("${preview.imageUrl}")` }} /> : ''}
						<div className="info">
							<div className="name">{preview.title}</div>
							<div className="descr">{preview.description}</div>
						</div>
					</div>

					<div className="bottom">
						<div className="side left">
							<Switch
								value={withContent}
								onChange={(e: any, v: boolean) => setWithContent(v)}
							/>
							<Label text={translate('menuDataviewCreateBookmarkContent')} />
						</div>
						<div className="side right">
							<Button type="input" className="c28" text={translate('commonCreate')} onClick={onSubmit} />
						</div>
					</div>
				</>
			) : ''}
		</form>
	);

});

export default MenuDataviewCreateBookmark;