import React from 'react'
import ReactDOM from 'react-dom'



class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  render () {
    var partial;
    if (this.state.currentPage === 'main-menu')
    {
      partial = <MainMenu />;
    } 
    else if (this.state.currentPage === 'statistics')
    {
      partial = <Statistics />;
    }
    else if (this.state.currentPage === 'newGame')
    {
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
    this.changeState = this.changeState.bind(this);
  };


  changeState(state) {;
    this.currentPage = state;
    //ReactDOM.render(<App />, document.getElementById('root'));
  };

  render() {
    return (
      <div className="main-menu">
        <h1>Main Menu</h1>
        <ul>
          <button onClick={this.changeState('main-menu')}> New Game </button>
          <button onClick={this.changeState('statistics')}> Statistics </button>
        </ul>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));