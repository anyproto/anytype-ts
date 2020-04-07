import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Label, Icon } from 'ts/component';
import { I, Docs } from 'ts/lib';
import { commonStore } from 'ts/store';
import { observer } from 'mobx-react';

import Block from 'ts/component/page/help/item/block';

interface Props extends I.Popup, RouteComponentProps<any> {
	history: any;
};

class PopupNew extends React.Component<Props, {}> {
	
	render () {
		return (
			<div className="wrapper">
				<div className="head">
					<div className="side left">
						<Label text="What’s new?" />
					</div>
					<div className="side right">
						<Label text="Stay tuned for Anytype’s news " />
						<Icon className="telegram" />
						<Icon className="twitter" />
					</div>
				</div>
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