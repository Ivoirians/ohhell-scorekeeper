import React from 'react';
import ReactDOM from 'react-dom';
import MainMenu from './mainMenu.jsx';
import CreateGame from './createGame.jsx';
import RoundBids from './roundBids.jsx';
import RoundTricks from './roundTricks.jsx';
import Statistics from './statistics.jsx';
import WinScreen from './winScreen.jsx';
import {PageEnum} from './pageEnum.jsx';

class OhHell extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPage: PageEnum.MAIN_MENU,
    };
  }

  changePage(newPage) {
    this.setState({
      currentPage: newPage
    });
  }

  updateGameState(players, gameState) {
    this.setState({
      currentPlayers: players,
      gameState: gameState
    },
    function() {
      //console.log("State updated: " + JSON.stringify(this.state));
    });
  }

  setCurrentGameKey(key) {
    this.setState( {
      currentGameKey: key
    })
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
      case PageEnum.MAIN_MENU:
        partial = <MainMenu changePage={this.changePage.bind(this)}
                            updateGameState={this.updateGameState.bind(this)}
                            setCurrentGameKey={this.setCurrentGameKey.bind(this)} />;
        break;
      case PageEnum.CREATE_GAME:
        partial = <CreateGame changePage={this.changePage.bind(this)}
                    updateGameState={this.updateGameState.bind(this)}
                    setCurrentGameKey={this.setCurrentGameKey.bind(this)} />;
        break;
      case PageEnum.ROUND_BIDS:
        partial = <RoundBids changePage={this.changePage.bind(this)}
                    gameState={this.state.gameState}
                    players={this.state.currentPlayers}
                    updateGameState={this.updateGameState.bind(this)}
                    currentGameKey={this.state.currentGameKey} />;
        break;
      case PageEnum.ROUND_TRICKS:
        partial = <RoundTricks changePage={this.changePage.bind(this)}
                    gameState={this.state.gameState}
                    players={this.state.currentPlayers}
                    updateGameState={this.updateGameState.bind(this)}
                    currentGameKey={this.state.currentGameKey} />;
        break;
      case PageEnum.WIN_SCREEN:
        partial = <WinScreen  changePage={this.changePage.bind(this)}
                              currentGameKey={this.state.currentGameKey}
                              gameState={this.state.gameState}
                              players={this.state.currentPlayers} />;
        break;
      case PageEnum.STATISTICS:
        partial = <Statistics   changePage={this.changePage.bind(this)}
                                currentGameKey={this.state.currentGameKey} />;
        break;
      default:
        partial = <MainMenu changePage={this.changePage.bind(this)}
                            updateGameState={this.updateGameState.bind(this)}
                            setCurrentGameKey={this.setCurrentGameKey.bind(this)} />;
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

ReactDOM.render(<OhHell />, document.getElementById('root'));