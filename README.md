#Oh Hell Scorekeeper
Scorekeeping app for the Zazzle games lunch crew. Latest deployments currently live at ohhellscorekeeper.firebaseapp.com.

##First-Time Setup
1. Install npm
2. Run "npm run setup" - This will check for existing installations of firebase, firebase-tools, webpack, and webpack-dev-server, and if they don't exist, install them globally. I think firebase might be unnecessary, since firebase-tools is the CLI, but was not certain what was necessary. And without these packages installed globally, I was unable to run the other npm scripts on Windows.
3. Run "npm install" - Does this need to happen every time?
4. Run "firebase login" - Sets up deployment of this project.

##Development
1. Modify src/scripts - Changes to index.html or .css files currently go to the files in public/, but all of the React .jsx files live here and will be webpacked.
2. Run "npm run dev" - This will build the app in memory and serve it using webpack-dev-server. Changes to src/scripts/ will propagate automatically, so you can change the file, refresh your browser, and see the changes immediately.

##Deployment
1. Run "npm run deploy" - Builds with webpack, then calls firebase deploy.

##To Do
* Authentication: or anyone with the URL can write garbage to the database
* Track dealer, scorekeeper, and take order
* Enforce rules (e.g. bids can't add to round number)
* UI Work: Make it look not ugly
* Latest games: Resume in-progress games
* Statistics 
* Add player from Bids page
* Reorder players
* Allow adding players without typing (e.g. clicking on preset names)
