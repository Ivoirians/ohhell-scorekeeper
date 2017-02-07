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
    var game = gameWithKey[gameWithKey.key];
    this.props.updateGameState(game.players, game.state);
    this.props.setCurrentGameKey(gameWithKey.key);
    this.props.changePage(PageEnum.ROUND_BIDS);
  }

  render() {
    return (
      <div className="main-menu">
        <ul>
          <button onClick={this.goToNewGame.bind(this)}> New Game </button>
          <button onClick={this.goToStatistics.bind(this)}> Statistics </button>
          <LatestGames loadGame={this.loadGame.bind(this)} />
        </ul>
      </div>
    );
  }
}

class LatestGames extends React.Component {

  constructor(props) {
    super(props);
    this.state = {latestGames: []};
  };

  componentWillMount() {
    var latestGames = [];
    var dbRef = database.ref("games").orderByChild("dateCreated").limitToLast(3);
    dbRef.once("value", function(data) {
      var game = data.val();
      game.key = Object.keys(game)[0];
      latestGames.push(game);
      this.setState({
        latestGames: latestGames
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