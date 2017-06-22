import React from 'react';
import ReactDOM from 'react-dom';
import MainMenu from './mainMenu.jsx';
import CreateGame from './createGame.jsx';
import RoundBids from './roundBids.jsx';
import RoundTricks from './roundTricks.jsx';
import Statistics from './statistics.jsx';
import WinScreen from './winScreen.jsx';
import {PageEnum} from './pageEnum.jsx';



/***
  This component exists as a container for all of the other components,
  allowing the multi-page app to swap out its pages.

  Because I didn't decide to use Redux, state transition functions need to
  be passed to child components. Leading to a lot of silly looking props
  and functions that really shouldn't be necessary.

  Most pages are passed a list of players and a gameState object, make changes
  to them, and pass them back to this component to be forwarded on to the next
  page.

  Hopefully this is straightforward enough if new pages need to be added,
  or the existing flow of logic needs to be changed.
*/
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


  /***
  Each subpage needs to be passed everything it needs to function.
    changePage - function which triggers this container component to transition to a new page
    updateGameState - function to change the player and gameState, to be passed to the next page
  */
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
                    roundNumber={this.state.gameState.roundNumber}
                    gameState={this.state.gameState}
                    players={this.state.currentPlayers}
                    updateGameState={this.updateGameState.bind(this)}
                    currentGameKey={this.state.currentGameKey} />;
        break;
      case PageEnum.ROUND_TRICKS:
        partial = <RoundTricks changePage={this.changePage.bind(this)}
                    roundNumber = {this.state.gameState.roundNumber}
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
                                currentGameKey={this.state.currentGameKey}
                            updateGameState={this.updateGameState.bind(this)}
                            setCurrentGameKey={this.setCurrentGameKey.bind(this)} />;
        break;
      default:
        partial = <MainMenu changePage={this.changePage.bind(this)}
                            updateGameState={this.updateGameState.bind(this)}
                            setCurrentGameKey={this.setCurrentGameKey.bind(this)} />;
        break;
    }
    return (
      <div>
        <div id="app-container">
          <h1 id="primary-header">{this.getHeaderText.bind(this)()}</h1>
          {partial}
        </div>
        <div id="footer">
          Version 0.0.1
        </div>
      </div>
    );
  }
}

ReactDOM.render(<OhHell />, document.getElementById('root'));