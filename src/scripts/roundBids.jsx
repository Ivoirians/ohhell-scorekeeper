import React from 'react';
import ReactDOM from 'react-dom';
import * as firebase from 'firebase';
import {PageEnum} from './pageEnum.jsx';

class RoundBids extends React.Component {
  
  constructor(props) {
    super(props);
  }

  goToRoundTricks() {
    console.log("Changing to " + PageEnum.ROUND_TRICKS);
    this.props.changePage(PageEnum.ROUND_TRICKS);
  }

  render() {
    return (
      <div>
        <button onClick={this.goToRoundTricks.bind(this)}> Finalize Bids </button>
      </div>
    );
  }
}

export default RoundBids;