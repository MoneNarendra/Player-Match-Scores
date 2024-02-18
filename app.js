const express = require('express')
const app = express()
app.use(express.json())

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const path = require('path')
const dbPath = path.join(__dirname, 'cricketMatchDetails.db')

let db = null

const consvertPlayerDetailstoDbResponse = eachPlayer => {
  return {
    playerId: eachPlayer.player_id,
    playerName: eachPlayer.player_name,
  }
}

const consvertMatchDetailstoDbResponse = eachMatch => {
  return {
    matchId: eachMatch.match_id,
    match: eachMatch.match,
    year: eachMatch.year,
  }
}

const initializeDbAndRespond = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log(
        'Server Running... https://narendrakumar3sdyxnjscpscvyl.drops.nxtwave.tech/players/',
      )
    })
  } catch (e) {
    console.log(`Error Msg: ${e.message}`)
    process.exit(1)
  }
}

initializeDbAndRespond()

// GET Player

app.get('/players/', async (request, response) => {
  const getPlayersQuary = `SELECT * FROM player_details`
  const dbResponse = await db.all(getPlayersQuary)
  response.send(
    dbResponse.map(eachPlayer => consvertPlayerDetailstoDbResponse(eachPlayer)),
  )
})

// GET Player

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerQuary = `SELECT * FROM player_details WHERE player_id = ${playerId}`
  const dbResponse = await db.get(getPlayerQuary)
  response.send(consvertPlayerDetailstoDbResponse(dbResponse))
})

// PUT player

app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const {playerName} = request.body
  const updatePlayerQuary = `
  UPDATE 
    player_details
  SET 
    player_name = '${playerName}'`

  await db.run(updatePlayerQuary)
  response.send('Player Details Updated')
})

// GET match details of a specific match

app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getMatchesQuary = `SELECT 
    *
  FROM
    match_details
  WHERE
    match_id = ${matchId}`
  const dbResponse = await db.get(getMatchesQuary)
  response.send(consvertMatchDetailstoDbResponse(dbResponse))
})

// GET  list of all the matches of a player

app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const getPlayersMatchesQuary = `
  SELECT 
    match_details.match_id,
    match_details.match,
    match_details.year
  FROM
    match_details NATURAL JOIN player_match_score
  WHERE
    player_id = ${playerId}`
  const dbResponse = await db.all(getPlayersMatchesQuary)
  response.send(
    dbResponse.map(eachMatch => consvertMatchDetailstoDbResponse(eachMatch)),
  )
})

// GET list of players of a specific match

app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const getMatchPlayersQuary = `
  SELECT
	  player_details.player_id AS playerId,
	  player_details.player_name AS playerName
	FROM player_match_score NATURAL JOIN player_details
    WHERE match_id=${matchId};`
  const dbResponse = await db.all(getMatchPlayersQuary)
  response.send(dbResponse)
})

app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const getPlayerScoreQuary = `SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};`

  // const ans = dbResponse => {
  //   return {
  //     playerId: dbResponse['player_id'],
  //     playerName: dbResponse['player_name'],
  //     totalScore: dbResponse['SUM(player_match_score.score)'],
  //     totalFours: dbResponse['SUM(player_match_score.fours)'],
  //     totalSixes: dbResponse['SUM(player_match_score.sixes)'],
  //   }
  // }

  const dbResponse = await db.get(getPlayerScoreQuary)
  response.send(dbResponse)
})

module.exports = app
