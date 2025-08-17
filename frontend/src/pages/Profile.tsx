import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  Grid,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { getCurrentUser } from '../store/slices/authSlice';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Profile: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [tabValue, setTabValue] = useState(0);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: '',
      });
    }
  }, [user]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Profile updated successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage('New passwords do not match');
      return;
    }
    setMessage('Password changed successfully!');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        My Profile
      </Typography>

      {message && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Profile Information" />
            <Tab label="Change Password" />
            <Tab label="Addresses" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <form onSubmit={handleProfileSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="firstName"
                  value={profileData.firstName}
                  onChange={handleProfileChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  value={profileData.lastName}
                  onChange={handleProfileChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleProfileChange}
                />
              </Grid>
              <Grid item xs={12}>
                <Button type="submit" variant="contained" size="large">
                  Update Profile
                </Button>
              </Grid>
            </Grid>
          </form>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <form onSubmit={handlePasswordSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Current Password"
                  name="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="New Password"
                  name="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Confirm New Password"
                  name="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Button type="submit" variant="contained" size="large">
                  Change Password
                </Button>
              </Grid>
            </Grid>
          </form>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Saved Addresses
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No saved addresses yet. Add an address during checkout to save it for future orders.
          </Typography>
          <Button variant="outlined" sx={{ mt: 2 }}>
            Add New Address
          </Button>
        </TabPanel>
      </Card>
    </Box>
  );
};

export default Profile;
