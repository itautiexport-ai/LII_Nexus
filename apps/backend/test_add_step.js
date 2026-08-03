const axios = require('axios');
async function run() {
  try {
    const login = await axios.post('http://localhost:3000/api/v1/auth/login', { email: 'admin@liinexus.com', password: 'admin' });
    const cookie = login.headers['set-cookie'][0];
    const fmsRes = await axios.get('http://localhost:3000/api/v1/fms', { headers: { Cookie: cookie } });
    const fmsList = fmsRes.data.data;
    if (fmsList.length < 2) return console.log('Not enough FMS to test cross dependency');
    const fms1 = fmsList[0];
    const fms2 = fmsList[1];
    const stepsRes = await axios.get(`http://localhost:3000/api/v1/fms/${fms2.id}/steps`, { headers: { Cookie: cookie } });
    const fms2Steps = stepsRes.data.data;
    if (fms2Steps.length === 0) return console.log('No steps in fms2');
    const payload = {
      stepName: "Test Cross Step",
      doerEmployeeIds: [],
      timelineHours: 1,
      timelineUnit: "hours",
      crossFmsId: fms2.id,
      crossFmsStepId: fms2Steps[0].id
    };
    const addRes = await axios.post(`http://localhost:3000/api/v1/fms/${fms1.id}/steps`, payload, { headers: { Cookie: cookie } });
    console.log(addRes.data);
  } catch (err) {
    console.error(err.response ? err.response.data : err);
  }
}
run();
