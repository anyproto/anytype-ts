import React, { forwardRef, useRef, useEffect } from 'react';
import { Notification, Icon } from 'Component';
import * as I from 'Interface';

const LIMIT = 5;

const ListNotification = forwardRef(() => {

	const nodeRef = useRef(null);
	const { list } = S.Notification;
	const isExpanded = useRef(false);

	const onShow = (e: any) => {
		e.stopPropagation();

		if (isExpanded.current) {
			return;
		};

		U.Dom.addClass(nodeRef.current, 'isExpanded');
		isExpanded.current = true;
		resize();
	};

	const onHide = (e: any) => {
		e.stopPropagation();

		if (!isExpanded.current) {
			return;
		};

		U.Dom.removeClass(nodeRef.current, 'isExpanded');
		isExpanded.current = false;
		resize();
	};

	const onClear = () => {
		C.NotificationReply(S.Notification.list.map(it => it.id), I.NotificationAction.Close);
		S.Notification.clear();
	};

	const resize = () => {
		const node = nodeRef.current;
		if (!node) {
			return;
		};

		const items = U.Dom.selectAll('.notification', node) as HTMLElement[];

		let listHeight = 0;
		let firstHeight = 0;
		let height = 0;
		let bottom = 0;

		window.setTimeout(() => {
			items.forEach((item, i) => {
				U.Dom.css(item, {
					width: isExpanded.current ? '100%' : `calc(100% - ${4 * i * 2}px)`,
					right: isExpanded.current ? '0px' : `${4 * i}px`,
				});

				const h = item.offsetHeight;

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

				U.Dom.css(item, { bottom: `${bottom}px` });
				height = h;
			});

			if (!isExpanded.current) {
				listHeight = firstHeight + 4 * items.length;
			} else
			if (items.length) {
				listHeight += 38;
			};

			U.Dom.css(node, { height: `${listHeight}px` });
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
					<Icon name="notification/hide" className="hide" width={12} height={8} onClick={onHide} />
					<Icon name="notification/delete" className="clear" size={10} onClick={onClear} />
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

});

export default ListNotification;