import * as React from 'react';
import { observer } from 'mobx-react';
import { I, U, S } from 'Lib';

import PageType from './page/type';

interface State {
	page: string;
};

const Components = {
	type: PageType,
};

const SidebarRight = observer(class SidebarRight extends React.Component<{}, State> {
	
	private _isMounted = false;
	node = null;
	refChild = null;
	state = {
		page: '',
	};

	constructor (props) {
		super(props);

	};

    render() {
		const { showSidebarRight } = S.Common;
		const { page } = this.state;

		if (!showSidebarRight) {
			return null;
		};

		const Component = Components[page];
		const cn = [ 'sidebarPage', U.Common.toCamelCase(`page-${page}`) ];

        return (
			<div 
				ref={node => this.node = node}
				id="sidebarRight"
				className="sidebar right"
			>
				{Component ? (
					<div className={cn.join(' ')}>
						<Component ref={ref => this.refChild = ref} {...this.props} /> 
					</div>
				): ''}
			</div>
		);
    };

	componentDidMount (): void {
		this._isMounted = true;
	};

	componentDidUpdate (): void {
	};

	componentWillUnmount (): void {
		this._isMounted = false;
	};

	setPage (page: string): void {
		this.setState({ page });
	};

});

export default SidebarRight;