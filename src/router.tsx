import { createBrowserRouter, Navigate } from 'react-router-dom'
import HostPage from '@/pages/HostPage'
import PlayPage from '@/pages/PlayPage'

export const router = createBrowserRouter([
  { path: '/',      element: <Navigate to="/host" replace /> },
  { path: '/host',  element: <HostPage /> },
  { path: '/play',  element: <PlayPage /> },
  { path: '*',      element: <Navigate to="/host" replace /> },
])
