import React from 'react'
import ReactDOM from 'react-dom'

var PageEnum = {
  MAIN_MENU: 1,
  NEW_GAME: 2,
  STATISTICS: 3
}


class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {currentPage: PageEnum.MAIN_MENU};
  }
  render () {
    var partial;
    console.log(this + " " + this.state + " " + this.state.currentPage);
    if (this.state.currentPage === PageEnum.MAIN_MENU)
    {
      partial = <MainMenu />;
    } 
    else if (this.state.currentPage === PageEnum.STATISTICS)
    {
      partial = <Statistics />;
    }
    else if (this.state.currentPage === PageEnum.NEW_GAME)
    {
      partial = <NewGame />
    }
    else 
    {
      //default page
      partial = <MainMenu />;
    }
    return (
      <div>
        {partial}
      </div>
    );
  }
}


class Statistics extends React.Component {
  render() {
    return (
      <div className="statistics">
      </div>
    );
  }
}

class NewGame extends React.Component {
  render() {
    return (
      <div className="new-game">
      </div>
    );
  }
}


class MainMenu extends React.Component {

  constructor(props) {
    super(props);
  };

  createNewGame(event) {
    this.setState({currentPage : PageEnum.NEW_GAME});
  }

  viewStatistics(event) {
    this.setState({currentPage : PageEnum.STATISTICS});
  }

  render() {
    console.log("Main Menu: " + this.state);
    return (
      <div className="main-menu">
        <h1>Main Menu</h1>
        <ul>
          <button onClick={this.createNewGame.bind(this)}> New Game </button>
          <button onClick={this.viewStatistics.bind(this)}> Statistics </button>
        </ul>
      </div>
    );
  }
}


ReactDOM.render(<App />, document.getElementById('root'));