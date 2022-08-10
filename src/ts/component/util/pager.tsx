import * as React from 'react';
import { Icon } from 'Component';

interface Props {
	offset: number;
	limit: number;
	total: number;
	isShort?: boolean;
	pageLimit?: number;
	onChange?: (page: number) => void;
};

class Pager extends React.Component<Props, {}> {

	public static defaultProps = {
		pageLimit: 10,
	};

	constructor (props: any) {
		super(props);
	};
	
	render () {
		const { pageLimit, limit, isShort } = this.props;
		
		let offset = Number(this.props.offset) || 0;
		let total = Number(this.props.total) || 0;
		let pages = Math.ceil(total / limit);
		let pageCnt = Math.ceil(pageLimit / 2);
		let page = Math.ceil(offset / limit) + 1;

		if (page < pageCnt) {
			pageCnt = pageLimit - page;
		};

		let start = Math.max(1, page - pageCnt);
		let end = Math.min(pages, page + pageCnt);
		let items = [];

		for (let i = start; i <= end ; ++i) {
			items.push({ id: i });
		};

		const Item = (item) => (
			<div className={'pageItem ' + (item.id == page ? 'active' : '')} onClick={() => { this.onChange(item.id); }}>
				{item.id}
			</div>
		);

		let startPage = null; 
		let endPage = null;
		let list = null;
		
		if (!isShort && (start > 1)) {
			startPage = (
				<React.Fragment>
					<Item id="1" />
					<div className="dots">...</div>
				</React.Fragment>
			);
		};

		if (!isShort && (end < pages)) {
			endPage = (
				<React.Fragment>
					<div className="dots">...</div>
					<Item id={pages} />
				</React.Fragment>
			);
		};

		if (isShort) {
			list = <div className="pageItem list">{page} of {pages}</div>;
		} else {
			list = (
				<React.Fragment>
					{items.map((item, i) => (
						<Item key={i} {...item} />
					))}
				</React.Fragment>
			);
		};
		
		if (items.length > 1) {
			return (
				<div className={[ 'pager', (isShort ? 'isShort' : '') ].join(' ')}>
					{isShort ? <Icon className={[ 'arrow', 'end', 'left', (page == 1 ? 'disabled' : '') ].join(' ')} onClick={() => { this.onChange(1); }} /> : ''}
					<Icon className={[ 'arrow', 'left', (page == 1 ? 'disabled' : '') ].join(' ')} onClick={() => { this.onChange(page - 1); }} />
					
					{startPage}
					{list}
					{endPage}

					<Icon className={[ 'arrow', 'right', (page == pages ? 'disabled' : '') ].join(' ')} onClick={() => { this.onChange(page + 1); }} />
					{isShort ? <Icon className={[ 'arrow', 'end', 'right', (page == pages ? 'disabled' : '') ].join(' ')} onClick={() => { this.onChange(pages); }} /> : ''}
				</div>
			);
		} else {
			return null;
		};
	};
	
	onChange (page) {
		const { onChange, limit, total } = this.props;
		const pages = Math.ceil(total / limit);

		page = Math.max(1, page);
		page = Math.min(pages, page);
		
		onChange(page);
	};
	
};

export default Pager;