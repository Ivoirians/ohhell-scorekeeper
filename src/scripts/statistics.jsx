import React from 'react';
import ReactDOM from 'react-dom';
import {database} from './firebaseInterface.jsx'
import {PageEnum} from './pageEnum.jsx';

export default class Statistics extends React.Component {
  
  constructor(props) {
    super(props);
  }

  returnToMain() {
    this.props.changePage(PageEnum.MAIN_MENU)
  }

  render() {
    return (
      <div className="statistics">
        <button onClick={this.returnToMain.bind(this)}> Return to Main Menu </button>
      </div>
    );
  }
}
