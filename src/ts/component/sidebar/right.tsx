import * as React from 'react';
import { observer } from 'mobx-react';
import { U, S } from 'Lib';

import PageType from './page/type';
import PageObjectRelation from './page/object/relation';

interface Props {
	isPopup?: boolean;
};

interface State {
	page: string;
	rootId: string;
	details: any;
	readonly: boolean;
	noPreview: boolean;
};

const Components = {
	'type': PageType,
	'object/relation': PageObjectRelation,
};

const SidebarRight = observer(class SidebarRight extends React.Component<Props, State> {
	
	node = null;
	refChild = null;
	state = {
		page: '',
		rootId: '',
		details: {},
		readonly: false,
		noPreview: false,
	};

    render () {
		const { isPopup } = this.props;
		const showSidebarRight = S.Common.getShowSidebarRight(isPopup);

		if (!showSidebarRight) {
			return null;
		};

		const { page, rootId, details, readonly, noPreview } = this.state;
		const Component = Components[page];
		const cn = [ 'sidebar', 'right' ];
		const cnp = [ 'sidebarPage', U.Common.toCamelCase(`page-${page.replace(/\//g, '-')}`) ];
		const withPreview = [ 'type' ].includes(page);

		if (withPreview) {
			cn.push('withPreview');
		};

        return (
			<div 
				ref={node => this.node = node}
				id="sidebarRight"
				className={cn.join(' ')}
			>
				{Component ? (
					<div className={cnp.join(' ')}>
						<Component 
							ref={ref => this.refChild = ref} 
							{...this.props} 
							rootId={rootId}
							details={details}
							readonly={readonly}
							noPreview={noPreview}
						/> 
					</div>
				): ''}
			</div>
		);
    };

	componentDidUpdate (): void {
		this.refChild?.forceUpdate();	
	};

});

export default SidebarRight;
