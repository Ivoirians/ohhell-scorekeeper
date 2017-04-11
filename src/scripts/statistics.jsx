import Enum from 'Enum';
import React from 'react';
import ReactDOM from 'react-dom';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import { database } from './firebaseInterface.jsx'
import { PageEnum } from './pageEnum.jsx';
import { GameSummary, getWinnersAndMessage, countArrayPrefix } from './utils.jsx';

var StatsTab = new Enum([
  "NONE",
  "GAMES",
  "PLAYERS",
]);

class GamePlayers extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      shift:0
    };
  }

  componentWillMount() {
    this.doStats();
  }

  doStats() {
    const { allGames } = this.props;
    let { startDate, endDate, sortOrder, shift } = this.state;
    if (endDate)
      endDate = endDate.clone().add(1, 'days'); //need to add one day so that the end date is inclusive
    let players = {};
    allGames
      .filter(game => !game.state.inProgress && (!startDate || startDate <= moment(game.dateCreated)) && (!endDate || moment(game.dateCreated) <= endDate))
      .forEach(game => {
        //get mapping based on shift in positions
        const mapto = {}
        const playersCount = game.players.length;
        for(let i = 0; i < playersCount; i++)
          mapto[game.players[i].playerName] = game.players[((i - shift) % playersCount + playersCount) % playersCount].playerName;

        //winners
        getWinnersAndMessage(game.players, game.state)[0].forEach(winner => {
          const name = mapto[winner.playerName];
          players[name] = players[name] || {};
          players[name].winCount = (players[name].winCount || 0) + 1;
        });
        //winners no 42
        getWinnersAndMessage(game.players, game.state, true)[0].forEach(winner => {
          const name = mapto[winner.playerName];
          players[name] = players[name] || {};
          players[name].winCountNo42 = (players[name].winCountNo42 || 0) + 1;
        });
        //the rest
        game.players.forEach(player => {
          let name = player.playerName;
          const stats = this.playerStats(game.state[name].bids, game.state[name].takes, game.state[name].scores, game.state.roundNumber);
          name = mapto[name];
          players[name] = players[name] || {};
          players[name].gameCount = (players[name].gameCount || 0) + 1;
          players[name].roundCount = (players[name].roundCount || 0) + stats.roundCount;
          players[name].hitCount = (players[name].hitCount || 0) + stats.hitCount;
          players[name].above42RoundCount = (players[name].above42RoundCount || 0) + stats.above42RoundCount;
          players[name].above42HitCount = (players[name].above42HitCount || 0) + stats.above42HitCount;
          //players[name].totalScore = (players[name].totalScore || 0) + player.currentScore;
        });
      });

    for (let playerName in players) {
      players[playerName].winCount = players[playerName].winCount || 0;
      players[playerName].winCountNo42 = players[playerName].winCountNo42 || 0;
    }

    this.setState({
      players: Object.keys(players).map(name => Object.assign(players[name], { name: name })),
      sortOrder: sortOrder || 'wins'
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
        if (bids[i] === takes[i])
          stats.hitCount++;
        if (i > 0 && scores[i - 1] >= 42) {
          stats.above42RoundCount++;
          if (bids[i] === takes[i])
            stats.above42HitCount++;
        }
      }
    }
    return stats;
  }

  render() {
    const { players, sortOrder } = this.state;

    switch (sortOrder) {
      case 'name': players.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0); break;
      case 'wins': players.sort((a, b) => b.winCount - a.winCount); break;
      case 'winpct': players.sort((a, b) => b.winCount / b.gameCount - a.winCount / a.gameCount); break;
      case 'winpctno42': players.sort((a, b) => b.winCountNo42 / b.gameCount - a.winCountNo42 / a.gameCount); break;
      case 'hitpct': players.sort((a, b) => b.hitCount / b.roundCount - a.hitCount / a.roundCount); break;
      case 'above42hitpct': players.sort((a, b) => b.above42HitCount / b.above42RoundCount - a.above42HitCount / a.above42RoundCount); break;
      case 'games': players.sort((a, b) => b.gameCount - a.gameCount); break;
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

    const highlighted = this.props.allGames.map(g => new Date(g.dateCreated));
    return (
      <div>
        <div className="GamePlayers-filters">
          <button onClick={() => this.setState({ shift: this.state.shift + 1 }, () => this.doStats())}>Left</button>
          <span className="current-bidtrick">{this.state.shift}</span>
          <button onClick={() => this.setState({ shift: this.state.shift - 1 }, () => this.doStats())}>Right</button>          
          <div className="horzDivider"/>
          <button onClick={() => this.setState({ startDateOpen: !this.state.startDateOpen })}>{this.state.startDate ? this.state.startDate.format("DD-MM-YYYY") : "Start Date"}</button>
          {this.state.startDateOpen &&
            <DatePicker
              calendarClassName="calendar"
              endDate={this.state.endDate}
              highlightDates={highlighted}
              inline
              maxDate={moment()}
              minDate={moment("2017-01-01")}
              onChange={(date) => this.setState({ startDate: date, startDateOpen: !this.state.startDateOpen }, () => this.doStats())}
              openToDate={this.state.endDate}
              selected={this.state.startDate}
              selectsStart
              startDate={this.state.startDate}
              withPortal
            />
          }
          <button onClick={() => this.setState({ endDateOpen: !this.state.endDateOpen })}>{this.state.endDate ? this.state.endDate.format("DD-MM-YYYY") : "End Date"}</button>
          {this.state.endDateOpen &&
            <DatePicker
              calendarClassName="calendar"
              endDate={this.state.endDate}
              highlightDates={highlighted}
              inline
              maxDate={moment()}
              minDate={moment("2017-01-01")}
              onChange={(date) => this.setState({ endDate: date, endDateOpen: !this.state.endDateOpen }, () => this.doStats())}
              openToDate={this.state.startDate}
              selected={this.state.endDate}
              selectsEnd
              startDate={this.state.startDate}
              withPortal
            />
          }
          {(this.state.startDate || this.state.endDate) && <button onClick={() => this.setState({ startDate: null, endDate: null }, () => this.doStats())}>Clear</button>}
        </div>
        <div className="vertDivider" />
        <table className="GameWinners">
          <thead>
            <tr>
              <th className={sortOrder == 'name' && 'selected'} onClick={() => this.setState({ sortOrder: 'name' })}>Name</th>
              <th className={sortOrder == 'wins' && 'selected'} onClick={() => this.setState({ sortOrder: 'wins' })}>Wins</th>
              <th className={sortOrder == 'winpct' && 'selected'} onClick={() => this.setState({ sortOrder: 'winpct' })}>Win %</th>
              <th className={sortOrder == 'winpctno42' && 'selected'} onClick={() => this.setState({ sortOrder: 'winpctno42' })}>No 42 Win %</th>
              <th className={sortOrder == 'hitpct' && 'selected'} onClick={() => this.setState({ sortOrder: 'hitpct' })}>Hit %</th>
              <th className={sortOrder == 'above42hitpct' && 'selected'} onClick={() => this.setState({ sortOrder: 'above42hitpct' })}>> 42 Hit %</th>
              <th className={sortOrder == 'games' && 'selected'} onClick={() => this.setState({ sortOrder: 'games' })}>Games</th>
            </tr>
          </thead>
          <tbody>
            {playersStats}
          </tbody>
        </table>
      </div>
    );
  }
}

export default class Statistics extends React.Component {

  constructor(props) {
    super(props);
    this.state = { allGames: [], currentTab: StatsTab.NONE };
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
    dbRef.once("value", function (data) {
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
    const { allGames, currentTab } = this.state;

    var games = currentTab === StatsTab.GAMES && this.state.allGames.map((gameWithKey) =>
      <GameSummary key={gameWithKey.key} gameWithKey={gameWithKey} resume={true} showDelete={true} />
    );
    var players = currentTab === StatsTab.PLAYERS && <GamePlayers allGames={allGames} />;

    return (
      <div className="statistics">
        <div className='statistics-header'>
          <button onClick={this.changeTab.bind(this, StatsTab.GAMES)}> Games </button>
          <button onClick={this.changeTab.bind(this, StatsTab.PLAYERS)}> Players </button>
          <button onClick={this.returnToMain.bind(this)}> Main Menu </button>
        </div>
        <div className="vertDivider" />
        {games}
        {players}
      </div>
    );
  }
}
