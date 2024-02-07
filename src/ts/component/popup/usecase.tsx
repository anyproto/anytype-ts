import * as React from 'react';
import { observer } from 'mobx-react';
import { I, UtilCommon } from 'Lib';

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
				/>
			);
		};

		return (
			<div 
				ref={ref => this.node = ref}
				className={[ 'page', UtilCommon.toCamelCase(`page-${page}`) ].join(' ')}
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
		data = data || {};
		this.props.param.data = Object.assign(this.props.param.data, { ...data, page });
	};

});

export default PopupUsecase;