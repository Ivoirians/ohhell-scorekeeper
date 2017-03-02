import Enum from 'Enum';
import React from 'react';
import ReactDOM from 'react-dom';
import {database} from './firebaseInterface.jsx'
import {PageEnum} from './pageEnum.jsx';
import {GameSummary, getWinnersAndMessage} from './utils.jsx';

var StatsTab = new Enum([
  "NONE",
  "GAMES",
  "PLAYERS",
]);

class GamePlayers extends React.Component {
  constructor(props) {
    super(props);
  }

  componentWillMount() {
    const {allGames} = this.props;
    let players = {};
    allGames
      .filter(game => !game.state.inProgress)
      .forEach(game => {
        //winners
        getWinnersAndMessage(game.players, game.state)[0].forEach(winner => {
          players[winner.playerName] = players[winner.playerName] || {};
          players[winner.playerName].winCount = (players[winner.playerName].winCount || 0) + 1;
        });
        //the rest
        game.players.forEach(player => {
          const name = player.playerName;
          players[name] = players[name] || {};
          players[name].gameCount = (players[name].gameCount || 0) + 1;
          players[name].roundCount = (players[name].roundCount || 0) + game.state.roundNumber;
          players[name].totalScore = (players[name].totalScore || 0) + player.currentScore;
        });
    });

    this.setState({
      players: Object.keys(players).map(name => Object.assign(players[name], {name: name})),
      sortOrder: 'wins'
    });
  }

  render() {
    const {players, sortOrder} = this.state;

    switch(sortOrder){
      case 'name': players.sort((a,b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0); break;
      case 'wins': players.sort((a,b) => b.winCount - a.winCount); break;
      case 'winpct': players.sort((a,b) => b.winCount / b.gameCount - a.winCount / a.gameCount); break;
      case 'pointave': players.sort((a,b) => b.totalScore / b.roundCount - a.totalScore / a.roundCount); break;
      case 'games': players.sort((a,b) => b.gameCount - a.gameCount); break;
    }

    const playersStats = this.state.players.map(player => 
      <tr key={player.name}>
        <td>{player.name}</td>
        <td>{player.winCount}</td>
        <td>{Math.round(100 * player.winCount / player.gameCount)}</td>        
        <td>{Math.round(100 * player.totalScore / player.roundCount) / 100}</td>
        <td>{player.gameCount}</td>        
      </tr>);
    return (
      <table className="GameWinners">
        <thead>
          <tr>
            <th onClick={()=>this.setState({sortOrder: 'name'})}>Name {sortOrder == 'name' && '*'}</th>
            <th onClick={()=>this.setState({sortOrder: 'wins'})}>Wins {sortOrder == 'wins' && '*'}</th>
            <th onClick={()=>this.setState({sortOrder: 'winpct'})}>Win % {sortOrder == 'winpct' && '*'}</th>
            <th onClick={()=>this.setState({sortOrder: 'pointave'})}>Point Ave {sortOrder == 'pointave' && '*'}</th>             
            <th onClick={()=>this.setState({sortOrder: 'games'})}>Games {sortOrder == 'games' && '*'}</th>
          </tr>
        </thead>
        <tbody>
        {playersStats}
        </tbody>
      </table>
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
    var players = currentTab === StatsTab.PLAYERS && <GamePlayers allGames={allGames}/>;

    return (
      <div className="statistics">
        <div className='statistics-header'>
          <button onClick={this.changeTab.bind(this, StatsTab.GAMES)}> Games </button>
          <button onClick={this.changeTab.bind(this, StatsTab.PLAYERS)}> Players </button>
          <button onClick={this.returnToMain.bind(this)}> Main Menu </button>
        </div>
        {games}
        {players}
      </div>
    );
  }
}
