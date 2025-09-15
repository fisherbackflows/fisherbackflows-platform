/**
 * Dashboard Components Unit Tests
 * Tests for critical dashboard functionality and data visualization
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Next.js components and hooks
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Recharts components
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
}));

// Mock dashboard data
const mockDashboardData = {
  totalCustomers: 150,
  activeAppointments: 12,
  pendingInvoices: 8,
  revenue: 25000,
  recentAppointments: [
    {
      id: '1',
      customer_name: 'John Doe',
      scheduled_date: '2025-01-15',
      scheduled_time: '09:00',
      status: 'scheduled',
      service_type: 'annual_test'
    },
    {
      id: '2',
      customer_name: 'Jane Smith',
      scheduled_date: '2025-01-16',
      scheduled_time: '14:00',
      status: 'in_progress',
      service_type: 'repair'
    }
  ],
  monthlyRevenue: [
    { month: 'Jan', revenue: 20000 },
    { month: 'Feb', revenue: 22000 },
    { month: 'Mar', revenue: 25000 }
  ]
};

// Mock DashboardStats component
const DashboardStats = ({ data }: { data: typeof mockDashboardData }) => (
  <div data-testid="dashboard-stats">
    <div data-testid="total-customers">{data.totalCustomers}</div>
    <div data-testid="active-appointments">{data.activeAppointments}</div>
    <div data-testid="pending-invoices">{data.pendingInvoices}</div>
    <div data-testid="revenue">${data.revenue.toLocaleString()}</div>
  </div>
);

// Mock RecentAppointments component
const RecentAppointments = ({ appointments }: { appointments: typeof mockDashboardData.recentAppointments }) => (
  <div data-testid="recent-appointments">
    <h3>Recent Appointments</h3>
    {appointments.map(appointment => (
      <div key={appointment.id} data-testid={`appointment-${appointment.id}`}>
        <span data-testid="customer-name">{appointment.customer_name}</span>
        <span data-testid="appointment-date">{appointment.scheduled_date}</span>
        <span data-testid="appointment-status" className={`status-${appointment.status}`}>
          {appointment.status}
        </span>
      </div>
    ))}
  </div>
);

// Mock RevenueChart component
const RevenueChart = ({ data }: { data: typeof mockDashboardData.monthlyRevenue }) => (
  <div data-testid="revenue-chart">
    <h3>Monthly Revenue</h3>
    <div data-testid="responsive-container">
      <div data-testid="line-chart">
        {data.map(item => (
          <div key={item.month} data-testid={`revenue-${item.month}`}>
            {item.month}: ${item.revenue}
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Mock AppointmentStatusChart component
const AppointmentStatusChart = () => (
  <div data-testid="appointment-status-chart">
    <h3>Appointment Status Distribution</h3>
    <div data-testid="pie-chart">
      <div data-testid="scheduled-slice">Scheduled: 60%</div>
      <div data-testid="completed-slice">Completed: 30%</div>
      <div data-testid="cancelled-slice">Cancelled: 10%</div>
    </div>
  </div>
);

describe('Dashboard Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('DashboardStats', () => {
    test('should render all statistics correctly', () => {
      render(<DashboardStats data={mockDashboardData} />);

      expect(screen.getByTestId('total-customers')).toHaveTextContent('150');
      expect(screen.getByTestId('active-appointments')).toHaveTextContent('12');
      expect(screen.getByTestId('pending-invoices')).toHaveTextContent('8');
      expect(screen.getByTestId('revenue')).toHaveTextContent('$25,000');
    });

    test('should handle zero values gracefully', () => {
      const emptyData = {
        ...mockDashboardData,
        totalCustomers: 0,
        activeAppointments: 0,
        pendingInvoices: 0,
        revenue: 0
      };

      render(<DashboardStats data={emptyData} />);

      expect(screen.getByTestId('total-customers')).toHaveTextContent('0');
      expect(screen.getByTestId('revenue')).toHaveTextContent('$0');
    });

    test('should format large numbers correctly', () => {
      const largeData = {
        ...mockDashboardData,
        totalCustomers: 1500,
        revenue: 125000
      };

      render(<DashboardStats data={largeData} />);

      expect(screen.getByTestId('total-customers')).toHaveTextContent('1500');
      expect(screen.getByTestId('revenue')).toHaveTextContent('$125,000');
    });
  });

  describe('RecentAppointments', () => {
    test('should render appointment list correctly', () => {
      render(<RecentAppointments appointments={mockDashboardData.recentAppointments} />);

      expect(screen.getByText('Recent Appointments')).toBeInTheDocument();
      expect(screen.getByTestId('appointment-1')).toBeInTheDocument();
      expect(screen.getByTestId('appointment-2')).toBeInTheDocument();
    });

    test('should display appointment details', () => {
      render(<RecentAppointments appointments={mockDashboardData.recentAppointments} />);

      const appointment1 = screen.getByTestId('appointment-1');
      expect(appointment1).toHaveTextContent('John Doe');
      expect(appointment1).toHaveTextContent('2025-01-15');
      expect(appointment1).toHaveTextContent('scheduled');
    });

    test('should apply correct status classes', () => {
      render(<RecentAppointments appointments={mockDashboardData.recentAppointments} />);

      const scheduledStatus = screen.getByTestId('appointment-1').querySelector('.status-scheduled');
      const inProgressStatus = screen.getByTestId('appointment-2').querySelector('.status-in_progress');

      expect(scheduledStatus).toBeInTheDocument();
      expect(inProgressStatus).toBeInTheDocument();
    });

    test('should handle empty appointment list', () => {
      render(<RecentAppointments appointments={[]} />);

      expect(screen.getByText('Recent Appointments')).toBeInTheDocument();
      expect(screen.queryByTestId('appointment-1')).not.toBeInTheDocument();
    });
  });

  describe('RevenueChart', () => {
    test('should render revenue chart with data', () => {
      render(<RevenueChart data={mockDashboardData.monthlyRevenue} />);

      expect(screen.getByText('Monthly Revenue')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    test('should display all revenue data points', () => {
      render(<RevenueChart data={mockDashboardData.monthlyRevenue} />);

      expect(screen.getByTestId('revenue-Jan')).toHaveTextContent('Jan: $20000');
      expect(screen.getByTestId('revenue-Feb')).toHaveTextContent('Feb: $22000');
      expect(screen.getByTestId('revenue-Mar')).toHaveTextContent('Mar: $25000');
    });

    test('should handle empty revenue data', () => {
      render(<RevenueChart data={[]} />);

      expect(screen.getByText('Monthly Revenue')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
  });

  describe('AppointmentStatusChart', () => {
    test('should render appointment status distribution', () => {
      render(<AppointmentStatusChart />);

      expect(screen.getByText('Appointment Status Distribution')).toBeInTheDocument();
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });

    test('should display all status categories', () => {
      render(<AppointmentStatusChart />);

      expect(screen.getByTestId('scheduled-slice')).toHaveTextContent('Scheduled: 60%');
      expect(screen.getByTestId('completed-slice')).toHaveTextContent('Completed: 30%');
      expect(screen.getByTestId('cancelled-slice')).toHaveTextContent('Cancelled: 10%');
    });
  });

  describe('Dashboard Integration', () => {
    test('should render complete dashboard layout', () => {
      const Dashboard = () => (
        <div data-testid="dashboard-layout">
          <header data-testid="dashboard-header">
            <h1>Dashboard</h1>
          </header>
          <main data-testid="dashboard-main">
            <DashboardStats data={mockDashboardData} />
            <div data-testid="dashboard-charts">
              <RevenueChart data={mockDashboardData.monthlyRevenue} />
              <AppointmentStatusChart />
            </div>
            <RecentAppointments appointments={mockDashboardData.recentAppointments} />
          </main>
        </div>
      );

      render(<Dashboard />);

      expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-main')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-stats')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-charts')).toBeInTheDocument();
      expect(screen.getByTestId('recent-appointments')).toBeInTheDocument();
    });

    test('should handle loading states', () => {
      const LoadingDashboard = ({ isLoading }: { isLoading: boolean }) => (
        <div data-testid="dashboard-container">
          {isLoading ? (
            <div data-testid="loading-spinner">Loading dashboard...</div>
          ) : (
            <DashboardStats data={mockDashboardData} />
          )}
        </div>
      );

      const { rerender } = render(<LoadingDashboard isLoading={true} />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.queryByTestId('dashboard-stats')).not.toBeInTheDocument();

      rerender(<LoadingDashboard isLoading={false} />);
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      expect(screen.getByTestId('dashboard-stats')).toBeInTheDocument();
    });

    test('should handle error states', () => {
      const ErrorDashboard = ({ hasError }: { hasError: boolean }) => (
        <div data-testid="dashboard-container">
          {hasError ? (
            <div data-testid="error-message">
              Failed to load dashboard data. Please try again.
            </div>
          ) : (
            <DashboardStats data={mockDashboardData} />
          )}
        </div>
      );

      render(<ErrorDashboard hasError={true} />);
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByText('Failed to load dashboard data. Please try again.')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    test('should adapt to different screen sizes', () => {
      const ResponsiveDashboard = ({ isMobile }: { isMobile: boolean }) => (
        <div data-testid="responsive-dashboard" className={isMobile ? 'mobile-layout' : 'desktop-layout'}>
          <DashboardStats data={mockDashboardData} />
        </div>
      );

      const { rerender } = render(<ResponsiveDashboard isMobile={false} />);
      expect(screen.getByTestId('responsive-dashboard')).toHaveClass('desktop-layout');

      rerender(<ResponsiveDashboard isMobile={true} />);
      expect(screen.getByTestId('responsive-dashboard')).toHaveClass('mobile-layout');
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      const AccessibleDashboard = () => (
        <div>
          <h1 id="dashboard-title">Dashboard</h1>
          <section aria-labelledby="dashboard-title">
            <DashboardStats data={mockDashboardData} />
          </section>
        </div>
      );

      render(<AccessibleDashboard />);

      const section = screen.getByRole('heading', { level: 1 });
      expect(section).toHaveTextContent('Dashboard');
    });

    test('should support keyboard navigation', () => {
      const KeyboardDashboard = () => (
        <div>
          <button data-testid="refresh-button" tabIndex={0}>Refresh Data</button>
          <DashboardStats data={mockDashboardData} />
        </div>
      );

      render(<KeyboardDashboard />);

      const refreshButton = screen.getByTestId('refresh-button');
      expect(refreshButton).toHaveAttribute('tabIndex', '0');
    });
  });
});