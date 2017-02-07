import React from 'react';
import ReactDOM from 'react-dom';

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
}

export class GameSummary extends React.Component {
  constructor(props) {
    super(props);
  }

  resumeGame() {
    this.props.resume(this.props.gameWithKey);
  }

  render() {
    var game = this.props.gameWithKey[this.props.gameWithKey.key];
    return (
      <div className="game-summary" key={game.dateCreated}>
        <h3> Date: {game.dateCreated} </h3>
        <h3> Players: {game.players.map((p) => p.playerName).join(", ")} </h3>
        <h3> Round: {game.state.roundNumber} </h3>
        <button className="resume-game" onClick={this.resumeGame.bind(this)}> Resume </button>
      </div>
    );
  }
}