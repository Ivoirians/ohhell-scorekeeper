import React from 'react'
import ReactDOM from 'react-dom'

alert("Help")
class MainMenu extends React.Component {
  render() {
    return (
      <div className="main-menu">
        <h1>Main Menu</h1>
        <ul>
          <li>New Game</li>
          <li>Statistics</li>
        </ul>
      </div>
    );
  }
}
