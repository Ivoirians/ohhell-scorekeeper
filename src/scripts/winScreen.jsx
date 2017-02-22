import React from 'react';
import ReactDOM from 'react-dom';
import {PageEnum} from './pageEnum.jsx';
import {getWinnersAndMessage, Scoreboard} from './utils.jsx';

export default class WinScreen extends React.Component {
  
  constructor(props) {
    super(props);
  }

  goToMainMenu() {
    this.props.changePage(PageEnum.MAIN_MENU);
  }

  goToStatistics() {
    this.props.changePage(PageEnum.STATISTICS);
  }

  getWinMessage() {
    return getWinnersAndMessage(this.props.players, this.props.gameState);
  }

  render() {
    return (
      <div>
        <div className="winReason">
          {this.getWinMessage.bind(this)()[1]}
        </div>
        <Scoreboard players={this.props.players} gameState={this.props.gameState} />
        <button onClick={this.goToMainMenu.bind(this)}> Back to Main Menu </button>
        <button onClick={this.goToStatistics.bind(this)}> Statistics </button>
      </div>
    );
  }
}