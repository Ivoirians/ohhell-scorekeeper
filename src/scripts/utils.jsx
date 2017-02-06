export function getCurrentScore(bids, takes, rounds) {
	var i = 0;
	var score = 0;
	while (i < rounds) {
		score += getRoundScore(bids[i], takes[i], i);
		i++;
	}
	return score;
}

export function getRoundScore(bid, take, roundNumber) {
	if (bid == take) {
		if (bid == 0) {
			return roundNumber + 6;
		}
		else {
			return 10 + bid;
		}
	}
	else {
		return take;
	}
}

export function getNumberOfRounds(numPlayers) {
	return parseInt((52-1)/numPlayers);
;}