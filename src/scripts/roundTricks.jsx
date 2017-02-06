import React from 'react';
import ReactDOM from 'react-dom';
import {database} from './firebaseInterface.jsx'
import {PageEnum} from './pageEnum.jsx';
import {getCurrentScore} from './utils.jsx';


export default class RoundTricks extends React.Component {
  
  constructor(props) {
    super(props);
    this.state= { players: this.props.players,
                  gameState: this.props.gameState};
  }

  goToRoundBids() {
    this.props.changePage(PageEnum.ROUND_BIDS);
  }

  goToWinScreen() {
    this.props.changePage(PageEnum.WIN_SCREEN);
  }

  updateTake(playerName, newBid) {
    this.state.gameState[playerName].takes[this.props.roundNumber - 1] = parseInt(newBid);
  }

  logStateDebug() {
    console.log(JSON.stringify(this.state));
  }

  //computes scores from the current state and updates this.state.gameState.scores
  computeRoundScores() {
    //the only score guaranteed to match the gameState (which may have changed) is the latest one
    for (var playerNumber in this.props.players) {
      var game = this.state.gameState[this.props.players[playerNumber].playerName];
      game.scores[this.props.roundNumber-1] = getCurrentScore(game.bids, game.takes, this.props.roundNumber);
    }
  }

  endRound() {
    this.computeRoundScores();
    this.props.updateGameState(this.state.players, this.props.roundNumber + 1, this.state.gameState);
    this.goToRoundBids();
  }

  updateFirebase() {
    
  }

  render() {
    var takeTrickButtons = this.props.players.map((player) => (
      <div key={player.playerNumber}>
        <RecordTricks
          updateTake={this.updateTake.bind(this)}
          playerName={player.playerName}
          currentScore={this.state.gameState[player.playerName].scores[this.props.roundNumber-2]}
          currentBid={this.state.gameState[player.playerName].bids[this.props.roundNumber-1]}
          currentTake={this.state.gameState[player.playerName].takes[this.props.roundNumber-1]} />
      </div>
    ));
    return (
      <div>
        <h2> Round: {this.props.roundNumber} </h2>
        {takeTrickButtons}
        <button onClick={this.endRound.bind(this)}> End Round </button>
        <button onClick={this.goToWinScreen.bind(this)}> End Game </button>
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
    this.setState( {currentTake: this.state.currentTake += 1 });
    this.props.updateTake(this.props.playerName, this.state.currentTake)
  }

  decreaseTake(event) {
    this.setState( {currentTake: this.state.currentTake -= 1 });
    this.props.updateTake(this.props.playerName, this.state.currentTake)
  }

  render() {
    return (
      <div>
        <h3> {this.props.playerName} : {this.props.currentScore}. Take/Bid: {this.state.currentTake}/{this.props.currentBid} </h3>
        <button onClick={this.increaseTake.bind(this)}>+</button>
        <button onClick={this.decreaseTake.bind(this)}>-</button>
      </div>
    )
  }
}