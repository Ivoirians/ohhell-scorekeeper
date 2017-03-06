import React from 'react';
import ReactDOM from 'react-dom';
import {database} from './firebaseInterface.jsx'
import {PageEnum} from './pageEnum.jsx';
import {getNumberOfRounds, getGUID} from './utils.jsx';

export default class CreateGame extends React.Component {

  constructor(props) {
    super(props);
    this.state = {scorekeeper: '',
                  headerText: 'New Game',
                  players: [],
                  numPlayers: 0,
                  isDebug: false,
                  allPlayers: {}
                };
  };

  goToMainMenu() {
    this.props.changePage(PageEnum.MAIN_MENU);
  }

  goToRoundBids() {
    //todo: check for duplicate player names
    if (this.state.players.length == 0) {
      this.setState({errorMessage: "No players."});
      return;
    }
    this.createGameKeyAndUpdateFirebase();
    this.props.updateGameState(this.state.players, this.getNewGameState());
    this.props.changePage(PageEnum.ROUND_BIDS);
  }

  handleIsDebug(event) {
    this.setState({isDebug: event.target.checked});
  }

  handlePlayerButton(event) {
    this.updatePlayer({
      playerNumber: this.state.numPlayers,
      playerName: event.target.value,
      scorekeeper: false,
      currentScore: 0,
      isPerfect: true,
      joinedRound: 1,
      uid: getGUID()
    });
  }

  //creates a gameState object out of the current set of players
  //then changes page to bids
  getNewGameState() {
    var gameState = { roundNumber: 1,
                      inProgress: true,
                      isDebug: this.state.isDebug
                    };
    var numRounds = getNumberOfRounds(this.state.players.length);
    for (var playerIndex in this.state.players) {
      var player = this.state.players[playerIndex];
      gameState[player.playerName] = ({
        scores: Array(numRounds + 1).join('0').split('').map(parseFloat),
        bids: Array(numRounds + 1).join('-').split(''),
        takes: Array(numRounds + 1).join('0').split('').map(parseFloat)
      });
    }
    return gameState;
  }

  /***
    Most of this is concurrency-safe because it's a new key.
    The only concern would be the players table update, which should be transaction-ed.
  */
  createGameKeyAndUpdateFirebase() {
    var gameMetaData = {
      dateCreated: new Date(),
      players: this.state.players.map((player) => (/*some kind of toString?*/player))
    }
    var newKey = "test-game";
    if (!this.state.isDebug) {
      newKey = database.ref().child('games').push().key;

      var updates = {};
      updates[`/games/${newKey}`] = gameMetaData;
      for (var p in this.state.players){
        var playerName = this.state.players[p].playerName;
        updates[`/user-games/${playerName}/${newKey}`] = gameMetaData;
        //increment
        database.ref(`/players/${playerName}/count`).transaction(x => (x || 0) + 1);
      }
      database.ref().update(updates);
    }
    this.props.setCurrentGameKey(newKey);
    this.setState({currentGameKey: newKey});
    
  }

  updatePlayer(player) {
    //TODO: check for duplicates, if people are going to be malicious--necessary?
    
    //if playerName is now blank, remove the row
    const newPlayers = this.state.players;
    if (player.playerName == null || player.playerName.length < 1)
    {
      for (var oldPlayer of this.state.players)
      {
        if (oldPlayer.playerNumber > player.playerNumber)
        {
          oldPlayer.playerNumber--;
        }
      }

      newPlayers.splice(player.playerNumber, 1);
      this.setState({numPlayers: this.state.numPlayers-1, players:newPlayers});
    }
    else
    {
      newPlayers[player.playerNumber] = player;

      //increase player count so another row appears
      //if this is the "newest" player
      if (player.playerNumber == this.state.numPlayers)
        this.setState({numPlayers: this.state.numPlayers+1, players:newPlayers});
      this.forceUpdate();

    }


  }

  logStateDebug() {
    console.log(JSON.stringify(this.state));
  }

  componentWillMount() {
    var players = {};
    var dbRef = database.ref("players").orderByChild("count");
    dbRef.once("value", function(data) {
      var counts = data.val();
      for (var playerName in counts) {
        players[playerName] = counts[playerName]["count"];
      }
      this.setState({
        allPlayers: players
      });
    }.bind(this));
  }

  /***
    Idea: Keep track of a count of players.
    Display that many AddPlayerRow components, which update the players state.
    If the last row is modified, increase the count.
  */
  render() {
    var playerButtons = Object.keys(this.state.allPlayers).map((playerName) =>
    {
      //must be a better way to remove already clicked buttons...
      for (var key in this.state.players) {
        if (this.state.players[key].playerName == playerName)
        {
          return null;
        }
      }

      return (
        <div className="add-player-button" key={playerName}>
          <button className="add-player-button" type="button" value={playerName} onClick={this.handlePlayerButton.bind(this)}>
            {playerName}
          </button>
        </div>
      );
    });

    var playerRows = this.state.players.map((player) =>
      <div key={player.uid}>
        <AddPlayerRow
          playerNumber={player.playerNumber}
          updatePlayer={this.updatePlayer.bind(this)}
          playerName={player.playerName}
          uid={player.uid} />
      </div>
    );
    var newPlayerGUID = getGUID();
    playerRows.push(
      <div key={newPlayerGUID}>
          <AddPlayerRow
            playerNumber={this.state.numPlayers}
            updatePlayer={this.updatePlayer.bind(this)}
            uid={newPlayerGUID} />
      </div>
    );

    var errorMessage = "";
    if (this.state.errorMessage) {
      errorMessage = (
          <div className="error-message">
            {this.state.errorMessage}
          </div>
        );
    }
    return (
      <div className="new-game">
        <h2>Players:</h2>
        <form>
          <div className="player-buttons">
            {playerButtons}
          </div>
          <div className="player-rows">
            {playerRows}
          </div>
          Debug: <input type="checkbox" onChange={this.handleIsDebug.bind(this)} label="Debug"></input>
        </form>
        {errorMessage}
        <button onClick={this.goToRoundBids.bind(this)}> Start Round {this.props.roundNumber} </button>
        <button onClick={this.goToMainMenu.bind(this)}> Return to Main Menu </button>
        <button onClick={this.logStateDebug.bind(this)}> Debug </button>
      </div>
    );
  }
}

export class AddPlayerRow extends React.Component {

  constructor(props) {
    super(props);
    this.state = {scorekeeper: false, playerName: this.props.playerName};
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
      currentScore: 0,
      isPerfect: true,
      joinedRound: 1,
      uid: this.props.uid
    });
  }

  getClassName() {
    if (this.state.scorekeeper) {
      return "player-row-scorekeeper";
    }
    else {
      return "player-row";
    }
  }

  render() {
    if (!this.props.playerName)
    {
      return (
        <div className = {this.getClassName()}>
          <input type="text" placeholder="Player Name" onChange={this.handlePlayerNameChange.bind(this)} /> <input type="checkbox" value={this.state.scorekeeper} onChange={this.handlePlayerScorekeeperChange.bind(this)} />
        </div>
      );
    }
    else
    {
      return (
        <div className = {this.getClassName()}>
          <input value={this.props.playerName} type="text" onChange={this.handlePlayerNameChange.bind(this)} /> <input type="checkbox" value={this.state.scorekeeper} onChange={this.handlePlayerScorekeeperChange.bind(this)} />
        </div>
      );
    }
  }
}