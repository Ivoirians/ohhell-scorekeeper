export class AppStore {
	constructor() {
		this.leagues = ['Zazzle', 'Other'];
		this.league = this.leagues[0];
	}

	nextLeague() {
		const n = this.leagues.length;
		const i = this.leagues.findIndex(l => l === this.league);
		this.league = this.leagues[(i+1)%n];
	}
}

export const appStore = new AppStore();