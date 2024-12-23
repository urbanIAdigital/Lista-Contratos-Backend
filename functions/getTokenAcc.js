const axios = require("axios");

const getToken = async (clientId, clientSecret) => {
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
  };
  const url = `https://developer.api.autodesk.com/authentication/v2/token`;
  const body = {
    client_id: "SEdW5pOOiaaYQ1xfKgNNt8PVyd1pBdEgjZ2jEo6PWAuPXnmy",
    client_secret:
      "7Rc84IHWGT7upLxbhOvLj3wKNRqAYdAN3k8BzKp9aM7ep5VTJavYtpGV7w7srwkj",
    grant_type: "client_credentials",
    scope:
      "data:read data:write bucket:read bucket:create viewables:read account:read",
  };
  const { data } = await axios.post(url, body, { headers });
  return data.access_token;
};
module.exports = { getToken };
