import { Layout, LayoutProps, Menu } from 'react-admin';
import {
  Dashboard as DashboardIcon,
  HealthAndSafety,
  TrendingUp,
  Policy,
} from '@mui/icons-material';

const AdminMenu = () => (
  <Menu>
    <Menu.DashboardItem />
    <Menu.ResourceItem name="users" />
    <Menu.ResourceItem name="questions" />
    <Menu.ResourceItem name="interviews" />
    <Menu.ResourceItem name="tickets" />
    <Menu.ResourceItem name="feedback" />
    <Menu.ResourceItem name="ml-models" />
    <Menu.Item
      to="/system-health"
      primaryText="System Health"
      leftIcon={<HealthAndSafety />}
    />
    <Menu.Item
      to="/peak-usage"
      primaryText="Peak Usage"
      leftIcon={<TrendingUp />}
    />
    <Menu.Item
      to="/audit-logs"
      primaryText="Audit Logs"
      leftIcon={<Policy />}
    />
  </Menu>
);

export const AdminLayout = (props: LayoutProps) => (
  <Layout {...props} menu={AdminMenu} />
);
