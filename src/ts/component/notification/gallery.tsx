/** @format */

import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Button } from 'Component';
import { I, UtilCommon, UtilObject, translate } from 'Lib';
import { commonStore } from 'Store';

const NotificationGallery = observer(
	class NotificationGallery extends React.Component<
		I.NotificationComponent,
		{}
	> {
		render() {
			const { item, onButton } = this.props;
			const { payload } = item;
			const { errorCode, spaceId, name } = payload;

			let buttons = [];
			if (!errorCode && spaceId != commonStore.space) {
				buttons = buttons.concat([
					{ id: 'space', text: 'Go to space' },
				]);
			}

			return (
				<React.Fragment>
					<Title text={item.title} />
					<Label text={item.text} />

					<div className="buttons">
						{buttons.map((item: any, i: number) => (
							<Button
								key={i}
								color="blank"
								className="c28"
								{...item}
								onClick={e => onButton(e, item.id)}
							/>
						))}
					</div>
				</React.Fragment>
			);
		}
	}
);

export default NotificationGallery;
