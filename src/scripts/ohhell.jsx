import React from 'react';
import ReactDOM from 'react-dom';
import * as firebase from 'firebase';

var config = {
  apiKey: "AIzaSyChWYU04cxASlH_NL32nL7IOTs6YnnN_RI",
  authDomain: "ohhellscorekeeper.firebaseapp.com",
  databaseURL: "https://ohhellscorekeeper.firebaseio.com",
  storageBucket: "ohhellscorekeeper.appspot.com",
  messagingSenderId: "165596737293"
};
firebase.initializeApp(config);

var database = firebase.database();


var PageEnum = {
  MAIN_MENU: 1,
  CREATE_GAME: 2,
  ROUND_BIDS: 3,
  ROUND_TRICKS: 4,
  WIN_SCREEN: 5,
  STATISTICS: 6
}


class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {currentPage: PageEnum.MAIN_MENU};
  }

  changePage(newPage) {
    this.setState({
      currentPage: newPage
    });
  }

  render () {
    var partial;
    switch(this.state.currentPage) {
      case PageEnum.Main_MENU:
        partial = <MainMenu changePage={this.changePage.bind(this)} />;
        break;
      case PageEnum.CREATE_GAME:
        partial = <CreateGame changePage={this.changePage.bind(this)} />;
        break;
      case PageEnum.ROUND_BIDS:
        partial = <RoundBids changePage={this.changePage.bind(this)} />;
        break;
      case PageEnum.ROUND_TRICKS:
        partial = <RoundTricks changePage={this.changePage.bind(this)} />;
        break;
      case PageEnum.WIN_SCREEN:
        partial = <WinScreen changePage={this.changePage.bind(this)} />;
        break;
      case PageEnum.STATISTICS:
        partial = <Statistics changePage={this.changePage.bind(this)} />;
        break;
      default:
        partial = <MainMenu changePage={this.changePage.bind(this)} />;
        break;
    }
    return (
      <div>
        {partial}
      </div>
    );
  }
}

class MainMenu extends React.Component {

  constructor(props) {
    super(props);
  };

  goToNewGame(event) {
    this.props.changePage(PageEnum.CREATE_GAME);
  }

  goToStatistics(event) {
    this.props.changePage(PageEnum.STATISTICS);
  }

  render() {
    return (
      <div className="main-menu">
        <h1>Main Menu</h1>
        <ul>
          <button onClick={this.goToNewGame.bind(this)}> New Game </button>
          <button onClick={this.goToStatistics.bind(this)}> Statistics </button>
        </ul>
      </div>
    );
  }
}

class CreateGame extends React.Component {

  returnToMain() {
    this.props.changePage(PageEnum.MAIN_MENU)
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
    this.state = {scorekeeper: '', headerText: 'New Game', players: [], n:0};
  };


  addPlayer(playerNumber, playerName) {
    //check for duplicates, if people are going to be malicious--necessary?
    this.state.players[playerNumber] = {playerName: playerName, playerNumber:playerNumber};
    this.setState({n: 1});

  }

  render() {
    console.log("Rendering form");
    var playerRows = this.state.players.map((player) =>
      <li key={player.playerNumber}>
        {player.playerName}
      </li>
    );
    return (
      <div className="new-game">
        <h1>{this.state.headerText}</h1>
         {playerRows}
        <h2>Players:</h2>
        <form>
          <AddPlayerRow playerNumber={1} addPlayer={this.addPlayer.bind(this)} />
        </form>
        <button onClick={this.returnToMain.bind(this)}> Return to Main Menu </button>
      </div>
    );
  }
}

class AddPlayerRow extends React.Component {

  constructor(props) {
    super(props);
    this.state = {scorekeeper: false, dealer: false, changed: false, playerName: "Player Name"};
  };

  handlePlayerChange(e) {
    this.props.addPlayer(this.props.playerNumber, e.target.value);
    this.setState(
    {
      playerName: e.target.value
    })
  }

  render() {
    return (
      <div className = "player-row">
        <input type="text" value={this.state.playerName} onChange={this.handlePlayerChange.bind(this)} />
      </div>
    );
  }
}



class Statistics extends React.Component {

  returnToMain() {
    this.props.changePage(PageEnum.MAIN_MENU)
  }

  render() {
    return (
      <div className="statistics">
        <h1> Statistics </h1>
        <button onClick={this.returnToMain.bind(this)}> Return to Main Menu </button>
      </div>
    );
  }
}



ReactDOM.render(<App />, document.getElementById('root'));