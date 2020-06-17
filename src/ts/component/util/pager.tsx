import * as React from 'react';

interface Props {
	offset: number;
	limit: number;
	total: number;
	pageLimit?: number;
	onChange?: (page: number) => void;
};

class Pager extends React.Component<Props, {}> {

	defaultProps = {
		pageLimit: 10,
	};

	constructor (props: any) {
		super(props);
	};
	
	render () {
		const { pageLimit, offset, limit, total } = this.props;
		const pages = Math.ceil(total / limit);
		
		let page = Math.ceil(offset / limit) + 1;
		let start = Math.max(1, page - pageLimit);
		let end = Math.min(pages, page + pageLimit - 1);
		let items = [];

		for (let i = start; i <= end ; ++i) {
			items.push({ id: i });
		};
		
		const Item = (item) => (
			<div className={'page ' + (item.id == page ? 'active' : '')} onMouseDown={() => { this.onChange(item.id); }}>
				{item.id}
			</div>
		);
		
		if (items.length > 1) {
			return (
				<div className="pager">
					{items.map((item, i) => {
						return <Item key={i} {...item} />;
					})}
					{end < pages ? (
						<span>
							...
							<Item id={pages} />
						</span>
					) : ''}
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