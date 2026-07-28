async function test() {
  const loginRes = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@liinexus.com', password: 'Admin@123' })
  });
  const loginData = await loginRes.json();
  const token = loginData.data.accessToken;

  const usersRes = await fetch('http://localhost:4000/api/v1/users', { headers: { Authorization: `Bearer ${token}` } });
  const usersData = await usersRes.json();
  const user = usersData.data.find(u => u.email === 'METAL0001');

  const depsRes = await fetch('http://localhost:4000/api/v1/departments', { headers: { Authorization: `Bearer ${token}` } });
  const depsData = await depsRes.json();
  const newDep = depsData.data.find(d => d.name !== 'METAL01');

  console.log('Sending PATCH with departmentId:', newDep.id);
  const updateRes = await fetch(`http://localhost:4000/api/v1/users/${user.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ departmentId: newDep.id })
  });
  console.log('Update response status:', updateRes.status);
  const updateData = await updateRes.json();
  console.log('Update response body:', updateData);
}
test().catch(console.error);
