import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';

const AnalyticsDashboard = ({ data, role }) => {
  if (!data?.chartData) return null;

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3 style={{ fontWeight: 700, marginBottom: '1.5rem', fontSize: '1.1rem' }}>Analytics Overview</h3>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '1.5rem' }}>
        
        {/* Monthly Uploads Trend */}
        <div className="card">
          <h4 style={{ fontWeight: 600, marginBottom: '1rem', color: 'var(--text-secondary)' }}>Uploads Over Time</h4>
          <div style={{ height: 250, width: '100%' }}>
            <ResponsiveContainer>
              <LineChart data={data.chartData.byMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)' }}
                  itemStyle={{ color: 'var(--text)' }}
                />
                <Line type="monotone" dataKey="count" stroke="var(--accent)" strokeWidth={3} dot={{ r: 4, fill: 'var(--accent)' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Branch Uploads (Admin Only) */}
        {role === 'admin' && data.chartData.byBranch && (
          <div className="card">
            <h4 style={{ fontWeight: 600, marginBottom: '1rem', color: 'var(--text-secondary)' }}>Uploads by Branch</h4>
            <div style={{ height: 250, width: '100%' }}>
              <ResponsiveContainer>
                <BarChart data={data.chartData.byBranch}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: 'var(--accent-bg)' }}
                    contentStyle={{ background: 'var(--bg)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)' }}
                  />
                  <Bar dataKey="count" fill="var(--color-aids)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
