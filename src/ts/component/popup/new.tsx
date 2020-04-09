import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Label, Icon } from 'ts/component';
import { I, Docs, Storage } from 'ts/lib';
import { commonStore } from 'ts/store';
import { observer } from 'mobx-react';

import Block from 'ts/component/page/help/item/block';

interface Props extends I.Popup, RouteComponentProps<any> {
	history: any;
};

const Url = require('json/url.json');
const { ipcRenderer } = window.require('electron');

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
						<Icon onClick={(e) => { this.onUrl(Url.telegram); }} className="telegram" />
						<Icon onClick={(e) => { this.onUrl(Url.twitter); }} className="twitter" />
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
	
	componentDidMount () {
		Storage.set('popupNewBlock', 1);
	};
	
	onUrl (url: string) {
		ipcRenderer.send('urlOpen', url);
	};
	
};

export default PopupNew;