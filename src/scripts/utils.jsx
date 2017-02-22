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

export function equalArray(arr1, arr2) {
  if (arr1.length != arr2.length)
    return false;
  for (var i = 0; i < arr1.length; i++) {
    if (arr1[i] != arr2[i])
      return false;
  }
  return true;
}

export function getWinnersAndMessage(players, gameState) {
  var winReason = "Error. No winner.";
  var winners = [];

  var highScorers = [];
  var fortyTwoers = [];
  var highScore = 0;
  console.log(players);
  for (var playerIndex in players) {
    var player = players[playerIndex];
    if (player.currentScore == 42) {
      fortyTwoers.push(player);
    }
    if (player.currentScore > highScore) {
      highScorers = [player];
      highScore = player.currentScore;
    }
    else if (player.currentScore == highScore) {
      highScorers.push(player);
    }
  }
  if (fortyTwoers.length == 0) {
    //high scorer
    winners=highScorers;
    if (highScorers.length == 1) {
      winReason = winners[0].playerName + " got the highest score : " + highScore;
    }
    else {
      winReason = winners.map((w) => w.playerName).join("/") + " tied for the highest score : " + highScore;
    }
  }
  else {
    //forty two'd
    if (highScorers.length > 0) {
      var perfects = [];
      for (playerIndex in highScorers) {
        if (highScorers[playerIndex].isPerfect) {
          perfects.push(highScorers[playerIndex]);
        }
      }
      if (perfects.length > 0) {
        //winner
        winners = perfects;
        if (perfects.length > 1) {
          winReason = fortyTwoers.map((w) => w.playerName).join("/") + " got 42, but " + perfects.map((p) => p.playerName).join("/") + " got perfect high scores of " + highScore;
        }
        else {
          winReason = fortyTwoers.map((w) => w.playerName).join("/") + " got 42, but " + perfects[0].playerName + " got a perfect high score of " + highScore;
        }
      }
      else {
        winners = fortyTwoers;
        if (fortyTwoers.length > 1) {
          winReason = winners.map((w) => w.playerName).join("/") + " all got 42!";
        }
        else if (fortyTwoers.length == 1) {
          winReason = winners[0].playerName + " got 42!";
        }
        else {
          console.log(fortyTwoers.length);
        }
      }
    }
    else {
      winReason = "Error. No high scorers.";
    }
  }

  return [winners, winReason];
}

export class GameSummary extends React.Component {
  constructor(props) {
    super(props);
  }

  resumeGame() {
    this.props.resume(this.props.gameWithKey);
  }

  render() {
    var game = this.props.gameWithKey;
    return (
      <div className="game-summary" key={game.dateCreated}>
        <h3> Date: {game.dateCreated} </h3>
        <h3> Players: {game.players.map((p) => p.playerName).join(", ")} </h3>
        <h3> Round: {game.state ? game.state.roundNumber : "N/A"} </h3>
        <button className="resume-game" onClick={this.resumeGame.bind(this)}> Resume </button>
      </div>
    );
  }
}

export class Scoreboard extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    var game = this.props.gameState;
    var scores = this.props.players.map((p) => (
      <div key={p.playerName}>
        {p.playerName} + ": " + {p.currentScore}
      </div>
    ))
    return (
      <div className="scoreboard">
        <h3> Players: {game.players.map((p) => p.playerName).join(", ")} </h3>
        <h3> Round: {game.state ? game.state.roundNumber : "N/A"} </h3>
        <button className="resume-game" onClick={this.resumeGame.bind(this)}> Resume </button>
      </div>
    );
  }
}