import React from 'react';
import ReactDOM from 'react-dom';
import {PageEnum} from './pageEnum.jsx';

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

  render() {
    return (
      <div>
        <button onClick={this.goToMainMenu.bind(this)}> Back to Main Menu </button>
        <button onClick={this.goToStatistics.bind(this)}> Statistics </button>
      </div>
    );
  }
}