import React from 'react';
import ReactDOM from 'react-dom';
import {database} from './firebaseInterface.jsx'
import {PageEnum} from './pageEnum.jsx';
import {getCurrentScore, getNumberOfRounds, countArrayPrefix, GameSummaryModal} from './utils.jsx';


export default class RoundTricks extends React.Component {
  
  constructor(props) {
    super(props);
    this.state= { players: this.props.players,
                  gameState: this.props.gameState,
                  showGameSummaryModal: false};
    this.gameRef = database.ref((this.state.gameState.isDebug ? '/games-debug/' : '/games/') + this.props.currentGameKey + '/state')
  }

  componentWillMount() {
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
    this.updateFirebase();
    this.forceUpdate();
  }

  logStateDebug() {
    //no longer used
    console.log(JSON.stringify(this.state));
  }

  showGameSummaryModal() {
    this.setState({showGameSummaryModal: true});
  }

  hideGameSummaryModal() {
    this.setState({showGameSummaryModal: false});
  }

  //computes scores from the current state and updates this.state.gameState.scores
  computeRoundScores() {
    //the only score guaranteed to match the gameState (which may have changed) is the latest one
    const roundNumber = this.state.gameState.roundNumber;
    for (var playerNumber in this.state.players) {
      var game = this.state.gameState[this.props.players[playerNumber].playerName];
      var score = getCurrentScore(game.bids, game.takes, game.scores, roundNumber-1);
      game.scores[roundNumber-1] = score;
      this.state.players[playerNumber].currentScore = score;
      this.state.players[playerNumber].isPerfect = countArrayPrefix(game.bids, game.takes, roundNumber) === roundNumber;
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
    if (!this.state.gameState.isDebug)
    {
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
    else {
      var updates = {};
      updates['/games-debug/' + this.props.currentGameKey + '/state'] = this.state.gameState;
      updates['/games-debug/' + this.props.currentGameKey + '/players'] = this.state.players;
      database.ref().update(updates);
    }
  }

  /***
    Almost the same logic as the bid page. Have each one RecordTrick component per player
    be responsible for updating the number of tricks they've taken. Once the round ends,
    do some processing to compute scores, then send it to Firebase.
  */ 
  render() {
    const gameState = this.state.gameState;
    const players = this.state.players; 
    const numPlayers = players.length;
    const dealerNumber = (gameState.roundNumber -1) % numPlayers;
    let firstLeader = -1;
    let highestBid = -1;
    for(let i = 0; i < numPlayers; i++) {
      const playerNum = (dealerNumber + i + 1) % numPlayers;
      //if a trick was taken, don't show the first leader anymore
      if(gameState[players[playerNum].playerName].takes[gameState.roundNumber-1] > 0) {
        firstLeader = -1;
        break;
      }
      const bid = gameState[players[playerNum].playerName].bids[gameState.roundNumber-1];
      if (bid > highestBid) {
        highestBid = bid;
        firstLeader = playerNum;
      }
    }


    const takeTrickButtons = players.map((player) => (
      <div key={player.playerNumber}>
        <hr />
        <RecordTricks
          updateTake={this.updateTake.bind(this)}
          playerName={player.playerName}
          currentScore={gameState[player.playerName].scores[gameState.roundNumber-2]}
          currentBid={gameState[player.playerName].bids[gameState.roundNumber-1]}
          currentTake={gameState[player.playerName].takes[gameState.roundNumber-1]}
          isFirstLeader={firstLeader === player.playerNumber}
          isPerfect={player.isPerfect} />
      </div>
    ));
    
    const totalBids = players.map(p => gameState[p.playerName].bids[gameState.roundNumber-1] || 0).reduce((a,b)=>a+b, 0);
    const totalTricks = players.map(p => gameState[p.playerName].takes[gameState.roundNumber-1]).reduce((a,b)=>a+b, 0);
    const roundBalance = totalBids - gameState.roundNumber;
    const numRounds = getNumberOfRounds(this.props.players.length);

    const canEndRound = gameState.roundNumber != numRounds && totalTricks === gameState.roundNumber;
    const canEndGame = gameState.roundNumber == numRounds && totalTricks === gameState.roundNumber; 

    const debugMessage = gameState.isDebug ? "(DEBUG)" : ":";

    return (
      <div>
        <div>
          {roundBalance < 0 && <div className='roundBalance roundBalance-under'>{-roundBalance} under</div>}
          {roundBalance > 0 && <div className='roundBalance roundBalance-over'>{roundBalance} over</div>}
          <h2> Round: {gameState.roundNumber} {debugMessage} </h2>
          <div className="vertDivider"/>
          {takeTrickButtons}
          <hr />
          <div className="vertDivider"/>
          { canEndRound && <button onClick={this.endRound.bind(this)}> End Round </button> }
          { canEndGame && <button onClick={this.endGame.bind(this)}> End Game </button> }
          <button onClick={this.showGameSummaryModal.bind(this)}> Summary </button>
        </div>
        <div className="game-summary-modal">
          <GameSummaryModal 
          players = {this.state.players}
          gameState={this.state.gameState}
          show={this.state.showGameSummaryModal}
          onClose={this.hideGameSummaryModal.bind(this)} />
        </div>
      </div>
    );
  }
}

class RecordTricks extends React.Component {
  
  constructor(props) {
    super(props);
  }

  increaseTake(event) {
    if (this.props.currentTake < 10)
      this.props.updateTake(this.props.playerName, this.props.currentTake + 1)
  }

  decreaseTake(event) {
    if (this.props.currentTake > 0)
      this.props.updateTake(this.props.playerName, this.props.currentTake - 1)
  }

  render() {
    var perfectMark = "";
    if (this.props.isPerfect)
      perfectMark = "*";

    return (
      <div className={`player-row-bid ${this.props.isFirstLeader && 'currentTrick-firstLeader'}`}>
      <h3 className='player-name'> {this.props.playerName}: {this.props.currentScore ? this.props.currentScore : 0} {perfectMark} </ h3>
        <div className="bid">
          <button onClick={this.decreaseTake.bind(this)}>-</button>
          <span className="current-bidtrick">{this.props.currentTake}/{this.props.currentBid} </span>
          <button onClick={this.increaseTake.bind(this)}>+</button>
        </div>
      </div>
    )
  }
}