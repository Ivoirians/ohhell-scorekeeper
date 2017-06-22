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
      shift:0,
      sortOrder: 'wins',
      showModal: false
    };
  }

  componentWillMount() {
    this.doStats();
  }

  doStats() {
    let { allGames } = this.props;
    let { startDate, endDate } = this.state;
    allGames = allGames.filter(game => !game.state.inProgress && (!startDate || startDate <= moment(game.dateCreated)) && (!endDate || moment(game.dateCreated) <= endDate));
    this.setState({players: this.playerStatsForGames(allGames)}, () => this.doDiff());
  }

  doDiff() {
    let { allGames } = this.props;
    let { startDate } = this.state;

    const endDate = this.state.endDate || moment();
    const diffDate = this.state.diffDate || moment(endDate).startOf('day').add(-1, 'second');    

    allGames = allGames.filter(game => !game.state.inProgress && (!startDate || startDate <= moment(game.dateCreated)) && moment(game.dateCreated) <= diffDate);
    const previous = this.playerStatsForGames(allGames)

    const diff = {};
    for(let player of this.state.players) {
      diff[player.name] =
      {
        winCount: player.winCount,
        winPct: player.winPct,
        winPctNo42: player.winPctNo42,
        hitPct: player.hitPct,
        above42HitPct: player.above42HitPct,
        gameCount: player.gameCount
      };
    }

    for(let player of previous) {
      const d = diff[player.name];
      d.winCount -= player.winCount;
      d.winPct -= player.winPct;
      d.winPctNo42 -= player.winPctNo42;
      d.hitPct -= player.hitPct;
      d.above42HitPct -= player.above42HitPct;
      d.gameCount -= player.gameCount;
    }

    this.setState({diff});
  }

  playerStatsForGames(games) {
    let players = {};
    games
      .forEach(game => {
        //get mapping based on shift in positions
        const mapto = {}
        const playersCount = game.players.length;
        for(let i = 0; i < playersCount; i++)
          mapto[game.players[i].playerName] = game.players[((i - this.state.shift) % playersCount + playersCount) % playersCount].playerName;

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
          const stats = this.playerStatsForGame(game.state[name].bids, game.state[name].takes, game.state[name].scores, game.state.roundNumber);
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

    let above42HitCount = 0;
    let above42RoundCount = 0;
    let gameCount = 0;
    let hitCount = 0;
    let roundCount = 0;
    let winCount = 0;
    let winCountNo42 = 0;

    for (let playerName in players) {
      players[playerName].winCount = players[playerName].winCount || 0;
      players[playerName].winCountNo42 = players[playerName].winCountNo42 || 0;

      above42HitCount += players[playerName].above42HitCount;
      above42RoundCount += players[playerName].above42RoundCount;
      gameCount += players[playerName].gameCount;
      hitCount += players[playerName].hitCount;
      roundCount += players[playerName].roundCount;
      winCount += players[playerName].winCount;
      winCountNo42 += players[playerName].winCountNo42;
    }

    players['---'] = {
      above42HitCount,
      above42RoundCount,
      gameCount: games.length,
      hitCount,
      roundCount,
      winCount,
      winCountNo42
    }

    return Object.keys(players).map(name => { 
      const player = players[name];
      return {
        name,
        winCount: player.winCount,
        winPct: 100 * player.winCount / player.gameCount,
        winPctNo42: 100 * player.winCountNo42 / player.gameCount,
        hitPct: 100 * player.hitCount / player.roundCount,
        above42HitPct: 100 * player.above42HitCount / (player.above42RoundCount || 1),
        gameCount: player.gameCount
      };
    });
  }

  playerStatsForGame(bids, takes, scores, rounds) {
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
        if (i > 0 && scores[i - 1] > 42) {
          stats.above42RoundCount++;
          if (bids[i] === takes[i])
            stats.above42HitCount++;
        }
      }
    }
    return stats;
  }

  getDiffElement(num)
  {
    if (!this.state.diffShow)
      return "";
    if (num > 0) {
      return <span className="diff positive"> (+{num}) </span>;
    }
    else if (num < 0) {
      return <span className="diff negative"> ({num}) </span>;
    }
    else {
      return <span className="diff"> (0.0) </span>;
    }
  }

  showProfile(playerName)
  {
    var playerGames = this.props.allGames.filter(function(game) {
        return game.players.some(function(player) { return player.playerName == playerName });
      });
    this.setState({
      showModal: true,
      playerName: playerName,
      playerStats: this.processGames(playerGames, playerName)
    });
  }

  processGames(playerGames, playerName) {
    var numGames = playerGames.length;
    var playerStats = {totalGames : numGames, bidRounds : [], bidHits : []};
    playerGames.forEach(game => {
      var numPlayers = game.players.length;
      playerStats.totalPlayers = (playerStats.totalPlayers || 0) + numPlayers;
      var playerNumber = game.players.filter(function(player) { return player.playerName == playerName})[0].playerNumber;
      if (playerNumber == 0) {
        //first round dealer
        playerStats.firstRoundDealer = (playerStats.firstRoundDealer || 0) + 1;
      }

      var playerState = game.state[playerName];
      for (var i = 0; i < playerState.bids.length; i++) {
        
        var bid = playerState.bids[i];
        if (bid == '-') {
          continue;
        }
        playerStats.bidRounds[bid] = (playerStats.bidRounds[bid] || 0) + 1;
        if (playerState.takes[i] == bid) {
          //hit
          playerStats.bidHits[bid] = (playerStats.bidHits[bid] || 0) + 1;
        }

        //dealer hits
        if ((playerNumber + i) % numPlayers == 0) {
          //isDealer
          playerStats.dealerRounds = (playerStats.dealerRounds || 0) + 1;
          if (playerState.bids[i] == playerState.takes[i]) {
            playerStats.dealerHits = (playerStats.dealerHits || 0) + 1;
          }
        }
      }


    });
    playerStats.averagePlayersPerGame = playerStats.totalPlayers / numGames;
    playerStats.averageFirstDealer = numGames / playerStats.firstRoundDealer;
    playerStats.dealerHitRate = 100 * playerStats.dealerHits / playerStats.dealerRounds;
    return playerStats;
  }

  hideModal() {
    this.setState({showModal: false});
  }

  render() {
    const { players, sortOrder } = this.state;
    const startDate = this.state.startDate || moment("2017-01-01");
    const endDate = this.state.endDate || moment();
    const diffMaxDate = moment(endDate).add(-1, 'days');
    const diffDate = this.state.diffDate || diffMaxDate;

    const stats = this.state.players;

    switch (sortOrder) {
      case 'name': stats.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0); break;
      case 'wins': stats.sort((a, b) => b.winCount - a.winCount); break;
      case 'winpct': stats.sort((a, b) => b.winPct - a.winPct); break;
      case 'winpctno42': stats.sort((a, b) => b.winPctNo42 - a.winPctNo42); break;
      case 'hitpct': stats.sort((a, b) => b.hitPct - a.hitPct); break;
      case 'above42hitpct': stats.sort((a, b) => b.above42HitPct - a.above42HitPct); break;
      case 'games': stats.sort((a, b) => b.gameCount - a.gameCount); break;
    }

    const playersStats = stats.map(player =>
      {
        if (!this.state.diff || !this.state.diff[player.name])
        {
          //waiting for doDiff to finish.
          return (<div> "Loading..."; </div>)
        }
        var diffPlayer = this.state.diff[player.name];
        return (<tr className={`tr-${player.name}`} key={player.name}>
          <td><div onClick={() => this.showProfile(player.name)}>{player.name}</div></td>
          <td>{player.winCount} {this.getDiffElement(diffPlayer.winCount)}</td>
          <td>{player.winPct.toFixed(1)} {this.getDiffElement(diffPlayer.winPct.toFixed(1))}</td>
          <td>{player.winPctNo42.toFixed(1)} {this.getDiffElement(diffPlayer.winPctNo42.toFixed(1))}</td>
          <td>{player.hitPct.toFixed(1)} {this.getDiffElement(diffPlayer.hitPct.toFixed(1))}</td>
          <td>{player.above42HitPct.toFixed(1)} {this.getDiffElement(diffPlayer.above42HitPct.toFixed(1))}</td>
          <td>{player.gameCount} {this.getDiffElement(diffPlayer.gameCount)}</td>
        </tr>);
    });

    const highlighted = this.props.allGames.map(g => moment(g.dateCreated).startOf('day'));
    const highlightedDiff = highlighted.filter(d => startDate <= d && d <= diffMaxDate);
    return (
      <div>
        <div className="GamePlayers-filters">
          <div>
            <button onClick={() => this.setState({ shift: this.state.shift + 1 }, () => this.doStats())}>Left</button>
            <span className="shift">{this.state.shift}</span>
            <button onClick={() => this.setState({ shift: this.state.shift - 1 }, () => this.doStats())}>Right</button>          
          </div>
          <div>
            <button onClick={() => this.setState({ diffShow: !this.state.diffShow})}>{this.state.diffShow ? 'No Diff' : 'Diff'}</button>
            <button onClick={() => this.setState({ diffDateOpen: !this.state.diffDateOpen })}>{diffDate.format("MM-DD-YY")}</button>            
            {this.state.diffDateOpen &&
              <DatePicker
                calendarClassName="calendar"
                highlightDates={highlightedDiff}
                inline
                maxDate={diffMaxDate}
                minDate={startDate}
                onChange={(date) => this.setState({ diffDate: moment(date).add(23, 'h'), diffDateOpen: !this.state.diffDateOpen }, () => this.doDiff())}
                openToDate={diffDate}             
                withPortal
              />
            }
          </div>
          <div>
            <button onClick={() => this.setState({ startDateOpen: !this.state.startDateOpen })}>{this.state.startDate ? startDate.format("MM-DD-YY") : "Start"}</button>
            {this.state.startDateOpen &&
              <DatePicker
                calendarClassName="calendar"
                highlightDates={highlighted}
                inline
                maxDate={moment()}
                minDate={moment("2017-01-01")}
                onChange={(date) => this.setState({ startDate: date, startDateOpen: !this.state.startDateOpen, diffDate: null }, () => this.doStats())}
                openToDate={this.state.endDate}
                withPortal
              />
            }
            <button onClick={() => this.setState({ endDateOpen: !this.state.endDateOpen })}>{this.state.endDate ? endDate.format("MM-DD-YY") : "End"}</button>
            {this.state.endDateOpen &&
              <DatePicker
                calendarClassName="calendar"
                highlightDates={highlighted}
                inline
                maxDate={moment()}
                minDate={moment("2017-01-01")}
                onChange={(date) => { console.log(date); return this.setState({ endDate: moment(date).add(23, 'h'), endDateOpen: !this.state.endDateOpen, diffDate: null }, () => this.doStats())}}
                openToDate={this.state.startDate}
                withPortal
              />
            }
            {(this.state.startDate || this.state.endDate) && <button onClick={() => this.setState({ startDate: null, endDate: null, diffDate: null }, () => this.doStats())}>Clear</button>}
          </div>
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
        <ExtraPlayerStatistics playerName={this.state.playerName} playerStats={this.state.playerStats} show={this.state.showModal} onClose={this.hideModal.bind(this)} />
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

  loadGame(gameWithKey) {
    this.props.updateGameState(gameWithKey.players, gameWithKey.state);
    this.props.setCurrentGameKey(gameWithKey.key);
    this.props.changePage(PageEnum.ROUND_BIDS);
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
      <GameSummary key={gameWithKey.key} gameWithKey={gameWithKey} resume={this.loadGame.bind(this)} showDelete={gameWithKey.state.inProgress} />
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

class ExtraPlayerStatistics extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    if (!this.props.show) {
      return null;
    }

    var stats = this.props.playerStats

    //get per bid stats
    var perBids = [];
    for (var i in stats.bidRounds) {
      perBids.push(<div key={'hit-' + i}>Hit ({i}) : {stats.bidHits[i] || 0}/{stats.bidRounds[i]} = {(100 * (stats.bidHits[i] || 0)/stats.bidRounds[i]).toFixed(2)}%</div>)
    }
    return (
        <div className="backdrop">
          <div className="player-modal">
            <h2>{this.props.playerName}</h2>
            <div>
              <div>Total Games: {stats.totalGames}</div>
              <div>Average First-Round-Dealer: 1/{stats.averageFirstDealer.toFixed(2)}</div>
              <div>Average Players per Game: {stats.averagePlayersPerGame.toFixed(2)}</div>
              <div>Dealer round hit rate: {stats.dealerHitRate.toFixed(2)}%</div>
              {perBids}
            </div>
            <div className="footer">
              <button onClick={this.props.onClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      );
  }
}
