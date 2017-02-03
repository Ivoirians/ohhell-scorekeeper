import React from 'react';
import ReactDOM from 'react-dom';
import {database} from './firebaseInterface.jsx'
import {PageEnum} from './pageEnum.jsx';


class RoundTricks extends React.Component {
  
  constructor(props) {
    super(props);
    this.state= { players: this.props.players,
                  gameState: this.props.gameState};
  }

  goToRoundBids() {
    this.props.changePage(PageEnum.ROUND_BIDS);
  }

  goToWinScreen() {
    this.props.changePage(PageEnum.WIN_SCREEN);
  }

  endRound() {
    this.props.updateGameState(this.state.players, this.props.roundNumber + 1, this.state.gameState);
    this.goToRoundBids();
  }

  render() {
    return (
      <div>
        <h2> Round: {this.props.roundNumber} </h2>
        <button onClick={this.endRound.bind(this)}> End Round </button>
        <button onClick={this.goToWinScreen.bind(this)}> End Game </button>
      </div>
    );
  }
}

export default RoundTricks;