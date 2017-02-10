import React from 'react';
import ReactDOM from 'react-dom';
import {database} from './firebaseInterface.jsx'
import {PageEnum} from './pageEnum.jsx';
import {getCurrentScore, getNumberOfRounds} from './utils.jsx';


export default class RoundTricks extends React.Component {
  
  constructor(props) {
    super(props);
    this.state= { players: this.props.players,
                  gameState: this.props.gameState};
  }

  goToRoundBids() {
    this.updateFirebase();
    this.props.changePage(PageEnum.ROUND_BIDS);
  }

  goToWinScreen() {
    this.updateFirebase();
    this.props.changePage(PageEnum.WIN_SCREEN);
  }

  updateTake(playerName, newBid) {
    this.state.gameState[playerName].takes[this.state.gameState.roundNumber - 1] = parseInt(newBid);
  }

  logStateDebug() {
    console.log(JSON.stringify(this.state));
  }

  //computes scores from the current state and updates this.state.gameState.scores
  computeRoundScores() {
    //the only score guaranteed to match the gameState (which may have changed) is the latest one
    for (var playerNumber in this.state.players) {
      var game = this.state.gameState[this.props.players[playerNumber].playerName];
      var score = getCurrentScore(game.bids, game.takes, this.state.gameState.roundNumber);
      game.scores[this.state.gameState.roundNumber-1] = score;
      this.state.players[playerNumber].currentScore = score;
    }
  }

  endRound() {
    this.computeRoundScores();
    this.state.gameState.roundNumber += 1;
    this.props.updateGameState(this.state.players, this.state.gameState);
    this.goToRoundBids();
  }

  endGame() {
    this.computeRoundScores();
    this.state.gameState.inProgress = false;
    this.props.updateGameState(this.state.players, this.state.gameState);
    this.goToWinScreen();
  }

  updateFirebase() {
    var updates = {};
    updates['/games/' + this.props.currentGameKey + '/state'] = this.state.gameState;
    for (var p in this.state.players){
      var playerName = this.state.players[p].playerName;
      updates['/user-games/' + playerName + "/" + this.props.currentGameKey + '/state'] = this.state.gameState; 
    }
    database.ref().update(updates);
  }

  render() {
    var takeTrickButtons = this.props.players.map((player) => (
      <div key={player.playerNumber}>
        <RecordTricks
          updateTake={this.updateTake.bind(this)}
          playerName={player.playerName}
          currentScore={this.state.gameState[player.playerName].scores[this.state.gameState.roundNumber-2]}
          currentBid={this.state.gameState[player.playerName].bids[this.state.gameState.roundNumber-1]}
          currentTake={this.state.gameState[player.playerName].takes[this.state.gameState.roundNumber-1]} />
      </div>
    ));

    var nextRound = "";
    if (this.state.gameState.roundNumber != getNumberOfRounds(this.props.players.length)) {
      nextRound = (<button onClick={this.endRound.bind(this)}> End Round </button>);
    }

    return (
      <div>
        <h2> Round: {this.state.gameState.roundNumber} </h2>
        {takeTrickButtons}
        {nextRound}
        <button onClick={this.endGame.bind(this)}> End Game </button>
        <button onClick={this.logStateDebug.bind(this)}> Debug </button>
      </div>
    );
  }
}

class RecordTricks extends React.Component {
  
  constructor(props) {
    super(props);
    this.state= {currentTake: this.props.currentTake};
  }

  increaseTake(event) {
    if (this.state.currentTake < 10)
      this.setState( {currentTake: this.state.currentTake += 1 });
    this.props.updateTake(this.props.playerName, this.state.currentTake)
  }

  decreaseTake(event) {
    if (this.state.currentTake > 0)
      this.setState( {currentTake: this.state.currentTake -= 1 });
    this.props.updateTake(this.props.playerName, this.state.currentTake)
  }

  render() {
    return (
      <div>
        <h3 className="score"> {this.props.playerName} : {this.props.currentScore ? this.props.currentScore : 0}. Take/Bid: {this.state.currentTake}/{this.props.currentBid} </h3>
        <button onClick={this.increaseTake.bind(this)}>+</button>
        <button onClick={this.decreaseTake.bind(this)}>-</button>
      </div>
    )
  }
}