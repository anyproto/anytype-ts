import React, { forwardRef, useState, useImperativeHandle } from 'react';
import { observer } from 'mobx-react';
import { Label } from 'Component';
import { I, S, U } from 'Lib';

const SidebarSectionObjectTableOfContents = observer(forwardRef<{}, I.SidebarSectionComponent>((props, ref) => {

	const { rootId, isPopup, blockId } = props;
	const [ dummy, setDummy ] = useState(0);

	const forceUpdate = () => {
		setDummy(dummy + 1);
	};

	const onClick = (e: any, item: any) => {
		U.Common.scrollToHeader(item, isPopup);
	};

	const Item = (item: any) => {
		const cn = [ 'item' ];

		if (item.id == blockId) {
			cn.push('active');
		};

		return (
			<div 
				id={`item-${item.id}`}
				className={cn.join(' ')}
				onClick={e => onClick(e, item)}
				style={{ paddingLeft: 8 + item.depth * 16 }}
			>
				<Label text={U.Common.getLatex(item.text)} />
			</div>
		);
	};

	const getItems = () => {
		return S.Block.getTableOfContents(rootId, true);
	};

	useImperativeHandle(ref, () => ({
		forceUpdate,
		getItems,
	}));

	const items = getItems();

	return (
		<div className="wrap">
			<div className="items">
				{items.map((item, i) => (
					<Item key={item.id} {...item} />
				))}
			</div>
		</div>
	);

}));

export default SidebarSectionObjectTableOfContents;
