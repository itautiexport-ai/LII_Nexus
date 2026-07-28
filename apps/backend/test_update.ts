import axios from 'axios';
async function test() {
  const loginRes = await axios.post('http://localhost:4000/api/v1/auth/login', {
    email: 'admin@liinexus.com',
    password: 'Admin@123'
  });
  const token = loginRes.data.data.accessToken;
  const usersRes = await axios.get('http://localhost:4000/api/v1/users', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const user = usersRes.data.data.find(u => u.email === 'METAL0001');
  console.log('Before update:', user.department, user.departmentId);

  const depsRes = await axios.get('http://localhost:4000/api/v1/departments', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const newDep = depsRes.data.data.find(d => d.name !== 'METAL01');
  console.log('Changing to department:', newDep.name, newDep.id);

  const updateRes = await axios.patch(`http://localhost:4000/api/v1/users/${user.id}`, {
    departmentId: newDep.id
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const usersRes2 = await axios.get('http://localhost:4000/api/v1/users', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const user2 = usersRes2.data.data.find(u => u.email === 'METAL0001');
  console.log('After update:', user2.department, user2.departmentId);
}
test().catch(console.error);
