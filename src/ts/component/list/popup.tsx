import React, { FC, useEffect } from 'react';
import { Popup } from 'Component';
import * as I from 'Interface';

const ListPopup: FC<I.PageComponent> = () => {
	const { list } = S.Popup;

	useEffect(() => {
		U.Dom.toggleClass(document.body, 'overPopup', S.Popup.list.length > 0);
	}, [ list.length ]);

	return (
		<div className="popups">
			{list.map((item: I.Popup) => (
				<Popup key={item.id} {...item} />
			))}
		</div>
	);
};

export default ListPopup;