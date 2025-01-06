import React, { forwardRef, useRef, useEffect } from 'react';
import $ from 'jquery';
import { Notification, Icon } from 'Component';
import { observer } from 'mobx-react';
import { I, C, S } from 'Lib';

const LIMIT = 5;

const ListNotification = observer(forwardRef(() => {

	const nodeRef = useRef(null);
	const { list } = S.Notification;
	const isExpanded = useRef(false);

	const onShow = (e: any) => {
		e.stopPropagation();

		if (isExpanded.current) {
			return;
		};

		$(nodeRef.current).addClass('isExpanded');
		isExpanded.current = true;
		resize();
	};

	const onHide = (e: any) => {
		e.stopPropagation();

		if (!isExpanded.current) {
			return;
		};

		$(nodeRef.current).removeClass('isExpanded');
		isExpanded.current = false;
		resize();
	};

	const onClear = () => {
		C.NotificationReply(S.Notification.list.map(it => it.id), I.NotificationAction.Close);
		S.Notification.clear();
	};

	const resize = () => {
		const node = $(nodeRef.current);
		const items = node.find('.notification');

		let listHeight = 0;
		let firstHeight = 0;
		let height = 0;
		let bottom = 0;

		window.setTimeout(() => {
			items.each((i: number, item: any) => {
				item = $(item);

				item.css({ 
					width: (isExpanded.current ? '100%' : `calc(100% - ${4 * i * 2}px)`),
					right: (isExpanded.current ? 0 : 4 * i),
				});
				
				const h = item.outerHeight();

				if (i == 0) {
					firstHeight = h;
				};

				if (!isExpanded.current) {
					if (i > 0) {
						bottom = firstHeight + 4 * i - h;
					};
				} else {
					const o = i > 0 ? 8 : 0;

					bottom += height + o;
					listHeight += h + o;
				};

				item.css({ bottom });
				height = h;
			});

			if (!isExpanded.current) {
				listHeight = firstHeight + 4 * items.length;
			} else 
			if (items.length) {
				listHeight += 38;
			};

			node.css({ height: listHeight });
		}, 50);
	};

	useEffect(() => resize(), [ list ]);

	return (
		<div 
			id="notifications" 
			ref={nodeRef}
			className="notifications"
			onClick={onShow}
		>
			{list.length ? (
				<div className="head">
					<Icon className="hide" onClick={onHide} />
					<Icon className="clear" onClick={onClear} />
				</div>
			) : ''}

			<div className="body">
				{list.slice(0, LIMIT).map((item: I.Notification, i: number) => (
					<Notification 
						item={item}
						key={item.id} 
						style={{ zIndex: LIMIT - i }}
						resize={resize}
					/>
				))}
			</div>
		</div>
	);

}));

export default ListNotification;