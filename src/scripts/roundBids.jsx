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
    this.props.changePage(PageEnum.ROUND_TRICKS);
  }

  updateBid(playerName, newBid) {
    console.log(playerName + " " + newBid);
  }

  render() {
    var pendingBids = this.props.players.map((player) => (
      <div key={player.playerNumber}>
        <PendingBid
          playerName={player.playerName}
          currentScore={this.state.gameState[player.playerNumber].currentScore}
          updateBid={this.updateBid.bind(this)} />
      </div>
    ));
    return (
      <div>
        <h2> Round: {this.props.roundNumber} </h2>
        {pendingBids}
        <button onClick={this.goToRoundTricks.bind(this)}> Finalize Bids </button>
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
      currentScore: this.props.currentScore,
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
        <h3> {this.state.playerName} </h3> <input type="number" min="0" max={this.state.maxBid} onChange={this.notifyChangedBid.bind(this)} />
      </div>
    );
  }

}