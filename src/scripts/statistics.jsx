import Enum from 'Enum';
import React from 'react';
import ReactDOM from 'react-dom';
import {database} from './firebaseInterface.jsx'
import {PageEnum} from './pageEnum.jsx';
import {GameSummary, getWinnersAndMessage, countArrayPrefix} from './utils.jsx';

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
        //winners no 42
        getWinnersAndMessage(game.players, game.state, true)[0].forEach(winner => {
          players[winner.playerName] = players[winner.playerName] || {};
          players[winner.playerName].winCountNo42 = (players[winner.playerName].winCountNo42 || 0) + 1;
        });        
        //the rest
        game.players.forEach(player => {
          const name = player.playerName;
          const stats = this.playerStats(game.state[name].bids, game.state[name].takes, game.state[name].scores, game.state.roundNumber);
          players[name] = players[name] || {};
          players[name].gameCount = (players[name].gameCount || 0) + 1;
          players[name].roundCount = (players[name].roundCount || 0) + stats.roundCount;
          players[name].hitCount = (players[name].hitCount || 0) + stats.hitCount;
          players[name].above42RoundCount = (players[name].above42RoundCount || 0) + stats.above42RoundCount;
          players[name].above42HitCount = (players[name].above42HitCount || 0) + stats.above42HitCount;                 
          //players[name].totalScore = (players[name].totalScore || 0) + player.currentScore;
        });
    });

    for(let playerName in players) {
      players[playerName].winCount = players[playerName].winCount || 0;
      players[playerName].winCountNo42 = players[playerName].winCountNo42 || 0;
    }

    this.setState({
      players: Object.keys(players).map(name => Object.assign(players[name], {name: name})),
      sortOrder: 'wins'
    });
  }

  playerStats(bids, takes, scores, rounds) {
    rounds = Math.min(rounds, bids.length);

    const stats = {
      roundCount: 0,
      hitCount: 0,
      above42RoundCount: 0,
      above42HitCount: 0
    }

    for (var i = 0; i < rounds; i++) {
      if (bids[i] !== '-') {
        stats.roundCount++;
        if(bids[i] === takes[i])
          stats.hitCount++;
        if(i > 0 && scores[i-1] >= 42){
          stats.above42RoundCount++;
          if(bids[i] === takes[i])
            stats.above42HitCount++;
        }
      }
    }
    return stats;
  }

  render() {
    const {players, sortOrder} = this.state;

    switch(sortOrder){
      case 'name': players.sort((a,b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0); break;
      case 'wins': players.sort((a,b) => b.winCount - a.winCount); break;
      case 'winpct': players.sort((a,b) => b.winCount / b.gameCount - a.winCount / a.gameCount); break;
      case 'winpctno42': players.sort((a,b) => b.winCountNo42 / b.gameCount - a.winCountNo42 / a.gameCount); break;      
      case 'hitpct': players.sort((a,b) => b.hitCount / b.roundCount - a.hitCount / a.roundCount); break;
      case 'above42hitpct': players.sort((a,b) => b.above42HitCount / b.above42RoundCount - a.above42HitCount / a.above42RoundCount); break;
      case 'games': players.sort((a,b) => b.gameCount - a.gameCount); break;
    }

    const playersStats = this.state.players.map(player => 
      <tr key={player.name}>
        <td>{player.name}</td>
        <td>{player.winCount}</td>
        <td>{(100 * player.winCount / player.gameCount).toFixed(1)}</td>
        <td>{(100 * player.winCountNo42 / player.gameCount).toFixed(1)}</td>              
        <td>{(100 * player.hitCount / player.roundCount).toFixed(1)}</td>
        <td>{(100 * player.above42HitCount / player.above42RoundCount || 0).toFixed(1)}</td>        
        <td>{player.gameCount}</td>        
      </tr>);
    return (
      <table className="GameWinners">
        <thead>
          <tr>
            <th className={sortOrder == 'name' && 'selected'} onClick={()=>this.setState({sortOrder: 'name'})}>Name</th>
            <th className={sortOrder == 'wins' && 'selected'} onClick={()=>this.setState({sortOrder: 'wins'})}>Wins</th>
            <th className={sortOrder == 'winpct' && 'selected'} onClick={()=>this.setState({sortOrder: 'winpct'})}>Win %</th>
            <th className={sortOrder == 'winpctno42' && 'selected'} onClick={()=>this.setState({sortOrder: 'winpctno42'})}>No 42 Win %</th>            
            <th className={sortOrder == 'hitpct' && 'selected'} onClick={()=>this.setState({sortOrder: 'hitpct'})}>Hit %</th>    
            <th className={sortOrder == 'above42hitpct' && 'selected'} onClick={()=>this.setState({sortOrder: 'above42hitpct'})}>> 42 Hit %</th>                       
            <th className={sortOrder == 'games' && 'selected'} onClick={()=>this.setState({sortOrder: 'games'})}>Games</th>
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
