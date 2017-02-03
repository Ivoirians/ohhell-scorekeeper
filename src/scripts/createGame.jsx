import React from 'react';
import ReactDOM from 'react-dom';
import {database} from './firebaseInterface.jsx'
import {PageEnum} from './pageEnum.jsx';

export default class CreateGame extends React.Component {

  goToMainMenu() {
    this.props.changePage(PageEnum.MAIN_MENU);
  }

  goToRoundBids() {
    this.props.updateGameState(this.state.players, 1, this.state.gameState);
    this.props.changePage(PageEnum.ROUND_BIDS);
  }

  //creates a gameState object out of the current set of players
  //then changes page to bids
  createGameState() {
    this.setState(
      { gameState : this.state.players.map((player) =>
                    ({currentScores: [0]})
                    ) 
      },
      function() {
        this.goToRoundBids();
      }
    );
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

  updatePlayer(player) {
    //check for duplicates, if people are going to be malicious--necessary?
    this.state.players[player.playerNumber] = player;
    if (player.playerNumber == this.state.numPlayers)
      this.setState({numPlayers: this.state.numPlayers+1});
    this.forceUpdate();
  }

  logStateDebug() {
    console.log(JSON.stringify(this.state));
  }

  render() {
    var playerRows = this.state.players.map((player) =>
      <div key={player.playerNumber}>
        <AddPlayerRow
          playerNumber={player.playerNumber}
          updatePlayer={this.updatePlayer.bind(this)}
          playerName={player.playerName} />
      </div>
    );
    playerRows.push(
      <div key={this.state.numPlayers}>
          <AddPlayerRow playerNumber={this.state.numPlayers} updatePlayer={this.updatePlayer.bind(this)} />
      </div>
    );
    return (
      <div className="new-game">
        <h2>Players:</h2>
        <form>
          {playerRows}
        </form>
        <button onClick={this.createGameState.bind(this)}> Start Round {this.props.roundNumber} </button>
        <button onClick={this.goToMainMenu.bind(this)}> Return to Main Menu </button>
        <button onClick={this.logStateDebug.bind(this)}> Debug </button>
      </div>
    );
  }
}

class AddPlayerRow extends React.Component {

  constructor(props) {
    super(props);
    this.state = {scorekeeper: false, dealer: false, playerName: this.props.playerName};
  };

  handlePlayerNameChange(event) {
    this.setState({playerName: event.target.value},
      this.updateParent)
    /*this.setState(
    {
      playerName: e.target.value
    })*/
  }

  handlePlayerScorekeeperChange(event) {
    this.setState({scorekeeper: event.target.checked},
      this.updateParent)
  }

  updateParent() {
    this.props.updatePlayer({
      playerNumber: this.props.playerNumber,
      playerName: this.state.playerName,
      scorekeeper: this.state.scorekeeper,
      dealer: this.state.dealer
    });
  }

  getClassName() {
    if (this.state.dealer) {
      return "player-row-dealer";
    }
    else if (this.state.scorekeeper) {
      return "player-row-scorekeeper";
    }
    else {
      return "player-row";
    }
  }

  render() {
    return (
      <div className = {this.getClassName()}>
        <input type="text" placeholder="Player Name" onChange={this.handlePlayerNameChange.bind(this)} /> <input type="checkbox" value={this.state.scorekeeper} onChange={this.handlePlayerScorekeeperChange.bind(this)} />
      </div>
    );
  }
}