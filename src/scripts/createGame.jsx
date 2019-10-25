import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash'
import { PageEnum } from './pageEnum.jsx';
import { appStore } from './appStore.jsx';
import { database } from './firebaseInterface.jsx'
import { getNumberOfRounds, getGUID } from './utils.jsx';

export default class CreateGame extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      addedPlayers: [],
      allPlayers: {},
      headerText: 'New Game',
      isDebug: false,
      numPlayers: 0,
      players: [],
      threshold42: 2
    };
  };

  startGames() {
    //todo: check for duplicate player names
    if (this.state.addedPlayers.length == 0) {
      this.setState({ errorMessage: "No players." });
      return;
    }
    this.createGamesAndUpdateFirebase(this.state.addedPlayers);
    this.goToMainMenu();
  }

  goToMainMenu() {
    this.props.changePage(PageEnum.MAIN_MENU);
  }

  handleAddPlayer(event) {
    const name = this.state.playerName;
    if(name)
      database.ref(`pendingPlayers/${appStore.league}/${name}`).set(true);
  }

  handlePlayerNameChange(event) {
    this.setState({ playerName: event.target.value });
  }

  handleDelPlayer(playerName) {
    database.ref(`pendingPlayers/${appStore.league}/${playerName}`).remove();
  }

  handleIsDebug(event) {
    this.setState({ isDebug: event.target.checked });
  }

  handlePlayerButton(event) {
    database.ref(`pendingPlayers/${appStore.league}/${event.target.value}`).set(true);
  }

  //creates a gameState object out of the current set of players
  //then changes page to bids
  getNewGameState(players) {
    const numPlayers = players.length;
    var gameState = {
      roundNumber: 1,
      inProgress: true,
      isDebug: this.state.isDebug,
      threshold42: numPlayers > 5 ? 1 : 2
    };
    var numRounds = getNumberOfRounds(numPlayers);
    for (var player of players) {
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
  createGamesAndUpdateFirebase(playerNames) {
    playerNames = _.shuffle(playerNames);

    const league = appStore.league;
    const playerCount = playerNames.length;
    const tables = Math.floor(playerCount / 4) || 1;
    const tableSize = Math.floor(playerCount / tables);
    let extraPlayers = playerCount - (tables * tableSize);
    let start = 0;
    for(let table = 0; table < tables; table++) {
      let end = start + tableSize;
      if(extraPlayers) {
        end++;
        extraPlayers--;
      }
      const players = playerNames.slice(start, end).map((name, i) => ({
        playerNumber: i,
        playerName: name,
        currentScore: 0,
        isPerfect: true,
        deny42: false,
        joinedRound: 1
      }));
      start = end;

      var gameMetaData = {
        dateCreated: new Date(),
        league: league,
        players
      }
      var newKey = "test-game";
      if (!this.state.isDebug) {
        newKey = database.ref().child('games').push().key;

        var updates = {};
        updates[`/games/${newKey}`] = gameMetaData;
        for (var player of players) {
          var playerName = player.playerName;
          updates[`/players/${playerName}/leagues/${league}/active`] = true;
          //increment
          database.ref(`/players/${playerName}/count`).transaction(x => (x || 0) + 1);
        }
        database.ref().update(updates);
      }
      else {
        newKey = database.ref().child('games-debug').push().key;

        var updates = {};
        updates[`/games-debug/${newKey}`] = gameMetaData;
        database.ref().update(updates);
      }
      this.props.updateFirebase(newKey, this.getNewGameState(players), players);
    }

    database.ref(`pendingPlayers/${appStore.league}`).remove();
  }

  componentWillMount() {
    var league = appStore.league;
    database.ref("players").orderByChild("count").once("value",  data => {
      this.setState({
        allPlayers: data.val()
      });
    }).then(() =>{
      database.ref(`pendingPlayers/${league}`).on("value", data => {
        const addedPlayers = data.val() ? Object.keys(data.val()) : [];
        addedPlayers.sort();
        this.setState({
          addedPlayers
        })
      });
    });
  }

  /***
    Idea: Keep track of a count of players.
    Display that many AddPlayerRow components, which update the players state.
    If the last row is modified, increase the count.
  */
  render() {
    var playerButtons = Object.keys(this.state.allPlayers).map((playerName) => {
      var player = this.state.allPlayers[playerName];
      if (player.leagues && player.leagues[appStore.league] && player.leagues[appStore.league].active) {
        //must be a better way to remove already clicked buttons...
        for (var name of this.state.addedPlayers) {
          if (name == playerName) {
            return null;
          }
        }

        return (
          <div className="add-player-button" key={playerName}>
            <button className="add-player-button" type="button" value={playerName} onClick={(this.handlePlayerButton)}>
              {playerName}
            </button>
          </div>
        );
      }
    });

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
            <input type="text" placeholder="Player Name" onChange={this.handlePlayerNameChange.bind(this)} />
            <input type="button" value="add" onClick={this.handleAddPlayer.bind(this)}/>
          </div>
          <div className="player-rows">
            {this.state.addedPlayers && this.state.addedPlayers.map(p =>
              <div className="player-row">
                <input value={p} type="text" disabled />
                <input type="button" value="del" onClick={() => this.handleDelPlayer(p)}/>
              </div>
            )}
          </div>
          Debug: <input type="checkbox" onChange={this.handleIsDebug.bind(this)} label="Debug"></input>
        </form>
        {errorMessage}
        <button onClick={this.startGames.bind(this)}> Start Game(s) </button>
        <button onClick={this.goToMainMenu.bind(this)}> Return to Main Menu </button>
      </div >
    );
  }
}