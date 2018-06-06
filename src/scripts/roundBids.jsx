import React from 'react';
import ReactDOM from 'react-dom';
import { database } from './firebaseInterface.jsx'
import { PageEnum } from './pageEnum.jsx';
import { AddPlayerRow } from './createGame.jsx';
import { getNumberOfRounds, getGUID, GameSummaryModal } from './utils.jsx';

export default class RoundBids extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      roundNumber: this.props.roundNumber,
      players: this.props.players,
      gameState: this.props.gameState,
      newPlayerGUID: getGUID(),
      showAddPlayer: false,
      showGameSummaryModal: false
    };
    this.gameRef = database.ref((this.state.gameState.isDebug ? '/games-debug/' : '/games/') + this.props.currentGameKey + '/state')
  }

  componentWillMount() {
    //update firebase on mount - this allows to later resume the game even if no bids were ever finalized
    this.updateFirebase();
  }

  componentWillUnmount() {
    this.gameRef.off();
  }

  decrementRound() {
    this.changeRoundNumber(this.state.gameState.roundNumber - 1);
  }

  incrementRound() {
    this.changeRoundNumber(this.state.gameState.roundNumber + 1);
  }

  changeRoundNumber(roundNumber) {
    if (roundNumber > 0 && roundNumber <= getNumberOfRounds(this.state.players.length)) {
      //not clear why both have to change...
      this.setState({ roundNumber: roundNumber });
      this.state.gameState.roundNumber = roundNumber;
      this.forceUpdate();
    }
  }

  goToMainMenu() {
    this.updateFirebase();
    this.props.changePage(PageEnum.MAIN_MENU);
  }

  goToRoundTricks() {
    this.updateFirebase();
    this.props.updateGameState(this.state.players, this.state.gameState);
    this.props.changePage(PageEnum.ROUND_TRICKS);
  }

  updateBid(playerName, newBid) {
    this.state.gameState[playerName].bids[this.state.roundNumber - 1] = parseInt(newBid);
    this.updateFirebase();
    this.forceUpdate();
  }

  /*** Untested function for adding a new player from this bid page. */
  addPlayer() {
    const playerName = this.state.newPlayerName;
    if (!playerName) {
      //just return, maybe retoggle the button
      console.log("Error: Did not add player");
      this.toggleAddPlayer();
      return;
    }
    //lowest score
    var minScore = this.state.players[0].currentScore;
    for (var player of this.state.players) {
      if (player.currentScore < minScore)
        minScore = player.currentScore
    }

    const joinedRound = this.state.roundNumber;

    var newPlayer =
      {
        playerNumber: this.state.players.length,
        playerName: playerName,
        scorekeeper: false,
        dealer: false,
        currentScore: minScore,
        isPerfect: joinedRound === 1, //judgment call here, late joiners aren't perfect (except if they are not actually late)
        deny42: false,
        joinedRound
      };

    this.state.players.push(newPlayer);

    var numRounds = getNumberOfRounds(this.state.players.length);

    var newGameState =
      {
        scores: Array(numRounds + 1).join('0').split('').map(parseFloat),
        bids: Array(numRounds + 1).join('-').split(''),
        takes: Array(numRounds + 1).join('0').split('').map(parseFloat)
      };
    newGameState["scores"][this.state.roundNumber - 2] = minScore;
    this.state.gameState[playerName] = newGameState;

    //clear everything out
    this.setState({ showAddPlayer: false, newPlayerName: null });

    if (!this.state.gameState.isDebug) {
      //increment player count and update firebase (for data consistency)
      database.ref(`/players/${playerName}/count`).transaction(x => (x || 0) + 1);
      this.updateFirebase();
    }
  }

  updatePlayer(player) {
    //all we want is the name
    this.setState({ newPlayerName: player.playerName });
  }

  updateFirebase() {
    if (!this.state.gameState.isDebug) {
      var updates = {};
      updates['/games/' + this.props.currentGameKey + '/state'] = this.state.gameState;
      updates['/games/' + this.props.currentGameKey + '/players'] = this.state.players;
      for (var p in this.state.players) {
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

  logStateDebug() {
    console.log(JSON.stringify(this.state));
  }

  /***
    Logic for this was a bit annoying to throw inline into render,
    but would also be annoying to create a standalone component.

    Sucks that while using React, the phrase "Even though it makes sense,
    making a component for this would just be more annoying than not."

    Should have learned Redux.
  */
  getAddPlayerComponent() {
    if (!this.state.showAddPlayer) {
      return (<button onClick={this.toggleAddPlayer.bind(this)}>Add New Player </button>);
    }
    else {
      return (
        <div className="add-player-from-bids-dialog-container">
          <button className="add-player-from-bids-dialog" onClick={this.toggleAddPlayer.bind(this)}> Cancel </button>

          <AddPlayerRow className="add-player-from-bids-dialog"
            playerNumber={this.state.players.length}
            updatePlayer={this.updatePlayer.bind(this)}
            uid={this.state.newPlayerGUID}
            clickOnce={true} />

          <button className="add-player-from-bids-dialog" onClick={this.addPlayer.bind(this)}> Add </button>
        </div>
      )
    }
  }

  toggleAddPlayer() {
    this.setState({ showAddPlayer: !this.state.showAddPlayer });
  }

  showGameSummaryModal() {
    this.setState({ showGameSummaryModal: true });
  }

  hideGameSummaryModal() {
    this.setState({ showGameSummaryModal: false });
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
    const roundNumber = this.state.roundNumber;
    const gameState = this.state.gameState;
    const players = this.state.players.filter(x => x.joinedRound <= roundNumber);
    const numPlayers = players.length;
    const totalNumRounds = getNumberOfRounds(numPlayers);
    const dealerNumber = (roundNumber - 1) % numPlayers;
    let currentBidder = (dealerNumber + 1) % numPlayers;
    while (gameState[players[currentBidder].playerName].bids[roundNumber - 1] !== "-") {
      currentBidder = (currentBidder + 1) % numPlayers;
      if (currentBidder == (dealerNumber + 1) % numPlayers) {
        currentBidder = -1;
        break;
      }
    }

    const totalBids = players.map(p => gameState[p.playerName].bids[roundNumber - 1] || 0).reduce((a, b) => (+a || 0) + (+b || 0), 0);
    const roundBalance = totalBids - roundNumber;

    const canFinalize = currentBidder < 0 && roundBalance != 0;
    const pendingBids = players.map((player) => (
      <div key={player.playerNumber}>
        <hr />
        <PendingBid
          roundNumber={roundNumber}
          playerName={player.playerName}
          currentScore={this.state.gameState[player.playerName].scores[roundNumber - 2]}
          currentBid={this.state.gameState[player.playerName].bids[roundNumber - 1]}
          updateBid={this.updateBid.bind(this)}
          maxBid={100}
          isPerfect={player.isPerfect}
          deny42={player.deny42}
          isDealer={dealerNumber === player.playerNumber}
          isCurrentBidder={currentBidder === player.playerNumber} />
      </div>
    ));

    const debugMessage = gameState.isDebug ? "(DEBUG)" : "";
    const errorMessage = "";
    return (
      <div>
        {roundBalance < 0 && <div className='roundBalance roundBalance-under'>{-roundBalance} under</div>}
        {roundBalance > 0 && <div className='roundBalance roundBalance-over'>{roundBalance} over</div>}
        <div>
          <button className="change-round" onClick={this.decrementRound.bind(this)}> &lt; </button>
          <div className="bids-round-number"> Round: {this.state.roundNumber}/{totalNumRounds} {debugMessage} </div>
          <button className="change-round" onClick={this.incrementRound.bind(this)}> &gt; </button>
        </div>
        <div className="vertDivider" />
        {pendingBids}
        <hr />
        <div className="vertDivider" />
        {canFinalize && <button onClick={this.goToRoundTricks.bind(this)}> Finalize Bids </button>}
        <button onClick={this.showGameSummaryModal.bind(this)}> Summary </button>
        <button onClick={this.goToMainMenu.bind(this)}> Back to Main Menu </button>
        {this.getAddPlayerComponent()}
        <div className="game-summary-modal">
          <GameSummaryModal
            players={this.state.players}
            gameState={this.state.gameState}
            show={this.state.showGameSummaryModal}
            onClose={this.hideGameSummaryModal.bind(this)} />
        </div>
      </div>
    );
  }
}

class PendingBid extends React.Component {
  constructor(props) {
    super(props);
  }

  increaseBid(event) {
    var newBid = 0;
    if (this.props.currentBid === "-")
      newBid = 1;
    else if (this.props.currentBid < this.props.maxBid)
      newBid = this.props.currentBid + 1;
    this.props.updateBid(this.props.playerName, newBid);
  }

  decreaseBid(event) {
    var newBid = 0;
    if (this.props.currentBid === "-")
      newBid = 0;
    else if (this.props.currentBid > 0)
      newBid = this.props.currentBid - 1;
    this.props.updateBid(this.props.playerName, newBid);
  }

  render() {
    var mark = "";
    if (this.props.isPerfect)
      mark = "*";
    else if (this.props.deny42)
      mark = "!";

    return (
      <div className={`player-row-bid ${this.props.isDealer && 'pending-bid-dealer'}`}>
        <h3 className="player-name"> {this.props.playerName}: {this.props.currentScore || 0} {mark} </h3>

        <div className={`bid${this.props.isCurrentBidder ? " current-bidder" : ""}`}>
          <button onClick={this.decreaseBid.bind(this)}>{this.props.currentBid === "-" ? "0" : "-"}</button>
          <span className="current-bidtrick"> {this.props.currentBid} </span>
          <button onClick={this.increaseBid.bind(this)}>+</button>
        </div>
      </div>
    )
  }
}