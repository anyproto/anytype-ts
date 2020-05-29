import * as React from 'react';
import { I } from 'ts/lib';

const { ipcRenderer } = window.require('electron');

interface Props extends I.Cell {};

class CellLink extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
	};

	render () {
		let { relation, data } = this.props;
		let href = data;
		
		switch (relation.type) {
			case I.RelationType.Email:
				href = 'mailto:' + data;
				break;
				
			case I.RelationType.Phone:
				href = 'tel:' + data;
				break;
		};
		
		return (
			<a onClick={(e: any) => { this.onClick(e, href); }}>{data}</a>
		);
	};
	
	onClick (e: any, url: string) {
		e.preventDefault();
		ipcRenderer.send('urlOpen', url);
	};
	
};

export default CellLink;