import React, { FC, useEffect } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Popup } from 'Component';
import { I, S } from 'Lib';

const ListPopup: FC<I.PageComponent> = observer(() => {
	const { list } = S.Popup;

	useEffect(() => {
		$('body').toggleClass('overPopup', S.Popup.list.length > 0);
	}, [ list.length ]);

	return (
		<div className="popups">
			{list.map((item: I.Popup, i: number) => (
				<Popup key={i} {...item} />
			))}
		</div>
	);
});

export default ListPopup;