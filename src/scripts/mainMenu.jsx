import React from 'react';
import ReactDOM from 'react-dom';
import {database} from './firebaseInterface.jsx'
import {PageEnum} from './pageEnum.jsx';
import {getGameSummary, GameSummary} from './utils.jsx';

export default class MainMenu extends React.Component {

  constructor(props) {
    super(props);
  };

  goToNewGame(event) {
    this.props.changePage(PageEnum.CREATE_GAME);
  }

  goToStatistics(event) {
    this.props.changePage(PageEnum.STATISTICS);
  }

  loadGame(gameWithKey) {
    this.props.updateGameState(gameWithKey.players, gameWithKey.state);
    this.props.setCurrentGameKey(gameWithKey.key);
    this.props.changePage(PageEnum.ROUND_BIDS);
  }

  render() {
    return (
      <div className="main-menu">
        <button onClick={this.goToNewGame.bind(this)}> New Game </button>
        <button onClick={this.goToStatistics.bind(this)}> Statistics </button>
        <LatestGames loadGame={this.loadGame.bind(this)} numberOfGames={3} debug={false}/>
        {/*
        <div>
          <h3> Debug Games </h3>
          <LatestGames loadGame={this.loadGame.bind(this)} numberOfGames={3} debug={true}/>
        </div>
        */}
      </div>
    );
  }
}

class LatestGames extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      latestGames: [],
      dbRefName: this.props.debug ? "games-debug" : "games"
    };
  };

  componentDidMount() {
    var latestGames = [];
    var dbRef = database.ref(this.state.dbRefName).orderByChild("dateCreated").limitToLast(this.props.numberOfGames);
    dbRef.once("value", function(data) {
      var games = data.val();
      for (var key in games) {
        var game = games[key];
        game.key = key;
        latestGames.push(game);
      }
      this.setState({
        latestGames: latestGames.reverse()
      });
    }.bind(this));

  }

  resume(gameWithKey) {
    this.props.loadGame(gameWithKey);
  }

  render () {
    var games = this.state.latestGames.map((gameWithKey) => 
      <GameSummary key={gameWithKey.key} gameWithKey={gameWithKey} resume={this.resume.bind(this)} />
    );

    return (
      <div className="latest-games">
      <h3> Recent Games: </h3>
        {games}
      </div>
    )
  }
}