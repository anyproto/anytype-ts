import React, { forwardRef, useEffect, useRef } from 'react';

import PopupUsecasePageList from './page/usecase/list';
import PopupUsecasePageItem from './page/usecase/item';
import * as I from 'Interface';

const Components: any = {
	list: PopupUsecasePageList,
	item: PopupUsecasePageItem,
};

const PopupUsecase = forwardRef<{}, I.PopupUsecase>((props, ref) => {

	const { param, getId } = props;
	const { data } = param;
	const page = data.page || 'list';
	const nodeRef = useRef(null);
	const componentRef = useRef(null);

	const onPage = (page: string, data?: any): void => {
		const obj = U.Dom.get(`${getId()}-innerWrap`);

		data = data || {};
		param.data = Object.assign(param.data, { ...data, page });

		if (obj) {
			obj.scrollTop = 0;
		};
	};

	const getAuthor = (author: string): string => {
		if (!author) {
			return '';
		};

		let a: any = {};
		try { a = new URL(author); } catch (e) {};

		return String(a.pathname || '').replace(/^\//, '');
	};

	const onAuthor = (author: string): void => {
		if (author) {
			Action.openUrl(author);
		};
	};

	useEffect(() => {
		onPage(page);
	}, []);

	let content = null;

	if (Components[page]) {
		const Component = Components[page];

		content = (
			<Component 
				ref={componentRef}
				{...props} 
				onPage={onPage} 
				getAuthor={getAuthor}
				onAuthor={onAuthor}
			/>
		);
	};

	return (
		<div 
			ref={nodeRef}
			className={[ 'page', U.String.toCamelCase(`page-${page}`) ].join(' ')}
		>
			{content}
		</div>
	);

});

export default PopupUsecase;