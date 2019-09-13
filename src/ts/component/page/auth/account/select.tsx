import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Title, IconUser, HeaderAuth as Header, FooterAuth as Footer } from 'ts/component';

const $ = require('jquery');

interface Profile {
	icon: string;
	name: string;
};

interface Props extends RouteComponentProps<any> {};
interface State {
	list: Profile[];
};

class PageAccountSelect extends React.Component<Props, State> {

	state = {
		list: [ 
			{ icon: '', color: '', name: 'Anton Pronin' }, 
			{ icon: '', color: '', name: 'James Simon' }, 
			{ icon: '', color: '', name: 'Tony Leung' } 
		]
	};

	constructor (props: any) {
        super(props);
	};
	
	render () {
		const { list } = this.state;
		
		const Item = (item: Profile) => (
			<div className="item">
				<IconUser {...item} />
				<div className="name">{item.name}</div>
			</div>
		);
		
        return (
			<div>
				<div className="cover c3" />
				<Header />
				<Footer />
				
				<div className="frame">
					<Title text="Choose profile" />
					
					<div className="list">
						{list.map((item, i) => (
							<Item key={i} {...item} />	
						))}
					</div>
				</div>
			</div>
		);
    };

	onSelect (e: any) {
		e.preventDefault();
		
		this.props.history.push('/main/index');
	};
	
	resize () {
		let node = $(ReactDOM.findDOMNode(this));
		let frame = node.find('.frame');
		
		frame.css({ marginTop: -frame.outerHeight() / 2 });
	};

};

export default PageAccountSelect;