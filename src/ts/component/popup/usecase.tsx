import * as React from 'react';
import { observer } from 'mobx-react';
import { I, U, Action } from 'Lib';

import PopupUsecasePageList from './page/usecase/list';
import PopupUsecasePageItem from './page/usecase/item';

const Components: any = {
	list: PopupUsecasePageList,
	item: PopupUsecasePageItem,
};

const PopupUsecase = observer(class PopupUsecase extends React.Component<I.PopupUsecase> {

	node = null;
	ref = null;

	constructor (props: I.PopupUsecase) {
		super(props);

		this.onPage = this.onPage.bind(this);
		this.getAuthor = this.getAuthor.bind(this);
		this.onAuthor = this.onAuthor.bind(this);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const page = data.page || 'list';

		let content = null;
		if (Components[page]) {
			const Component = Components[page];
			content = (
				<Component 
					ref={ref => this.ref = ref}
					{...this.props} 
					onPage={this.onPage} 
					getAuthor={this.getAuthor}
					onAuthor={this.onAuthor}
				/>
			);
		};

		return (
			<div 
				ref={ref => this.node = ref}
				className={[ 'page', U.Common.toCamelCase(`page-${page}`) ].join(' ')}
			>
				{content}
			</div>
		);
	};

	componentDidMount(): void {
		const { param } = this.props;
		const { data } = param;
		const { page } = data;

		this.onPage(page || 'list');
	};

	onPage (page: string, data?: any): void {
		const { param, getId } = this.props;
		const obj = $(`#${getId()}-innerWrap`);

		data = data || {};
		param.data = Object.assign(param.data, { ...data, page });

		obj.scrollTop(0);
	};

	getAuthor (author: string): string {
		if (!author) {
			return '';
		};

		let a: any = {};
		try { a = new URL(author); } catch (e) {};

		return String(a.pathname || '').replace(/^\//, '');
	};

	onAuthor (author: string): void {
		if (author) {
			Action.openUrl(author);
		};
	};

});

export default PopupUsecase;