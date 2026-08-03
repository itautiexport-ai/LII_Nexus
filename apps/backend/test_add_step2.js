const axios = require('axios');
async function run() {
  try {
    const login = await axios.post('http://localhost:3000/api/v1/auth/login', { email: 'admin@liinexus.com', password: 'admin' });
    const cookie = login.headers['set-cookie'][0];
    const fmsRes = await axios.get('http://localhost:3000/api/v1/fms', { headers: { Cookie: cookie } });
    console.log(fmsRes.data);
  } catch (err) {
    console.error(err);
  }
}
run();
