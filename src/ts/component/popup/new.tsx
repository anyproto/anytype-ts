import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { I, Docs } from 'ts/lib';
import { commonStore } from 'ts/store';
import { observer } from 'mobx-react';

import Block from 'ts/component/page/help/item/block';

interface Props extends I.Popup, RouteComponentProps<any> {
	history: any;
};

class PopupNew extends React.Component<Props, {}> {
	
	render () {
		const path: any[] = [
			{ icon: ':question:', name: 'Help', contentId: 'index' }
		];

		return (
			<div className="wrapper">
				<div className="editor">
					<div className="blocks">
						{Docs.New.map((item: any, i: number) => (
							<Block key={i} {...this.props} {...item} />
						))}
					</div>
				</div>
			</div>
		);
	};
	
};

export default PopupNew;