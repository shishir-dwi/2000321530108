const exp = require('express');
const ax = require('axios');
const moment = require('moment');
const NodeCache = require('node-cache');

const app = exp();
const trainCache = new NodeCache({ stdTTL: 60 * 5 }); // Cache data for 5 minutes

const API_BASE_URL = 'https://api.johndoe-railways.com';


async function fetchAccessToken() {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/token`, {
        accessCode: ACCESS_CODE,
      });
      return response.data.accessToken;
    } catch (error) {
      throw new Error('Failed to fetch access token from the API.');
    }
  }

async function fetchTrainData() {
  try {
    const response = await ax.get(`${API_BASE_URL}/trains`, {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch train data from the API.');
  }
}

function processTrainData(trains) {
  const currentTime = moment();
  const twelveHoursLater = moment().add(12, 'hours');
  const filteredTrains = trains.filter(train => {
    const departureTime = moment(train.departureTime).add(train.delayMinutes, 'minutes');
    return departureTime.isAfter(twelveHoursLater) && departureTime.isAfter(currentTime);
  });

  filteredTrains.sort((a, b) => {
    // Sort by price (ascending)
    if (a.price < b.price) return -1;
    if (a.price > b.price) return 1;

    // Sort by tickets availability (descending)
    if (a.ticketsAvailable > b.ticketsAvailable) return -1;
    if (a.ticketsAvailable < b.ticketsAvailable) return 1;

    // Sort by actual departure time (descending)
    const aDeparture = moment(a.departureTime).add(a.delayMinutes, 'minutes');
    const bDeparture = moment(b.departureTime).add(b.delayMinutes, 'minutes');
    if (aDeparture.isBefore(bDeparture)) return 1;
    if (aDeparture.isAfter(bDeparture)) return -1;

    return 0;
  });

  return filteredTrains;
}

app.get('/trains', async (req, res) => {
  try {
    const cachedData = trainCache.get('trainData');
    if (cachedData) {
      return res.json(cachedData);
    }

    const trains = await fetchTrainData();
    const processedTrains = processTrainData(trains);

    trainCache.set('trainData', processedTrains);

    return res.json(processedTrains);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
