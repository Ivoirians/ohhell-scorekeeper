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
  NEW_GAME: 2,
  STATISTICS: 3
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

  returnToMain() {
    this.changePage(PageEnum.MAIN_MENU)
  }

  render () {
    var partial;
    if (this.state.currentPage === PageEnum.MAIN_MENU)
    {
      partial = <MainMenu changePage={this.changePage.bind(this)} />;
    } 
    else if (this.state.currentPage === PageEnum.STATISTICS)
    {
      partial = <Statistics returnToMain={this.returnToMain.bind(this)} />;
    }
    else if (this.state.currentPage === PageEnum.NEW_GAME)
    {
      partial = <Game returnToMain={this.returnToMain.bind(this)} />
    }
    else 
    {
      //default page
      partial = <MainMenu changePage={this.changePage.bind(this)} />;
    }
    return (
      <div>
        {partial}
      </div>
    );
  }
}

class CreateGame extends React.Component {

}

class Game extends React.Component {

  createNewGame(players, scorekeeper, dealer) {
    var gameMetaData = {
      dtmCreated: new Date(),
      players: players,
      scorekeeper: scorekeeper,
      dealer: dealer
    }
    this.state.currentGameKey = database.ref().child('games').push().key;

    var updates = {};
    updates['/games/' + this.state.currentGameKey] = gameMetaData;
    for (var p in players){
      updates['/user-games/' + p + "/" + this.state.currentGameKey] = gameMetaData; 
    }

    database.ref().update(updates);
  }

  constructor(props) {
    super(props);
    this.state = {scorekeeper: '', headerText: 'New Game'};
  };



  render() {
    return (
      <div className="new-game">
        <h1>{this.state.headerText}</h1>
        <form>
          Scorekeeper: <input type="text" value={this.state.value}></input>
        </form>
        <button onClick={this.props.returnToMain}> Return to Main Menu </button>
      </div>
    );
  }
}



class Statistics extends React.Component {
  render() {
    return (
      <div className="statistics">
        <h1> Statistics </h1>
        <button onClick={this.props.returnToMain}> Return to Main Menu </button>
      </div>
    );
  }
}

class MainMenu extends React.Component {

  constructor(props) {
    super(props);
  };

  goToNewGame(event) {
    this.props.changePage(PageEnum.NEW_GAME);
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


ReactDOM.render(<App />, document.getElementById('root'));