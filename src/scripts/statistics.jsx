import Enum from 'Enum';
import React from 'react';
import ReactDOM from 'react-dom';
import {database} from './firebaseInterface.jsx'
import {PageEnum} from './pageEnum.jsx';
import {GameSummary, getWinnersAndMessage} from './utils.jsx';

var StatsTab = new Enum([
  "NONE",
  "GAMES",
  "WINNERS",
]);

class GameWinners extends React.Component {
  constructor(props) {
    super(props);
  }

  componentWillMount() {
    const {allGames} = this.props;
    let winners = allGames.reduce(
        (winners, game) => {
          getWinnersAndMessage(game.players, game.state)[0].forEach(winner => winners[winner.playerName] = (winners[winner.playerName] || 0)+1);
          return winners;
        },
        {}
    );

    this.setState({
      winners: Object.keys(winners).map(name => { return {name: name, count: winners[name]} }).sort((a,b)=>b.count-a.count)
    });
  }

  render() {
    const winners = this.state.winners.map(winner => 
      <h3 key={winner.name}>
        <div>{winner.name}: {winner.count}</div>
      </h3>);
    return (
      <div className="GameWinners">
        {winners}
      </div>
    );
  }
}

export default class Statistics extends React.Component {
  
  constructor(props) {
    super(props);
    this.state = {allGames: [], currentTab: StatsTab.NONE};
  }

  changeTab(newTab) {
    this.setState({
      currentTab: newTab
    });
  }

  returnToMain() {
    this.props.changePage(PageEnum.MAIN_MENU)
  }

  componentWillMount() {
    this.getAllGames();
  }

  getAllGames() {
    var allGames = [];
    var dbRef = database.ref("games").orderByChild("dateCreated");
    dbRef.once("value", function(data) {
      var games = data.val();
      for (var key in games) {
        var game = games[key];
        game.key = key;
        allGames.push(game);
      }
      this.setState({
        allGames: allGames.reverse()
      });
    }.bind(this));
  }

  render() {
    const {allGames, currentTab} = this.state;

    var games = currentTab === StatsTab.GAMES && this.state.allGames.map((gameWithKey) => 
      <GameSummary key={gameWithKey.key} gameWithKey={gameWithKey} resume={null} showDelete={false}/>
    );
    var winners = currentTab === StatsTab.WINNERS && <GameWinners allGames={allGames}/>;

    return (
      <div className="statistics">
        <button onClick={this.changeTab.bind(this, StatsTab.GAMES)}> Games </button>
        <button onClick={this.changeTab.bind(this, StatsTab.WINNERS)}> Winners </button>
        <button onClick={this.returnToMain.bind(this)}> Main Menu </button>
        {games}
        {winners}
      </div>
    );
  }
}
