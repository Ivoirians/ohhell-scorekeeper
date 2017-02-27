import React from 'react';
import ReactDOM from 'react-dom';
import {database} from './firebaseInterface.jsx'
import {PageEnum} from './pageEnum.jsx';
import {GameSummary} from './utils.jsx';

export default class Statistics extends React.Component {
  
  constructor(props) {
    super(props);
    this.state = {allGames: []};
  }

  returnToMain() {
    this.props.changePage(PageEnum.MAIN_MENU)
  }

  componentWillMount() {
    this.getAllGames();
  }

  getAllGames() {
    var allGames = [];
    var dbRef = database.ref("games").orderByChild("dateCreated");
    dbRef.once("value", function(data) {
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
    var games = this.state.allGames.map((gameWithKey) => 
      <GameSummary key={gameWithKey.key} gameWithKey={gameWithKey} resume={null} showDelete={false}/>
      )
    return (
      <div className="statistics">
        <button onClick={this.returnToMain.bind(this)}> Return to Main Menu </button>
        {games}
      </div>
    );
  }
}
