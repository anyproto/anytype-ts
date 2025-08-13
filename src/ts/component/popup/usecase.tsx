import React, { forwardRef, useEffect, useRef } from 'react';
import { observer } from 'mobx-react';
import { I, U, Action } from 'Lib';

import PopupUsecasePageList from './page/usecase/list';
import PopupUsecasePageItem from './page/usecase/item';

const Components: any = {
	list: PopupUsecasePageList,
	item: PopupUsecasePageItem,
};

const PopupUsecase = observer(forwardRef<{}, I.PopupUsecase>((props, ref) => {

	const { param, getId } = props;
	const { data } = param;
	const page = data.page || 'list';
	const nodeRef = useRef(null);
	const componentRef = useRef(null);

	const onPage = (page: string, data?: any): void => {
		const obj = $(`#${getId()}-innerWrap`);

		data = data || {};
		param.data = Object.assign(param.data, { ...data, page });

		obj.scrollTop(0);
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
			className={[ 'page', U.Common.toCamelCase(`page-${page}`) ].join(' ')}
		>
			{content}
		</div>
	);

}));

export default PopupUsecase;