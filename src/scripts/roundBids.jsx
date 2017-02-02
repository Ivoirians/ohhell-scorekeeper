import React from 'react';
import ReactDOM from 'react-dom';
import {database} from './firebaseInterface.jsx'
import {PageEnum} from './pageEnum.jsx';

class RoundBids extends React.Component {
  
  constructor(props) {
    super(props);
  }

  goToRoundTricks() {
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