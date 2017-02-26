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

  componentWillMount() {
    //update firebase on mount - this allows to later resume the game even if no bids were ever finalized
    this.updateFirebase();
  }

  goToRoundTricks() {
    this.updateFirebase();
    this.props.updateGameState(this.state.players, this.state.gameState);
    this.props.changePage(PageEnum.ROUND_TRICKS);
  }

  updateBid(playerName, newBid) {
    this.state.gameState[playerName].bids[this.state.gameState.roundNumber - 1] = parseInt(newBid);
    this.forceUpdate();
  }


  /*** Untested function for adding a new player from this bid page. */
  addPlayer(playerName, score) {
    var newPlayer =
    {
      playerNumber: this.state.players.length + 1,
      playerName: playerName,
      scorekeeper: false,
      dealer: false,
      currentScore: score,
      isPerfect: false, //judgment call here, late joiners aren't perfect,
      joinedRound: this.state.gameState.roundNumber
    };
    this.state.players.push(newPlayer);
    var newGameState = 
    {
      scores: Array(numRounds + 1).join('0').split('').map(parseFloat),
      bids: Array(numRounds + 1).join('-').split(''),
      takes: Array(numRounds + 1).join('0').split('').map(parseFloat)
    };
    newGameState[scores][this.state.gameState.roundNumber - 2] = score;
    this.state.gameState.push(newGameState);
    this.forceUpdate();
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

  /***
    Idea: Display a PendingBid component for every player.

    Right now, each PendingBid component is given an updateBid function which allows it to
    modify the player's current bid. Once the finalize button is hit, everything is sent off
    to Firebase.

    If we wanted to include intermediate bids, the updateFirebase() function would just need to be called
    inside the updateBid function. I would tweak it a little to not send the entire state and just the single
    bid being updated, in that case.
  */
  render() {
    var gameState = this.props.gameState;
    var players = this.props.players;
    var numPlayers = players.length;
    var dealerNumber = (gameState.roundNumber -1) % numPlayers;
    var currentBidder = (dealerNumber + 1) % numPlayers;
    while(gameState[players[currentBidder].playerName].bids[gameState.roundNumber-1] !== "-") {
      currentBidder = (currentBidder + 1) % numPlayers;
      if(currentBidder == (dealerNumber + 1) % numPlayers) {
        currentBidder = -1;
        break;
      }
    }
    var canFinalize = currentBidder < 0 && players.map(p => gameState[p.playerName].bids[gameState.roundNumber-1]).reduce((a,b)=>a+b, 0) != gameState.roundNumber;
    var pendingBids = this.props.players.map((player) => (
      <div key={player.playerNumber}>
        <hr />
        <PendingBid
          playerName={player.playerName}
          currentScore={this.state.gameState[player.playerName].scores[this.state.gameState.roundNumber-2]}
          currentBid={this.state.gameState[player.playerName].bids[this.state.gameState.roundNumber-1]}
          updateBid={this.updateBid.bind(this)}
          maxBid={10}
          isPerfect={player.isPerfect}
          isDealer={dealerNumber == player.playerNumber} 
          isCurrentBidder = {currentBidder == player.playerNumber}/>
      </div>
    ));
    var errorMessage = "";

    return (
      <div>
        <h2> Round: {this.state.gameState.roundNumber} </h2>
        {pendingBids}
        { canFinalize && <button onClick={this.goToRoundTricks.bind(this)}> Finalize Bids </button>}
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
    if(this.state.currentBid === "-")
      this.state.currentBid = 0;
    else if (this.state.currentBid < this.props.maxBid)
      this.setState( {currentBid: this.state.currentBid += 1 });
    this.props.updateBid(this.props.playerName, this.state.currentBid)
  }

  decreaseBid(event) {
    if(this.state.currentBid === "-")
      this.state.currentBid = 0;    
    else if (this.state.currentBid > 0)
      this.setState( {currentBid: this.state.currentBid -= 1 });
    this.props.updateBid(this.props.playerName, this.state.currentBid)
  }

  render() {
    var perfectMark = "";
    if (this.props.isPerfect)
      perfectMark = "*";

    var className = "pending-bid";
    if (this.props.isDealer)
      className = "pending-bid-dealer";
    return (
      <div>
        <h3 className={className}> {this.state.playerName}: {this.state.currentScore} {perfectMark} </h3>
        
        <div className={this.props.isCurrentBidder && "current-bidder"}>
          <button onClick={this.decreaseBid.bind(this)}>-</button>
          <span className="currentBid"> {this.state.currentBid} </span>
          <button onClick={this.increaseBid.bind(this)}>+</button>
        </div>
      </div>
    )
  }
}