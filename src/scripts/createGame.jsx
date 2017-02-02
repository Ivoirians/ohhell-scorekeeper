import React from 'react';
import ReactDOM from 'react-dom';
import {database} from './firebaseInterface.jsx'
import {PageEnum} from './pageEnum.jsx';

export default class CreateGame extends React.Component {

  goToMainMenu() {
    this.props.changePage(PageEnum.MAIN_MENU);
  }

  goToRoundBids() {
    this.props.changePage(PageEnum.ROUND_BIDS);
  }

  createNewGame(players, scorekeeper, dealer, date) {
    var gameMetaData = {
      dateCreated: date,
      players: players.map((player) => (/*some kind of toString?*/player)),
      scorekeeper: scorekeeper,
      dealer: dealer
    }
    this.state.currentGameKey = database.ref().child('games').push().key;

    var updates = {};
    updates['/games/' + this.state.currentGameKey] = gameMetaData;
    for (var p in players){
      updates['/user-games/' + p.playerName + "/" + this.state.currentGameKey] = gameMetaData; 
    }

    database.ref().update(updates);
  }

  constructor(props) {
    super(props);
    this.state = {scorekeeper: '', headerText: 'New Game', players: [], numPlayers:0};
  };

  addPlayer(playerNumber, playerName) {
    //check for duplicates, if people are going to be malicious--necessary?
    this.state.players[playerNumber] = {playerName: playerName, playerNumber:playerNumber};
    if (playerNumber == this.state.numPlayers)
      this.setState({numPlayers: this.state.numPlayers+1});
    this.forceUpdate();
  }

  logStateDebug() {
    console.log(JSON.stringify(this.state));
  }

  render() {
    var playerRows = this.state.players.map((player) =>
      <div key={player.playerNumber}>
        <AddPlayerRow playerNumber={player.playerNumber} addPlayer={this.addPlayer.bind(this)} playerName={player.playerName} />
      </div>
    );
    playerRows.push(
      <div key={this.state.numPlayers}>
          <AddPlayerRow playerNumber={this.state.numPlayers} addPlayer={this.addPlayer.bind(this)} />
      </div>
    );
    return (
      <div className="new-game">
        <h2>Players:</h2>
        <form>
          {playerRows}
        </form>
        <button onClick={this.goToRoundBids.bind(this)}> Start Round {this.props.roundNumber} </button>
        <button onClick={this.goToMainMenu.bind(this)}> Return to Main Menu </button>
        <button onClick={this.logStateDebug.bind(this)}> Debug </button>
      </div>
    );
  }
}

class AddPlayerRow extends React.Component {

  constructor(props) {
    super(props);
    this.state = {scorekeeper: false, dealer: false, changed: false, playerName: this.props.playerName};
  };

  handlePlayerChange(e) {
    this.props.addPlayer(this.props.playerNumber, e.target.value);
    /*this.setState(
    {
      playerName: e.target.value
    })*/
  }

  render() {
    return (
      <div className = "player-row">
        <input type="text" placeholder="Player Name" value={this.state.playerName} onChange={this.handlePlayerChange.bind(this)} />
      </div>
    );
  }
}