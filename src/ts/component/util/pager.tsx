import React, { FC } from 'react';
import { Icon } from 'Component';

interface Props {
	offset: number;
	limit: number;
	total: number;
	isShort?: boolean;
	pageLimit?: number;
	onChange?: (page: number) => void;
};

const Pager: FC<Props> = ({ 
	offset = 0, 
	limit = 0, 
	total = 0, 
	isShort = false, 
	pageLimit = 10, 
	onChange,
}) => {

	offset = Number(offset) || 0;
	total = Number(total) || 0;

	const pages = Math.ceil(total / limit);
	const page = Math.ceil(offset / limit) + 1;
	const cn = [ 'pager' ];
	const cnl = [ 'arrow', 'left' ];
	const cnel = [ 'arrow', 'left', 'end' ];
	const cnr = [ 'arrow', 'right' ];
	const cner = [ 'arrow', 'right', 'end' ];

	if (page == 1) {
		cnl.push('disabled');
		cnel.push('disabled');
	};

	if (page == pages) {
		cnr.push('disabled');
		cner.push('disabled');
	};

	if (isShort) {
		cn.push('isShort');
	};

	let startPage = null; 
	let endPage = null;
	let list = null;
	let pageCnt = Math.ceil(pageLimit / 2);

	if (page < pageCnt) {
		pageCnt = pageLimit - page;
	};

	const start = Math.max(1, page - pageCnt);
	const end = Math.min(pages, page + pageCnt);
	const items = [];

	for (let i = start; i <= end ; i++) {
		items.push({ id: i });
	};

	const Item = (item) => {
		const cn = [ 'pageItem' ];

		if (item.id == page) {
			cn.push('active');
		};

		return (
			<div className={cn.join(' ')} onClick={() => onChangeHandler(item.id)}>
				{item.id}
			</div>
		);
	};

	const onChangeHandler = (page: number) => {
		const pages = Math.ceil(total / limit);

		page = Math.max(1, page);
		page = Math.min(pages, page);
		
		onChange(page);
	};

	if (!isShort && (start > 1)) {
		startPage = (
			<>
				<Item id="1" />
				<div className="dots">...</div>
			</>
		);
	};

	if (!isShort && (end < pages)) {
		endPage = (
			<>
				<div className="dots">...</div>
				<Item id={pages} />
			</>
		);
	};

	if (isShort) {
		list = <div className="pageItem list">{page} of {pages}</div>;
	} else {
		list = (
			<>
				{items.map((item, i) => (
					<Item key={i} {...item} />
				))}
			</>
		);
	};
	
	if (items.length <= 1) {
		return null;
	};

	return (
		<div className={cn.join(' ')}>
			{isShort ? <Icon className={cnel.join(' ')} onClick={() => onChangeHandler(1)} /> : ''}
			<Icon className={cnl.join(' ')} onClick={() => onChangeHandler(page - 1)} />
			
			{startPage}
			{list}
			{endPage}

			<Icon className={cnr.join(' ')} onClick={() => onChangeHandler(page + 1)} />
			{isShort ? <Icon className={cner.join(' ')} onClick={() => onChangeHandler(pages)} /> : ''}
		</div>
	);

};

export default Pager;