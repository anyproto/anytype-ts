import React, { forwardRef, useState, useEffect, useRef } from 'react';
import { Loader } from 'Component';
import { C, U } from 'Lib';

interface Props {
	url: string;
	position?: () => void;
};

interface Info {
	title: string;
	description: string;
	imageUrl: string;
};

const ALLOWED_SCHEME = [ 'http', 'https' ];

const PreviewLink = forwardRef<{}, Props>(({ url = '', position }, ref: any) => {

	const [ object, setObject ] = useState({} as Info);
	const [ isLoading, setIsLoading ] = useState(false);
	const { title, description, imageUrl } = object;
	const cn = [ 'previewLink' ];
	const urlRef = useRef('');

	if (imageUrl) {
		cn.push('withImage');
	};

	const load = () => {
		if (isLoading || (urlRef.current == url)) {
			return;
		};
		
		const scheme = U.Common.getScheme(url);

		if (scheme && !ALLOWED_SCHEME.includes(scheme)) {
			return;
		};

		urlRef.current = url;
		setIsLoading(true);

		C.LinkPreview(url, (message: any) => {
			setIsLoading(false);

			if (!message.error.code) {
				setObject(message.previewLink);
			} else {
				urlRef.current = '';
			};
		});
	};

	useEffect(() => {
		load();

		if (position) {
			position();
		};
	}, []);
	
	return (
		<div className={cn.join(' ')}>
			{isLoading ? <Loader /> : (
				<>
					<div className="info">
						<div className="link">{U.Common.shortUrl(url)}</div>
						{title ? <div className="name">{title}</div> : ''}
						{description ? <div className="descr">{description}</div> : ''}
					</div>
				</>
			)}
		</div>
	);

});

export default PreviewLink;