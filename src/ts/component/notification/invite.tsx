import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observer } from 'mobx-react';
import { Label, Button, IconObject, ObjectName } from 'Component';
import { I, translate } from 'Lib';

const NotificationInvite = observer(class NotificationInvite extends React.Component<I.Notification, {}> {

	node = null;

	render () {
		const { type } = this.props;
		const buttons = [
			{ text: 'Accept' },
			{ text: 'Reject' },
		];

		return (
			<div ref={ref => this.node = ref}>
				<Label text={translate(`notification${type}Text`)} />

				<div className="buttons">
					{buttons.map((item: any, i: number) => (
						<Button key={i} color="blank" className="c28" {...item} />
					))}
				</div>
			</div>
		);
	};

	componentDidMount(): void {
		const node = $(this.node);
		const object = node.find('#object');
		const subject = node.find('#subject');

		const Element = (item: any) => (
			<React.Fragment>
				<IconObject object={item} size={16} />
				<ObjectName object={item} />
			</React.Fragment>
		);

		ReactDOM.render(<Element {...this.props.object} />, object.get(0));
		ReactDOM.render(<Element {...this.props.subject} />, subject.get(0));
	};
	
});

export default NotificationInvite;