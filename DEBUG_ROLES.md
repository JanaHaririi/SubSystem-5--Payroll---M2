# Debug System Roles Issue

## Steps to Debug:

### 1. Check what the API returns
Open your browser console (F12) and run:
```javascript
fetch('http://localhost:4000/employee-profile/me', {
  credentials: 'include'
})
.then(r => r.json())
.then(data => console.log('Profile data:', JSON.stringify(data, null, 2)))
```

Look for the `systemRoles` or `accessProfileId` field in the response.

### 2. Check the database
The issue might be:
- The `accessProfileId` is not set on your employee profile
- The `employee_system_roles` collection doesn't have a role entry for your employee

### 3. Temporary Fix - Update Role Check Logic

The current role check looks for:
```javascript
const isHR = userRoles.some((role: any) => {
  const roles = role.roles || [];
  return roles.includes("HR_ADMIN") || roles.includes("HR_MANAGER");
});
```

But the data structure might be different. Let me create a more flexible version.
