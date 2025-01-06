import React, { forwardRef, useState } from 'react';
import { I, U, J } from 'Lib';

const PopupShortcut = forwardRef<{}, I.Popup>(() => {

	const [ page, setPage ] = useState('main');
	const isMac = U.Common.isPlatformMac();
	const sections = J.Shortcut();
	const section = sections.find(it => it.id == page);

	const Tab = (item: any) => (
		<div className={[ 'item', (item.id == page ? 'active' : '') ].join(' ')} onClick={() => setPage(item.id)}>
			{item.name}
		</div>
	);

	const Section = (item: any) => {
		const cn = [ 'section' ];

		if (item.className) {
			cn.push(item.className);
		};

		return (
			<div className={cn.join(' ')}>
				{item.name ? <div className="name">{item.name}</div> : ''}
				{item.description ? <div className="descr">{item.description}</div> : ''}

				<div className="items">
					{item.children.map((item: any, i: number) => (
						<Item key={i} {...item} />
					))}
				</div>
			</div>
		);
	};

	const Item = (item: any) => {
		const caption = isMac && item.mac ? item.mac : item.com;

		return (
			<div className="item">
				<div className="key" dangerouslySetInnerHTML={{ __html: U.Common.sanitize(caption) }} />
				<div className="descr">{item.name}</div>
			</div>
		);
	};

	return (
		<div className="wrapper">
			<div className="head">
				<div className="tabs">
					{sections.map((item: any, i: number) => (
						<Tab key={i} {...item} />
					))}
				</div>
			</div>

			<div className="body scrollable">
				{(section.children || []).map((item: any, i: number) => (
					<Section key={i} {...item} />
				))}
			</div>
		</div>
	);

});

export default PopupShortcut;