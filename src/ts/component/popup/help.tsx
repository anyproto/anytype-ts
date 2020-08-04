import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Label, Icon } from 'ts/component';
import { I, Docs, Storage, Util } from 'ts/lib';
import Block from 'ts/component/block/help';

interface Props extends I.Popup, RouteComponentProps<any> {
	history: any;
};

const Url = require('json/url.json');
const { ipcRenderer } = window.require('electron');

class PopupHelp extends React.Component<Props, {}> {
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { document } = data;
		const doc = Docs.Help[Util.toUpperCamelCase(document)] || [];
		const title = doc.find((it: any) => { return it.type == I.BlockType.Title; });

		return (
			<div className="wrapper">
				<div className="head">
					<div className="side left">
						{title ? <Label text={title.text} /> : ''}
					</div>
					{document == 'whatsNew' ? (
						<div className="side right">
							<Label text="Stay tuned for Anytype’s news " />
							<Icon onClick={(e) => { this.onUrl(Url.telegram); }} className="telegram" />
							<Icon onClick={(e) => { this.onUrl(Url.twitter); }} className="twitter" />
						</div>
					) : ''}
				</div>
				
				<div className="editor help">
					<div className="blocks">
						{doc.map((item: any, i: number) => (
							<Block key={i} {...this.props} {...item} />
						))}
					</div>
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		const { param } = this.props;
		const { data } = param;
		const { document } = data;
		
		if (document == 'whatsNew') {
			Storage.set('popupNewBlock', 1);
		};
	};
	
	onUrl (url: string) {
		ipcRenderer.send('urlOpen', url);
	};
	
};

export default PopupHelp;