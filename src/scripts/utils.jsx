import React from 'react';
import ReactDOM from 'react-dom';
import {database} from './firebaseInterface.jsx'

export function getCurrentScore(bids, takes, scores, roundNumber) {
  return (roundNumber > 0 ? scores[roundNumber-1] : 0) + getRoundScore(bids[roundNumber], takes[roundNumber], roundNumber);
}

export function getGUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
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

export function countArrayPrefix(arr1, arr2, prefixSize) {
  prefixSize = Math.min(prefixSize, arr1.length);
  prefixSize = Math.min(prefixSize, arr2.length);

  let count = 0;
  for (var i = 0; i < prefixSize; i++) {
    if (arr1[i] === arr2[i])
      count++
  }
  return count;
}

/***
  Good luck testing this function.

  It's not even finished, as it doesn't check if a player 42s only on the last round,
  or that a perfect score wasn't all 0s.

  Testing this is pretty rough until I come up with a way to generate gameStates without
  going through the motions.
*/
export function getWinnersAndMessage(players, gameState, no42 = false) {
  var winReason = "Error. No winner.";
  var winners = [];

  var highScorers = [];
  var fortyTwoers = [];
  var highScore = 0;
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
  if (fortyTwoers.length == 0 || no42) {
    //high scorer
    winners=highScorers;
    if (highScorers.length == 1) {
      winReason = `${winners[0].playerName} got the highest score: ${highScore}`;
    }
    else {
      winReason = `${winners.map((w) => w.playerName).join("/")} tied for the highest score: ${highScore}`;
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
          winReason = `${fortyTwoers.map((w) => w.playerName).join("/")} got 42, but ${perfects.map((p) => p.playerName).join("/")} got perfect high scores of ${highScore}`;
        }
        else {
          winReason = `${fortyTwoers.map((w) => w.playerName).join("/")} got 42, but ${perfects[0].playerName} got a perfect high score of ${highScore}`;
        }
      }
      else {
        winners = fortyTwoers;
        if (fortyTwoers.length > 1) {
          winReason = `${winners.map((w) => w.playerName).join("/")} all got 42!`;
        }
        else if (fortyTwoers.length == 1) {
          winReason = `${winners[0].playerName} got 42!`;
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
    this.state = {isDeleted: false}
  }

  resumeGame() {
    this.props.resume(this.props.gameWithKey);
  }

  deleteGame() {
    //delete the user-games for each player first, then the game
    if(!confirm("Are you sure you want to delete this game?"))
      return;
    var gameKey = this.props.gameWithKey.key;
    var updates = {};
    for (var player of this.props.gameWithKey.players)
    {
      updates[`/user-games/${player.playerName}/${gameKey}`] = null; 
      //transaction decrement
      database.ref(`/players/${player.playerName}/count`).transaction(x => x > 1 ? x - 1 : null);
    }
    updates[`/games/${gameKey}`] = null;
    database.ref().update(updates);
    this.setState({isDeleted: true});
  }

  getStatus(game) {
    if (!game)
      return "Error";
    else if (game.inProgress)
      return "In Progress";
    else 
    {
      var winners = getWinnersAndMessage(game.players, game.state);
      return winners[1];
    }
  } 

  render() {
    if (this.state.isDeleted)
      return null;
    var game = this.props.gameWithKey;

    var resumeButton = "";
    if (this.props.resume)
      resumeButton = (<button className="resume-game" onClick={this.resumeGame.bind(this)}> Resume </button>);

    var deleteButton = "";
    if (this.props.showDelete)
    {
      deleteButton = (<button className="delete-game" onClick={this.deleteGame.bind(this)}> Delete </button>)
    }

    var status = this.getStatus(game);

    return (
      <div className="game-summary" key={game.dateCreated}>
        <h3> Date: {new Date(game.dateCreated).toLocaleString()} </h3>
        <h3> Players: {game.players.map((p) => p.playerName).join(", ")} </h3>
        <h3> Round: {game.state ? game.state.roundNumber : "N/A"} </h3>
        <h3> {status} </h3>
        {resumeButton}
        {deleteButton}
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
      <div key={"score-" + p.playerName}>
        {p.playerName} : {p.currentScore}
      </div>
    ));
    return (
      <div className="scoreboard">
        {scores}
      </div>
    );
  }
}

export class GameSummaryModal extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    if (!this.props.show) {
      return null;
    }
    var numRounds = getNumberOfRounds(this.props.players.length);
    var tableRows = this.props.players.map((p) => {
      var playerGame = this.props.gameState[p.playerName];
      var zipped = playerGame.bids.map(function(e, index) {
        return {col: index, bid: e, take:playerGame.takes[index], score: playerGame.scores[index]};
      }).slice(0, numRounds); //mainly for when players join mid-game
      var rows = zipped.map((bidTakeScore) => {
        return(
          <td className="game-summary-cell" key={"player-" + p.playerName + "-" + bidTakeScore.col}>{bidTakeScore.bid} / {bidTakeScore.score}</td>
          )
      });
      return (
        <tr key={"player-row-" + p.playerName}>
          <td className="game-summary-cell" key={"player-" + p.playerName}>{p.playerName} </td>
          {rows}
        </tr>
        )
      });

    var headerRow = Array.apply(null, Array(numRounds)).map((e, index) => {
      return (
        <th key={"game-summary-header-" + index}>
          {index + 1} : {this.props.players[index % this.props.players.length].playerName.charAt(0)}
        </th>
        );
    });
    return (
      <div className="backdrop">
          <div className="game-summary-modal">
            <table>
              <tbody>
                <tr>
                  <th></th>
                  {headerRow}
                </tr>
                {tableRows}
              </tbody>
            </table>
            <div className="footer">
              <button onClick={this.props.onClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      );
  }
}