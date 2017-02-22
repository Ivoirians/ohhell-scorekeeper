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
    updates['/games/' + this.props.currentGameKey + '/players'] = this.state.players;
    for (var p in this.state.players){
      var playerName = this.state.players[p].playerName;
      updates['/user-games/' + playerName + "/" + this.props.currentGameKey + '/state'] = this.state.gameState; 
      updates['/user-games/' + playerName + "/" + this.props.currentGameKey + '/players'] = this.state.players;
    }
    database.ref().update(updates);
  }

  logStateDebug() {
    console.log(JSON.stringify(this.state));
  }

  render() {
    var pendingBids = this.props.players.map((player) => (
      <div key={player.playerNumber}>
        <hr />
        <PendingBid
          playerName={player.playerName}
          currentScore={this.state.gameState[player.playerName].scores[this.state.gameState.roundNumber-2]}
          currentBid={this.state.gameState[player.playerName].bids[this.state.gameState.roundNumber-1]}
          updateBid={this.updateBid.bind(this)}
          maxBid={10}
          isPerfect={player.isPerfect} />
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
      currentBid: this.props.currentBid,
      currentScore: (this.props.currentScore) ? this.props.currentScore : 0,
      maxBid: this.props.maxBid
    }
  }

  increaseBid(event) {
    if (this.state.currentBid < this.props.maxBid)
      this.setState( {currentBid: this.state.currentBid += 1 });
    this.props.updateBid(this.props.playerName, this.state.currentBid)
  }

  decreaseBid(event) {
    if (this.state.currentBid > 0)
      this.setState( {currentBid: this.state.currentBid -= 1 });
    this.props.updateBid(this.props.playerName, this.state.currentBid)
  }

  render() {
    var perfectMark = "";
    if (this.props.isPerfect)
      perfectMark = "*";
    return (
      <div>
        <h3 className="score"> {this.state.playerName}: Current Score: {this.state.currentScore} {perfectMark} </h3>
        <h1> {this.state.currentBid} </h1>

        <button onClick={this.increaseBid.bind(this)}>+</button>
        <button onClick={this.decreaseBid.bind(this)}>-</button>
      </div>
    )
  }

}