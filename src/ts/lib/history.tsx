class History {

	list: string[] = [];
	index: number = 0;

	clear () {
		this.list = []
		this.index = 0;
	};

	push (route: string) {
		const last = this.list[this.list.length - 1];
		if (last && (last == route)) {
			this.index = this.list.length - 1;
			return;
		};

		if (this.index < this.list.length - 1) {
			this.list = this.list.slice(0, this.index + 1);
		};

		this.list.push(route);
		this.index = this.list.length - 1;
	};

	pushMatch (match: any) {
		this.push(this.build(match));
	};

	build (match: any): string {
		return [ match.params.page, match.params.action, match.params.id ].join('/');
	};

	getParams (route: string) {
		const [ page, action, id ] = route.split('/');
		return { page, action, id };
	};

	checkBack () {
		return this.index - 1 >= 0;
	};

	checkForward () {
		return this.index + 1 <= this.list.length - 1;
	};

	go (route: string, callBack: (match: any) => void) {
		callBack({ route, params: this.getParams(route) });
	};

	goBack (callBack: (match: any) => void) {
		if (this.checkBack()) {
			this.index--;
			this.go(this.list[this.index], callBack);
		};
	};

	goForward (callBack: (match: any) => void) {
		if (this.checkForward()) {
			this.index++;
			this.go(this.list[this.index], callBack);
		};
	};

};

export let history: History = new History();