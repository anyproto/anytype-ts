import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { S, Renderer } from 'Lib';

const TabBar = observer(forwardRef<{}, {}>((props, ref) => {

	const { windowTabs, activeTabIdx } = S.Common;

	const Tab = ({ id, index }) => {
		const cn = [ 'tab' ];

		if (activeTabIdx == index) {
			cn.push('active');
		};

		return (
			<div className={cn.join(' ')} onClick={() => Renderer.send('setActiveTab', index)}>
				<div className="name">{id}</div>
			</div>
		);
	};

	return (
		<div id="tabBar">
			{windowTabs.map((tab, i) => <Tab key={tab.id} {...tab} index={i} />)}
		</div>
	);

}));

export default TabBar;