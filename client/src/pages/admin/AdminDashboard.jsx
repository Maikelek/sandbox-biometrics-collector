import React from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { Box } from '@mui/material';

const drawerWidth = 240;
const miniDrawerWidth = 72;

const AdminDashboard = () => {

  return (
    <>
      <AdminSidebar />
      <Box
        component="main"
        sx={{
          ml: { xs: `${miniDrawerWidth}px`, sm: `${miniDrawerWidth}px`, md: `${drawerWidth}px` },
          p: 3,
          transition: 'margin-left 0.3s ease-in-out',
        }}
      >
        <h1>Dashboard</h1>
      </Box>
    </>
  );
};

export default AdminDashboard;
