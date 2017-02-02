import React from 'react';
import ReactDOM from 'react-dom';
import * as firebase from 'firebase';
import {PageEnum} from './pageEnum.jsx';

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

  render() {
    return (
      <div className="main-menu">
        <ul>
          <button onClick={this.goToNewGame.bind(this)}> New Game </button>
          <button onClick={this.goToStatistics.bind(this)}> Statistics </button>
        </ul>
      </div>
    );
  }
}