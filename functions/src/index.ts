import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
const cors = require('cors')({ origin: true, });

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

admin.initializeApp();

interface IGame {
    key: string;
    league: string;
}

const matchLeague = (game: IGame, league: string) => {
    return (game.league || 'Zazzle') === league;
}

const getAllGames = async (league: string) => {
    const dbRef = admin.database().ref("games").orderByChild("dateCreated");
    const allGames = [] as IGame[];
    await dbRef.once("value", data => {
        console.log(data);
        const games = data.val() as IGame[];
        for (const key in games) {
            const game = games[key];
            game.key = key;
            if (matchLeague(game, league))
                allGames.push(game);

        }
        allGames.reverse();
    });
    return allGames;
}

export const allgames = functions.https.onRequest(async (request, response) => {
    return cors(request, response, async () => {
        try {
            const allGames = await getAllGames(request.query.league || 'Zazzle');
            response.send(allGames);
        }
        catch (e) {
            console.error(e);
        }
    });
});
