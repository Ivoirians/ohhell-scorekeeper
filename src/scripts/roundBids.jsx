import React from 'react';
import ReactDOM from 'react-dom';
import {database} from './firebaseInterface.jsx'
import {PageEnum} from './pageEnum.jsx';

export default class RoundBids extends React.Component {
  
  constructor(props) {
    super(props);
    this.state= { players: this.props.players,
                  gameState: this.props.gameState};
  }

  goToRoundTricks() {
    this.updateFirebase();
    this.props.updateGameState(this.state.players, this.state.gameState);
    this.props.changePage(PageEnum.ROUND_TRICKS);
  }

  updateBid(playerName, newBid) {
    this.state.gameState[playerName].bids[this.state.gameState.roundNumber - 1] = parseInt(newBid);
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

  logStateDebug() {
    console.log(JSON.stringify(this.state));
  }

  render() {
    var pendingBids = this.props.players.map((player) => (
      <div key={player.playerNumber}>
        <PendingBid
          playerName={player.playerName}
          currentScore={this.state.gameState[player.playerName].scores[this.state.gameState.roundNumber-2]}
          updateBid={this.updateBid.bind(this)} />
      </div>
    ));
    return (
      <div>
        <h2> Round: {this.state.gameState.roundNumber} </h2>
        {pendingBids}
        <button onClick={this.goToRoundTricks.bind(this)}> Finalize Bids </button>
        <button onClick={this.logStateDebug.bind(this)}> Debug </button>
      </div>
    );
  }
}

class PendingBid extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      playerName: this.props.playerName,
      currentBid: 0,
      currentScore: (this.props.currentScore) ? this.props.currentScore : 0,
      maxBid: 10
    }
  }

  notifyChangedBid(event) {
    this.setState({currentBid: event.target.value},
      function() {
        this.props.updateBid(this.state.playerName, this.state.currentBid);
      }
    );
  }

  render() {
    return (
      <div>
        <h3> {this.state.playerName}: Current Score: {this.state.currentScore} </h3> <input type="number" min="0" max={this.state.maxBid} value={this.state.currentBid} onChange={this.notifyChangedBid.bind(this)} />
      </div>
    );
  }

}