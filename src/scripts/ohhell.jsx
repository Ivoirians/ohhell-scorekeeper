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
    this.state = {
      currentPage: PageEnum.MAIN_MENU
    };
  }

  changePage(newPage) {
    this.setState({
      currentPage: newPage
    });
  }

  getHeaderText() {
    var headerText;
    switch(this.state.currentPage) {
      case PageEnum.MAIN_MENU:
        headerText = "Main Menu";
        break;
      case PageEnum.CREATE_GAME:
        headerText = "Create Game";
        break;
      case PageEnum.ROUND_BIDS:
        headerText = "Bids";
        break;
      case PageEnum.ROUND_TRICKS:
        headerText = "Tricks";
        break;
      case PageEnum.WIN_SCREEN:
        headerText = "Winner";
        break;
      case PageEnum.STATISTICS:
        headerText = "Statistics";
        break;
      default:
        headerText = "Main Menu";
        break;
    }
    return headerText;
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
        partial = <RoundBids roundNumber={1} changePage={this.changePage.bind(this)} />;
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
      <div id="app-container">
        <h1 id="primary-header">{this.getHeaderText.bind(this)()}</h1>
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
        <ul>
          <button onClick={this.goToNewGame.bind(this)}> New Game </button>
          <button onClick={this.goToStatistics.bind(this)}> Statistics </button>
        </ul>
      </div>
    );
  }
}

class CreateGame extends React.Component {

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
    this.state = {scorekeeper: '', headerText: 'New Game', players: [], n:0};
  };

  addPlayer(playerNumber, playerName) {
    //check for duplicates, if people are going to be malicious--necessary?
    this.state.players[playerNumber] = {playerName: playerName, playerNumber:playerNumber};
    if (playerNumber == this.state.numPlayers)
      this.setState({n: this.state.numPlayers+1});
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

class RoundBids extends React.Component {
  
  constructor(props) {
    super(props);
  }

  goToRoundTricks() {
    this.props.changePage(PageEnum.ROUND_TRICKS);
  }

  render() {
    return (
      <div>
        <button onClick={this.goToRoundTricks.bind(this)}> Finalize Bids </button>
      </div>
    );
  }
}

class RoundTricks extends React.Component {
  
  constructor(props) {
    super(props);
  }

  goToRoundBids() {
    this.props.changePage(PageEnum.ROUND_BIDS);
  }

  goToWinScreen() {
    this.props.changePage(PageEnum.WIN_SCREEN);
  }

  render() {
    return (
      <div>
        <button onClick={this.goToRoundBids.bind(this)}> End Round </button>
        <button onClick={this.goToWinScreen.bind(this)}> End Game </button>
      </div>
    );
  }
}

class WinScreen extends React.Component {
  
  constructor(props) {
    super(props);
  }

  goToMainMenu() {
    this.props.changePage(PageEnum.MAIN_MENU);
  }

  goToStatistics() {
    this.props.changePage(PageEnum.STATISTICS);
  }

  render() {
    return (
      <div>
        <button onClick={this.goToMainMenu.bind(this)}> Back to Main Menu </button>
        <button onClick={this.goToStatistics.bind(this)}> Statistics </button>
      </div>
    );
  }
}

class Statistics extends React.Component {
  
  constructor(props) {
    super(props);
  }

  returnToMain() {
    this.props.changePage(PageEnum.MAIN_MENU)
  }

  render() {
    return (
      <div className="statistics">
        <button onClick={this.returnToMain.bind(this)}> Return to Main Menu </button>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));