import * as React from 'react';
import { I } from 'ts/lib';
import { Icon, Smile, Input } from 'ts/component';

interface Props extends I.Cell {};

interface State { 
	editing: boolean; 
};

const $ = require('jquery');

class CellText extends React.Component<Props, State> {

	state = {
		editing: false,
	};
	ref: any = null;
	timeout: number = 0;

	constructor (props: any) {
		super(props);

		this.onClick = this.onClick.bind(this);
		this.onChange = this.onChange.bind(this);
		this.onBlur = this.onBlur.bind(this);
	};

	render () {
		const { editing } = this.state;
		const { data, relation, view, onOpen } = this.props;

		let Name = null;

		if (editing) {
			Name = (item: any) => (
				<Input 
					ref={(ref: any) => { this.ref = ref; }} 
					value={item.name} 
					className="name" 
					onChange={this.onChange} 
					onBlur={this.onBlur} 
				/>
			);
		} else {
			Name = (item: any) => (
				<div className="name" onClick={this.onClick}>{item.name}</div>
			);
		};

		let content: any = <Name name={data[relation.id]} />;

		if (relation.id == 'name') {
			let cn = 'c20';
			let size = 18;

			switch (view.type) {
				case I.ViewType.List:
					cn = 'c24';
					break;

				case I.ViewType.Gallery:
				case I.ViewType.Board:
					cn = 'c48';
					size = 24;
					break;
			};

			content = (
				<React.Fragment>
					<Smile id={[ relation.id, data.id ].join('-')} icon={data.iconEmoji} hash={data.iconImage} className={cn} size={size} canEdit={true} offsetY={4} />
					<Name name={data[relation.id]} />
					<Icon className="expand" onClick={(e: any) => { onOpen(e, data); }} />
				</React.Fragment>
			);
		};

		return (
			<React.Fragment>
				{content}
			</React.Fragment>
		);
	};

	componentDidUpdate () {
		const { editing } = this.state;
		const { id, relation } = this.props;
		const cell = $(`#${relation.id}-${id}`);

		if (editing) {
			cell.addClass('isEditing');
			this.ref.focus();
		} else {
			cell.removeClass('isEditing');
		};
	};

	onClick (e: any) {
		this.setState({ editing: true });
	};

	onChange (e: any, value: string) {
		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => {
			this.setState({ editing: false });
		}, 500);
	};

	onBlur (e: any) {
		this.setState({ editing: false });
	};
	
};

export default CellText;