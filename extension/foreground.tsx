import * as React from 'react';

class Foreground extends React.Component {

	render () {
		/* @ts-ignore */
		const url = chrome.runtime.getURL('iframe/index.html');	
		const style: any = {
			position: 'fixed',
			zIndex: 10000,
			width: 800,
			height: 600,
			background: '#fff',
			borderRadius: 12,
			left: '50%',
			top: '50%',
			marginTop: -300,
			marginLeft: -400,
			border: 0,
			boxShadow: '0px 2px 28px rgba(0, 0, 0, 0.2)',
		};

		return (
			<iframe src={url} style={style} />
		);
	};

};

export default Foreground;