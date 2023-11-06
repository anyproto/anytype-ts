import * as React from 'react';
import { Title, Label, Button, Tag } from 'Component';
import { I, UtilCommon, UtilFile, UtilDate, UtilRouter, translate, Renderer } from 'Lib';
import { menuStore, dbStore, detailStore, popupStore } from 'Store';
import { Swiper, SwiperSlide } from 'swiper/react';
import Constant from 'json/constant.json';

class PopupUsecase extends React.Component<I.Popup> {

	constructor (props: I.Popup) {
		super(props);

		this.onMenu = this.onMenu.bind(this);
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
						<Button id="button-install" text={translate('popupUsecaseInstall')} arrow={true} onClick={this.onMenu} />
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

	onMenu () {
		const { getId } = this.props;

		menuStore.open('select', {
			element: `#${getId()} #button-install`,
			offsetY: 2,
			noFlipX: true,
			className: 'spaceSelect',
			data: {
				options: this.getSpaceOptions(),
				noVirtualisation: true, 
				noScroll: true,
				onSelect: (e: any, item: any) => {
					console.log('SPACE', item);

					if (item.id == 'add') {
						popupStore.open('settings', { 
							className: 'isSpaceCreate',
							data: { 
								page: 'spaceCreate', 
								isSpace: true,
								onCreate: id => {
									console.log('onCreate', id);
								},
							}, 
						});
					} else {
						
					};
				},
			}
		});
	};

	getSpaceOptions (): any[] {
		const subId = Constant.subId.space;
		
		let list = dbStore.getRecords(subId, '').map(id => detailStore.get(subId, id));

		list = list.map(it => ({ id: it.id, name: it.name, iconSize: 48, object: it }));

		if (list.length < Constant.limit.space) {
			list.unshift({ id: 'add', icon: 'add', name: translate('popupUsecaseSpaceCreate') });
		};
		list.unshift({ name: translate('popupUsecaseMenuLabel'), isSection: true });

		return list;
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