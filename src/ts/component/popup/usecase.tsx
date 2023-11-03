import * as React from 'react';
import { Title, Label, Button, Tag } from 'Component';
import { I, UtilCommon, UtilFile, UtilDate, translate, Renderer } from 'Lib';
import { Swiper, SwiperSlide } from 'swiper/react';

class PopupUsecase extends React.Component<I.Popup> {

	constructor (props: I.Popup) {
		super(props);

		this.onAuthor = this.onAuthor.bind(this);
	};
	
	render () {
		const object = this.getObject();
		const author = this.getAuthor();
		const screenshots = object.screenshots || [];
		const categories = object.categories || [];

		return (
			<div>
				<div className="titleWrap">
					<div className="side left">
						<Title text={object.title} />
						<Label text={UtilCommon.sprintf(translate('popupUsecaseAuthor'), author)} onClick={this.onAuthor} />
					</div>
					<div className="side right">
						<Button text="Install" arrow={true} />
					</div>
				</div>

				<div className="screenWrap">
					<Swiper spaceBetween={56} slidesPerView={1}>
						{screenshots.map((url: string, i: number) => (
							<SwiperSlide key={i}>
								<div className="screen" style={{ backgroundImage: `url('${url}')` }} />
							</SwiperSlide>
						))}
    				</Swiper>
				</div>

				<div className="footerWrap">
					<div className="side left">
						<Label text={object.description} />
					</div>
					<div className="side right">
						<div className="tags">
							{categories.map((name: string, i: number) => (
								<Tag key={i} text={name} />
							))}
						</div>
						<Label text={UtilCommon.sprintf(translate('popupUsecaseUpdated'), UtilDate.date(UtilDate.dateFormat(I.DateFormat.MonthAbbrBeforeDay), UtilDate.now()))} />
						<Label text={UtilFile.size(object.size)} />
					</div>
				</div>
			</div>
		);
	};

	onAuthor () {
		const object = this.getObject();

		if (object.author) {
			Renderer.send('urlOpen', object.author);
		};
	};

	getObject (): any {
		const { param } = this.props;
		const { data } = param;

		return data.object || {};
	};

	getAuthor (): string {
		const object = this.getObject();

		if (!object.author) {
			return '';
		};

		let a: any = {};
		try { a = new URL(object.author); } catch (e) {};

		return String(a.pathname || '').replace(/^\//, '');
	};

};

export default PopupUsecase;